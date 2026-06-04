import { DateTime } from 'luxon'
import Order from '#models/order'
import Invoice from '#models/invoice'
import CreditNote from '#models/credit_note'
import { generateCreditNotePdf } from '#services/credit_note_generator'
import { stripeClient } from '#services/stripe_service'
import logger from '@adonisjs/core/services/logger'

export interface AutoCreditNoteOptions {
  reason: string
  amount?: number // If not provided, uses full order total
  stripeRefundId?: string
  refundMethod?: 'stripe' | 'manual' | 'bank_transfer'
  createStripeRefund?: boolean // If true, creates a Stripe refund
}

/**
 * Automatically creates a credit note for an order.
 * Optionally creates a Stripe refund if requested.
 */
export async function createAutoCreditNote(
  order: Order,
  options: AutoCreditNoteOptions
): Promise<CreditNote> {
  // Load order relationships
  await order.load('invoice')
  await order.load('user')

  if (!order.invoice) {
    throw new Error('Order does not have an invoice')
  }

  if (!order.user) {
    throw new Error('Order does not have a user')
  }

  const invoice = order.invoice
  const amount = options.amount ?? order.total

  // Generate credit note number
  const lastCount = await CreditNote.query().count('* as total')
  const total = Number(lastCount[0]?.$extras?.total ?? 0) + 1
  const creditNoteNumber = `AVO-${DateTime.now().toFormat('yyyyLLdd')}-${String(total).padStart(5, '0')}`

  // Create Stripe refund if requested
  let stripeRefundId = options.stripeRefundId
  let refundStatus: 'pending' | 'completed' | 'failed' = options.stripeRefundId ? 'completed' : 'pending'

  if (options.createStripeRefund && order.stripePaymentIntentId) {
    try {
      const refund = await stripeClient().refunds.create({
        payment_intent: order.stripePaymentIntentId,
        amount: Math.round(amount * 100), // Convert to cents
        reason: 'requested_by_customer',
      })
      stripeRefundId = refund.id
      refundStatus = refund.status === 'succeeded' ? 'completed' : 'pending'

      logger.info(
        { orderId: order.id, refundId: refund.id, amount },
        'Stripe refund created automatically'
      )
    } catch (err) {
      logger.error(
        { err, orderId: order.id, amount },
        'Failed to create Stripe refund for automatic credit note'
      )
      refundStatus = 'failed'
    }
  }

  // Create credit note
  const creditNote = await CreditNote.create({
    invoiceId: invoice.id,
    creditNoteNumber,
    amount,
    reason: options.reason,
    stripeRefundId,
    refundStatus,
    refundMethod: options.refundMethod ?? 'stripe',
    issuedAt: DateTime.now(),
  })

  // Generate PDF
  try {
    const customerName = order.user.fullName ?? order.user.email
    creditNote.pdfPath = await generateCreditNotePdf(creditNote, invoice, customerName)
    await creditNote.save()
  } catch (err) {
    logger.error(
      { err, creditNoteId: creditNote.id },
      'Failed to generate PDF for automatic credit note'
    )
  }

  logger.info(
    {
      orderId: order.id,
      invoiceId: invoice.id,
      creditNoteNumber,
      amount,
      reason: options.reason,
    },
    'Automatic credit note created'
  )

  return creditNote
}

/**
 * Checks if an order can be automatically canceled and refunded.
 * Orders can be auto-canceled if:
 * - Status is 'paid' or 'processing'
 * - Order is less than 24 hours old
 * - Has a Stripe payment intent
 */
export function canAutoCancelOrder(order: Order): boolean {
  if (!['paid', 'processing'].includes(order.status)) {
    return false
  }

  if (!order.stripePaymentIntentId) {
    return false
  }

  const hoursSincePlaced = DateTime.now().diff(order.placedAt, 'hours').hours
  return hoursSincePlaced < 24
}

/**
 * Automatically cancels an order and creates a credit note with refund.
 */
export async function autoCancelOrder(order: Order, reason: string): Promise<CreditNote> {
  if (!canAutoCancelOrder(order)) {
    throw new Error('Order cannot be automatically canceled')
  }

  const creditNote = await createAutoCreditNote(order, {
    reason,
    createStripeRefund: true,
    refundMethod: 'stripe',
  })

  order.status = 'cancelled'
  await order.save()

  logger.info(
    { orderId: order.id, creditNoteId: creditNote.id },
    'Order automatically canceled with refund'
  )

  return creditNote
}
