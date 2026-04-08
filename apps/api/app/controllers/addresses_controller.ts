import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Address from '#models/address'
import { createAddressValidator, updateAddressValidator } from '#validators/account'

export default class AddressesController {
  async index({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    return Address.query().where('userId', user.id).orderBy('isDefault', 'desc').orderBy('id', 'desc')
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createAddressValidator)

    const address = await db.transaction(async (trx) => {
      if (payload.isDefault) await clearDefault(user.id, payload.type, trx)
      const created = new Address()
      created.useTransaction(trx)
      created.merge({ ...payload, userId: user.id, isDefault: payload.isDefault ?? false })
      return created.save()
    })

    return response.created(address)
  }

  async update({ auth, params, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const address = await Address.query()
      .where('id', params.id)
      .where('userId', user.id)
      .firstOrFail()
    const payload = await request.validateUsing(updateAddressValidator)

    return db.transaction(async (trx) => {
      if (payload.isDefault) await clearDefault(user.id, payload.type ?? address.type, trx)
      address.useTransaction(trx)
      address.merge(payload)
      return address.save()
    })
  }

  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const address = await Address.query()
      .where('id', params.id)
      .where('userId', user.id)
      .firstOrFail()
    await address.delete()
    return response.noContent()
  }
}

async function clearDefault(userId: number, type: string, trx: ReturnType<typeof db.transaction> extends Promise<infer T> ? T : never) {
  await trx
    .from('addresses')
    .where('user_id', userId)
    .where('type', type)
    .update({ is_default: false })
}
