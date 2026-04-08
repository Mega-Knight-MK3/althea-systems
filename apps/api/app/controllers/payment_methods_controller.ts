import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import PaymentMethod from '#models/payment_method'
import {
  createPaymentMethodValidator,
  updatePaymentMethodValidator,
} from '#validators/account'

export default class PaymentMethodsController {
  async index({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    return PaymentMethod.query()
      .where('userId', user.id)
      .orderBy('isDefault', 'desc')
      .orderBy('id', 'desc')
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createPaymentMethodValidator)

    const method = await db.transaction(async (trx) => {
      if (payload.isDefault) await clearDefault(user.id, trx)
      const created = new PaymentMethod()
      created.useTransaction(trx)
      created.merge({
        userId: user.id,
        type: payload.type ?? 'card',
        stripePaymentMethodId: payload.stripePaymentMethodId,
        brand: payload.brand ?? null,
        lastFour: payload.lastFour,
        expMonth: payload.expMonth ?? null,
        expYear: payload.expYear ?? null,
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
