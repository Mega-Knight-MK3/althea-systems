import type { HttpContext } from '@adonisjs/core/http'
import { Exception } from '@adonisjs/core/exceptions'
import logger from '@adonisjs/core/services/logger'
import { quoteValidator, createPaymentIntentValidator } from '#validators/checkout'
import { quoteCart } from '#services/cart_pricing'
import { stripeClient, stripeCurrency, toMinorUnits } from '#services/stripe_service'
import { ensureStripeCustomer } from '#services/stripe_customer'

export default class CheckoutController {
  async quote({ request }: HttpContext) {
    const { items } = await request.validateUsing(quoteValidator)
    return quoteCart(items)
  }

  async createPaymentIntent({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { items } = await request.validateUsing(createPaymentIntentValidator)
    const quote = await quoteCart(items)

    if (quote.unavailable.length > 0) {
      return response.unprocessableEntity({
        message: 'Certains produits du panier ne sont plus disponibles.',
        unavailable: quote.unavailable,
      })
    }

    if (quote.total <= 0) {
      return response.unprocessableEntity({ message: 'Panier vide.' })
    }

    const customerId = await ensureStripeCustomer(user)

    try {
      const intent = await stripeClient().paymentIntents.create(
        {
          amount: toMinorUnits(quote.total),
          currency: stripeCurrency(),
          customer: customerId,
          setup_future_usage: 'off_session',
          automatic_payment_methods: { enabled: true },
          metadata: {
            user_id: String(user.id),
            user_email: user.email,
            cart_items: JSON.stringify(
              items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
            ),
            quote_total: String(quote.total),
            timestamp: new Date().toISOString(),
          },
        },
        {
          idempotencyKey: `pi-${user.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        }
      )

      return {
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id,
        quote,
      }
    } catch (error) {
      logger.error({ error, userId: user.id }, 'Failed to create Stripe payment intent')
      throw new Exception('Impossible de créer le paiement. Veuillez réessayer.', {
        status: 500,
        code: 'E_STRIPE_PAYMENT_INTENT_FAILED',
      })
    }
  }
}
