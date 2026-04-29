import type { HttpContext } from '@adonisjs/core/http'
import Order from '#models/order'
import OrderStatusHistory from '#models/order_status_history'
import { listOrdersValidator, updateOrderStatusValidator } from '#validators/admin_orders'

export default class AdminOrdersController {
  async index({ request }: HttpContext) {
    const { q, status, userId, page = 1, perPage = 25 } = await listOrdersValidator.validate(
      request.qs()
    )

    const builder = Order.query().preload('user').preload('invoice').preload('paymentMethod')

    if (status && status !== 'all') builder.where('status', status)
    if (userId) builder.where('userId', userId)
    if (q) {
      const pattern = `%${q}%`
      const numeric = Number.parseInt(q, 10)
      builder.where((sub) => {
        sub
          .whereHas('user', (userQuery) => {
            userQuery.where((userSub) => {
              userSub.whereILike('email', pattern).orWhereILike('full_name', pattern)
            })
          })
          .if(!Number.isNaN(numeric), (chain) => chain.orWhere('id', numeric))
      })
    }

    builder.orderBy('createdAt', 'desc')
    const result = await builder.paginate(page, perPage)
    return {
      meta: result.getMeta(),
      data: result.all().map((order) => ({
        ...order.serialize(),
        customer: order.user?.fullName || order.user?.email || 'Client',
        customerEmail: order.user?.email ?? null,
      })),
    }
  }

  async show({ params }: HttpContext) {
    const order = await Order.query()
      .where('id', params.id)
      .preload('user')
      .preload('items')
      .preload('billingAddress')
      .preload('shippingAddress')
      .preload('paymentMethod')
      .preload('invoice')
      .firstOrFail()

    const history = await OrderStatusHistory.query()
      .where('orderId', order.id)
      .preload('changedBy')
      .orderBy('createdAt', 'asc')

    return { order, history }
  }

  async updateStatus({ auth, params, request }: HttpContext) {
    const admin = auth.getUserOrFail()
    const order = await Order.findOrFail(params.id)
    const { status, note } = await request.validateUsing(updateOrderStatusValidator)

    if (order.status === status) return { order }

    const fromStatus = order.status
    order.status = status
    await order.save()

    await OrderStatusHistory.create({
      orderId: order.id,
      fromStatus,
      toStatus: status,
      note: note ?? null,
      changedByUserId: admin.id,
    })

    return { order }
  }
}
