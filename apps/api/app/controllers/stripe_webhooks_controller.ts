import type { HttpContext } from '@adonisjs/core/http'
import Stripe from 'stripe'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'
import { stripeClient } from '#services/stripe_service'
import Order from '#models/order'
import CreditNote from '#models/credit_note'
import { DateTime } from 'luxon'
import { createAutoCreditNote } from '#services/credit_note_service'

export default class StripeWebhooksController {
  async handle({ request, response }: HttpContext) {
    const signature = request.header('stripe-signature')
    if (!signature) {
      logger.warn('Received webhook without stripe-signature header')
      return response.badRequest({ message: 'Missing stripe-signature header' })
    }

    const webhookSecret = env.get('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) {
      logger.error('STRIPE_WEBHOOK_SECRET not configured')
      return response.internalServerError({ message: 'Webhook secret not configured' })
    }

    let event: Stripe.Event
    try {
      event = stripeClient().webhooks.constructEvent(
        request.raw() as string | Buffer,
        signature,
        webhookSecret
      )
    } catch (error) {
      logger.error({ error }, 'Webhook signature verification failed')
      return response.badRequest({ message: 'Invalid signature' })
    }

    logger.info({ type: event.type, id: event.id }, 'Processing Stripe webhook')

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
          break

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
          break

        case 'payment_intent.canceled':
          await this.handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent)
          break

        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object as Stripe.Charge)
          break

        case 'charge.dispute.created':
          await this.handleDisputeCreated(event.data.object as Stripe.Dispute)
          break

        case 'customer.subscription.deleted':
        case 'customer.subscription.updated':
          // Handle subscription events if needed in the future
          logger.info({ type: event.type }, 'Subscription event received but not handled')
          break

        default:
          logger.debug({ type: event.type }, 'Unhandled webhook event type')
      }

      return response.ok({ received: true })
    } catch (error) {
      logger.error({ error, eventType: event.type, eventId: event.id }, 'Failed to process webhook event')
      return response.internalServerError({ message: 'Failed to process webhook' })
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    logger.info(
      { paymentIntentId: paymentIntent.id, amount: paymentIntent.amount },
      'Payment intent succeeded'
    )

    // Find order with this payment intent
    const order = await Order.query()
      .where('stripePaymentIntentId', paymentIntent.id)
      .first()

    if (order && order.status === 'pending') {
      order.status = 'paid'
      order.placedAt = DateTime.now()
      await order.save()
      logger.info({ orderId: order.id }, 'Order marked as paid from webhook')
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    logger.warn(
      {
        paymentIntentId: paymentIntent.id,
        lastError: paymentIntent.last_payment_error?.message,
      },
      'Payment intent failed'
    )

    const order = await Order.query()
      .where('stripePaymentIntentId', paymentIntent.id)
      .first()

    if (order && order.status !== 'cancelled') {
      order.status = 'cancelled'
      await order.save()
      logger.info({ orderId: order.id }, 'Order cancelled due to payment failure')
    }
  }

  private async handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
    logger.info({ paymentIntentId: paymentIntent.id }, 'Payment intent canceled')

    const order = await Order.query()
      .where('stripePaymentIntentId', paymentIntent.id)
      .first()

    if (order && order.status !== 'cancelled') {
      order.status = 'cancelled'
      await order.save()
      logger.info({ orderId: order.id }, 'Order cancelled from webhook')
    }
  }

  private async handleChargeRefunded(charge: Stripe.Charge) {
    logger.warn(
      {
        chargeId: charge.id,
        amount: charge.amount_refunded,
        paymentIntentId: charge.payment_intent,
      },
      'Charge refunded'
    )

    if (charge.payment_intent) {
      const order = await Order.query()
        .where('stripePaymentIntentId', String(charge.payment_intent))
        .first()

      if (order) {
        // Check if credit note already exists for this refund
        await order.load('invoice')
        if (order.invoice) {
          const existingCreditNote = await CreditNote.query()
            .where('invoiceId', order.invoice.id)
            .where('stripeRefundId', charge.refund as string)
            .first()

          if (!existingCreditNote) {
            // Automatically create credit note for the refund
            try {
              const refundAmount = charge.amount_refunded / 100 // Convert from cents to euros
              await createAutoCreditNote(order, {
                reason: 'Remboursement Stripe',
                amount: refundAmount,
                stripeRefundId: charge.refund as string,
                refundMethod: 'stripe',
              })
              logger.info(
                { orderId: order.id, refundAmount },
                'Automatic credit note created for Stripe refund'
              )
            } catch (err) {
              logger.error(
                { err, orderId: order.id },
                'Failed to create automatic credit note for refund'
              )
            }
          }
        }

        if (order.status !== 'refunded') {
          order.status = 'refunded'
          await order.save()
          logger.info({ orderId: order.id }, 'Order marked as refunded from webhook')
        }
      }
    }
  }

  private async handleDisputeCreated(dispute: Stripe.Dispute) {
    logger.error(
      {
        disputeId: dispute.id,
        chargeId: dispute.charge,
        amount: dispute.amount,
        reason: dispute.reason,
      },
      'Payment dispute created - manual review required'
    )

    // In a production system, you might want to:
    // 1. Send email notifications to admin
    // 2. Create a task in a ticketing system
    // 3. Flag the order for review
    // 4. Update order status to 'disputed'
  }
}
