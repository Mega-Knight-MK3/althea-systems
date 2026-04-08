import type { HttpContext } from '@adonisjs/core/http'
import { quoteValidator, createPaymentIntentValidator } from '#validators/checkout'
import { quoteCart } from '#services/cart_pricing'
import { stripeClient, stripeCurrency, toMinorUnits } from '#services/stripe_service'

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

    const intent = await stripeClient().paymentIntents.create({
      amount: toMinorUnits(quote.total),
      currency: stripeCurrency(),
      automatic_payment_methods: { enabled: true },
      metadata: { user_id: String(user.id) },
    })

    return {
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      quote,
    }
  }
}
