import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import PasswordReset from '#models/password_reset'
import Address from '#models/address'
import Order from '#models/order'
import { listUsersValidator, updateUserAdminValidator } from '#validators/admin_users'
import { createToken } from '#services/token_factory'
import { sendPasswordReset } from '#services/account_mailer'

const REVENUE_STATUSES = ['paid', 'processing', 'shipped', 'delivered']
const RESET_TTL_HOURS = 24

export default class AdminUsersController {
  async index({ request }: HttpContext) {
    const { q, status, page = 1, perPage = 25 } = await listUsersValidator.validate(request.qs())

    const builder = User.query()

    if (status === 'active') builder.where('isActive', true).whereNotNull('emailVerifiedAt')
    else if (status === 'inactive') builder.where('isActive', false)
    else if (status === 'pending') builder.where('isActive', true).whereNull('emailVerifiedAt')

    if (q) {
      builder.where((sub) => {
        const pattern = `%${q}%`
        sub.whereILike('email', pattern).orWhereILike('fullName', pattern)
      })
    }

    builder.orderBy('createdAt', 'desc')

    const result = await builder.paginate(page, perPage)
    const ids = result.all().map((u) => u.id)
    const stats = await loadOrderStats(ids)

    return {
      meta: result.getMeta(),
      data: result.all().map((user) => ({
        ...user.serialize(),
        orderCount: stats.get(user.id)?.orderCount ?? 0,
        totalRevenue: stats.get(user.id)?.totalRevenue ?? 0,
        accountStatus: deriveStatus(user),
      })),
    }
  }

  async show({ params }: HttpContext) {
    const user = await User.findOrFail(params.id)
    const [addresses, orders, stats] = await Promise.all([
      Address.query().where('userId', user.id).orderBy('isDefault', 'desc'),
      Order.query().where('userId', user.id).orderBy('createdAt', 'desc').limit(10),
      loadOrderStats([user.id]),
    ])
    const summary = stats.get(user.id) ?? { orderCount: 0, totalRevenue: 0 }
    return {
      user: { ...user.serialize(), accountStatus: deriveStatus(user) },
      addresses,
      orders,
      orderCount: summary.orderCount,
      totalRevenue: summary.totalRevenue,
    }
  }

  async update({ params, request }: HttpContext) {
    const user = await User.findOrFail(params.id)
    const payload = await request.validateUsing(updateUserAdminValidator)
    user.merge(payload)
    await user.save()
    return { user: { ...user.serialize(), accountStatus: deriveStatus(user) } }
  }

  async destroy({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    if (user.role === 'admin') {
      return response.unprocessableEntity({
        message: 'Impossible de supprimer un compte administrateur.',
      })
    }
    await user.delete()
    return response.noContent()
  }

  async sendPasswordReset({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    const { value, hash } = createToken()
    await PasswordReset.create({
      userId: user.id,
      tokenHash: hash,
      expiresAt: DateTime.now().plus({ hours: RESET_TTL_HOURS }),
    })
    await sendPasswordReset(user, value)
    return response.accepted({ message: 'Email de réinitialisation envoyé.' })
  }
}

interface OrderStats {
  orderCount: number
  totalRevenue: number
}

async function loadOrderStats(userIds: number[]): Promise<Map<number, OrderStats>> {
  const map = new Map<number, OrderStats>()
  if (!userIds.length) return map
  const rows = await db
    .from('orders')
    .whereIn('user_id', userIds)
    .groupBy('user_id')
    .select('user_id')
    .select(db.raw('COUNT(*)::int as order_count'))
    .select(
      db.raw(
        'COALESCE(SUM(CASE WHEN status IN (?, ?, ?, ?) THEN total ELSE 0 END), 0)::numeric as total_revenue',
        REVENUE_STATUSES
      )
    )
  for (const row of rows) {
    map.set(Number(row.user_id), {
      orderCount: Number(row.order_count ?? 0),
      totalRevenue: Number(row.total_revenue ?? 0),
    })
  }
  return map
}

function deriveStatus(user: User): 'active' | 'inactive' | 'pending' {
  if (!user.isActive) return 'inactive'
  return user.emailVerifiedAt ? 'active' : 'pending'
}
