import User from '#models/user'
import PaymentMethod from '#models/payment_method'
import logger from '@adonisjs/core/services/logger'
import { stripeClient } from '#services/stripe_service'

export async function ensureStripeCustomer(user: User): Promise<string> {
  if (user.stripeCustomerId) return user.stripeCustomerId

  const customer = await stripeClient().customers.create({
    email: user.email,
    name: user.fullName ?? undefined,
    metadata: { user_id: String(user.id) },
  })

  user.stripeCustomerId = customer.id
  await user.save()

  await attachLegacyPaymentMethods(user.id, customer.id)
  return customer.id
}

async function attachLegacyPaymentMethods(userId: number, customerId: string) {
  const methods = await PaymentMethod.query().where('userId', userId)
  for (const method of methods) {
    try {
      await stripeClient().paymentMethods.attach(method.stripePaymentMethodId, {
        customer: customerId,
      })
    } catch (err) {
      logger.warn(
        { err, paymentMethodId: method.stripePaymentMethodId },
        'failed to attach legacy payment method to stripe customer'
      )
    }
  }
}
