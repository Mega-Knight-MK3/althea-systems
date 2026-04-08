import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import PaymentMethod from '#models/payment_method'
import {
  createPaymentMethodValidator,
  updatePaymentMethodValidator,
} from '#validators/account'
import { stripeClient } from '#services/stripe_service'
import { ensureStripeCustomer } from '#services/stripe_customer'

export default class PaymentMethodsController {
  async index({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    return PaymentMethod.query()
      .where('userId', user.id)
      .orderBy('isDefault', 'desc')
      .orderBy('id', 'desc')
  }

  async setupIntent({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const customerId = await ensureStripeCustomer(user)
    const intent = await stripeClient().setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: { user_id: String(user.id), user_email: user.email },
    })
    return { clientSecret: intent.client_secret }
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createPaymentMethodValidator)

    const stripePm = await stripeClient().paymentMethods.retrieve(payload.stripePaymentMethodId)
    if (stripePm.type !== 'card' || !stripePm.card) {
      return response.unprocessableEntity({ message: 'Type de carte non supporté.' })
    }
    const card = stripePm.card

    const method = await db.transaction(async (trx) => {
      if (payload.isDefault) await clearDefault(user.id, trx)
      const created = new PaymentMethod()
      created.useTransaction(trx)
      created.merge({
        userId: user.id,
        type: 'card',
        stripePaymentMethodId: stripePm.id,
        brand: card.brand,
        lastFour: card.last4,
        expMonth: card.exp_month,
        expYear: card.exp_year,
        isDefault: payload.isDefault ?? false,
      })
      return created.save()
    })

    return response.created(method)
  }

  async update({ auth, params, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const method = await PaymentMethod.query()
      .where('id', params.id)
      .where('userId', user.id)
      .firstOrFail()
    const payload = await request.validateUsing(updatePaymentMethodValidator)

    return db.transaction(async (trx) => {
      if (payload.isDefault) await clearDefault(user.id, trx)
      method.useTransaction(trx)
      method.merge(payload)
      return method.save()
    })
  }

  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const method = await PaymentMethod.query()
      .where('id', params.id)
      .where('userId', user.id)
      .firstOrFail()

    if (user.stripeCustomerId) {
      try {
        await stripeClient().paymentMethods.detach(method.stripePaymentMethodId)
      } catch {}
    }

    await method.delete()
    return response.noContent()
  }
}

async function clearDefault(
  userId: number,
  trx: ReturnType<typeof db.transaction> extends Promise<infer T> ? T : never
) {
  await trx.from('payment_methods').where('user_id', userId).update({ is_default: false })
}
