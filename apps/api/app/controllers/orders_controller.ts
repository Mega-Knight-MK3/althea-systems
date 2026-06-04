import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import { createReadStream } from 'node:fs'
import Order from '#models/order'
import OrderItem from '#models/order_item'
import Address from '#models/address'
import Invoice from '#models/invoice'
import { createOrderValidator } from '#validators/checkout'
import { quoteCart } from '#services/cart_pricing'
import { stripeClient, toMinorUnits } from '#services/stripe_service'
import { generateInvoicePdf } from '#services/invoice_generator'
import { sendInvoiceCopy } from '#services/account_mailer'
import { canAutoCancelOrder, autoCancelOrder } from '#services/credit_note_service'
import logger from '@adonisjs/core/services/logger'

export default class OrdersController {
  async index({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    return Order.query()
      .where('userId', user.id)
      .preload('items')
      .preload('invoice')
      .preload('billingAddress')
      .preload('paymentMethod')
      .orderBy('createdAt', 'desc')
  }

  async show({ auth, params }: HttpContext) {
    const user = auth.getUserOrFail()
    return Order.query()
      .where('id', params.id)
      .where('userId', user.id)
      .preload('items')
      .preload('billingAddress')
      .preload('shippingAddress')
      .preload('paymentMethod')
      .preload('invoice')
      .firstOrFail()
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createOrderValidator)

    // Check if payment intent already used (prevent race condition)
    const existingOrder = await Order.query()
      .where('stripePaymentIntentId', payload.paymentIntentId)
      .first()

    if (existingOrder) {
      throw new Exception('Ce paiement a déjà été utilisé pour une commande.', {
        status: 409,
        code: 'E_PAYMENT_INTENT_ALREADY_USED',
      })
    }

    const [billing, shipping] = await Promise.all([
      Address.query()
        .where('id', payload.billingAddressId)
        .where('userId', user.id)
        .firstOrFail(),
      Address.query()
        .where('id', payload.shippingAddressId)
        .where('userId', user.id)
        .firstOrFail(),
    ])

    const quote = await quoteCart(payload.items)
    if (quote.unavailable.length > 0) {
      return response.unprocessableEntity({
        message: 'Certains produits ne sont plus disponibles.',
        unavailable: quote.unavailable,
      })
    }

    // Retrieve and validate payment intent
    let intent
    try {
      intent = await stripeClient().paymentIntents.retrieve(payload.paymentIntentId)
    } catch (error) {
      logger.error({ error, paymentIntentId: payload.paymentIntentId }, 'Failed to retrieve payment intent')
      throw new Exception('Impossible de vérifier le paiement.', {
        status: 500,
        code: 'E_STRIPE_RETRIEVAL_FAILED',
      })
    }

    // Validate payment status
    if (intent.status !== 'succeeded') {
      return response.unprocessableEntity({
        message: `Le paiement n'a pas été confirmé (statut: ${intent.status}).`,
      })
    }

    // CRITICAL: Validate payment amount matches order total
    const expectedAmount = toMinorUnits(quote.total)
    if (intent.amount !== expectedAmount) {
      logger.warn(
        {
          userId: user.id,
          paymentIntentId: intent.id,
          expectedAmount,
          actualAmount: intent.amount,
        },
        'Payment amount mismatch detected'
      )
      throw new Exception(
        'Le montant du paiement ne correspond pas au montant de la commande.',
        {
          status: 422,
          code: 'E_PAYMENT_AMOUNT_MISMATCH',
        }
      )
    }

    // Validate payment belongs to this customer
    if (intent.customer !== user.stripeCustomerId) {
      logger.warn(
        {
          userId: user.id,
          paymentIntentId: intent.id,
          intentCustomer: intent.customer,
          userCustomer: user.stripeCustomerId,
        },
        'Payment customer mismatch detected'
      )
      throw new Exception('Ce paiement appartient à un autre utilisateur.', {
        status: 403,
        code: 'E_PAYMENT_CUSTOMER_MISMATCH',
      })
    }

    const order = await db.transaction(async (trx) => {
      const created = new Order()
      created.useTransaction(trx)
      created.merge({
        userId: user.id,
        status: 'paid',
        subtotal: quote.subtotal,
        tax: quote.tax,
        shippingCost: quote.shipping,
        total: quote.total,
        billingAddressId: billing.id,
        shippingAddressId: shipping.id,
        stripePaymentIntentId: intent.id,
        placedAt: DateTime.now(),
      })
      await created.save()

      for (const line of quote.lines) {
        const item = new OrderItem()
        item.useTransaction(trx)
        item.merge({
          orderId: created.id,
          productId: line.productId,
          productName: line.productName,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          total: line.total,
        })
        await item.save()
      }

      const invoiceNumber = `ALT-${DateTime.now().toFormat('yyyyLLdd')}-${created.id.toString().padStart(5, '0')}`
      const invoice = new Invoice()
      invoice.useTransaction(trx)
      invoice.merge({
        orderId: created.id,
        invoiceNumber,
        subtotal: quote.subtotal,
        tax: quote.tax,
        total: quote.total,
        issuedAt: DateTime.now(),
      })
      await invoice.save()

      return { order: created, invoiceNumber }
    })

    try {
      const pdfPath = await generateInvoicePdf(
        await Order.query().where('id', order.order.id).firstOrFail(),
        order.invoiceNumber
      )
      const invoiceRecord = await Invoice.query().where('orderId', order.order.id).firstOrFail()
      invoiceRecord.pdfPath = pdfPath
      await invoiceRecord.save()

      await sendInvoiceCopy(user, order.invoiceNumber)
    } catch (err) {
      logger.error({ err, orderId: order.order.id, invoiceNumber: order.invoiceNumber }, 'invoice.generation.failed')
    }

    return response.created({
      order: await Order.query()
        .where('id', order.order.id)
        .preload('items')
        .preload('invoice')
        .firstOrFail(),
    })
  }

  async downloadInvoice({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const order = await Order.query()
      .where('id', params.id)
      .where('userId', user.id)
      .preload('invoice')
      .firstOrFail()

    if (!order.invoice || !order.invoice.pdfPath) {
      return response.notFound({ message: 'Facture indisponible.' })
    }

    response.header('Content-Type', 'application/pdf')
    response.header(
      'Content-Disposition',
      `attachment; filename="${order.invoice.invoiceNumber}.pdf"`
    )
    return response.stream(createReadStream(order.invoice.pdfPath))
  }

  /**
   * Cancel an order and automatically create a credit note with Stripe refund.
   * Only available for orders less than 24 hours old with status 'paid' or 'processing'.
   */
  async cancel({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const order = await Order.query()
      .where('id', params.id)
      .where('userId', user.id)
      .firstOrFail()

    if (!canAutoCancelOrder(order)) {
      return response.badRequest({
        message:
          'Cette commande ne peut plus être annulée automatiquement. ' +
          'Veuillez contacter le service client pour une annulation.',
      })
    }

    try {
      const creditNote = await autoCancelOrder(order, 'Annulation client')

      return response.ok({
        message: 'Commande annulée avec succès. Un remboursement a été émis.',
        order: await Order.query()
          .where('id', order.id)
          .preload('invoice')
          .preload('items')
          .firstOrFail(),
        creditNote: creditNote.serialize(),
      })
    } catch (err) {
      logger.error({ err, orderId: order.id }, 'Failed to cancel order')
      return response.internalServerError({
        message: "Une erreur est survenue lors de l'annulation de la commande.",
      })
    }
  }
}
