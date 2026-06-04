import User from '#models/user'
import PaymentMethod from '#models/payment_method'
import logger from '@adonisjs/core/services/logger'
import { Exception } from '@adonisjs/core/exceptions'
import { stripeClient } from '#services/stripe_service'

export async function ensureStripeCustomer(user: User): Promise<string> {
  // Fast path: customer already exists
  if (user.stripeCustomerId) return user.stripeCustomerId

  // Prevent race condition with database lock
  const lockedUser = await User.query().where('id', user.id).forUpdate().firstOrFail()

  // Check again after acquiring lock
  if (lockedUser.stripeCustomerId) {
    return lockedUser.stripeCustomerId
  }

  try {
    const customer = await stripeClient().customers.create({
      email: user.email,
      name: user.fullName ?? undefined,
      metadata: {
        user_id: String(user.id),
        created_at: new Date().toISOString(),
      },
    })

    lockedUser.stripeCustomerId = customer.id
    await lockedUser.save()

    // Update the original user object
    user.stripeCustomerId = customer.id

    // Attach any existing payment methods
    await attachLegacyPaymentMethods(user.id, customer.id)

    return customer.id
  } catch (error) {
    logger.error({ error, userId: user.id }, 'Failed to create Stripe customer')
    throw new Exception('Impossible de créer le compte Stripe. Veuillez réessayer.', {
      status: 500,
      code: 'E_STRIPE_CUSTOMER_CREATION_FAILED',
    })
  }
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
