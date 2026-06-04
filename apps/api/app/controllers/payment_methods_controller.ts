import type { HttpContext } from '@adonisjs/core/http'
import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import logger from '@adonisjs/core/services/logger'
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

    let stripePm
    try {
      stripePm = await stripeClient().paymentMethods.retrieve(payload.stripePaymentMethodId)
    } catch (error) {
      logger.error({ error, paymentMethodId: payload.stripePaymentMethodId }, 'Failed to retrieve payment method')
      throw new Exception('Méthode de paiement invalide.', {
        status: 422,
        code: 'E_INVALID_PAYMENT_METHOD',
      })
    }

    if (stripePm.type !== 'card' || !stripePm.card) {
      return response.unprocessableEntity({ message: 'Type de carte non supporté.' })
    }

    // CRITICAL: Verify payment method belongs to this customer
    const customerId = await ensureStripeCustomer(user)
    if (stripePm.customer && stripePm.customer !== customerId) {
      logger.warn(
        {
          userId: user.id,
          paymentMethodId: stripePm.id,
          pmCustomer: stripePm.customer,
          userCustomer: customerId,
        },
        'Attempted to save payment method from different customer'
      )
      throw new Exception('Cette méthode de paiement appartient à un autre utilisateur.', {
        status: 403,
        code: 'E_PAYMENT_METHOD_FORBIDDEN',
      })
    }

    // Attach payment method to customer if not already attached
    if (!stripePm.customer) {
      try {
        await stripeClient().paymentMethods.attach(stripePm.id, {
          customer: customerId,
        })
      } catch (error) {
        logger.error({ error, paymentMethodId: stripePm.id }, 'Failed to attach payment method')
        throw new Exception("Impossible d'attacher la méthode de paiement.", {
          status: 500,
          code: 'E_PAYMENT_METHOD_ATTACH_FAILED',
        })
      }
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
      } catch (error) {
        logger.warn(
          { error, paymentMethodId: method.stripePaymentMethodId, userId: user.id },
          'Failed to detach payment method from Stripe (continuing with local deletion)'
        )
      }
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
