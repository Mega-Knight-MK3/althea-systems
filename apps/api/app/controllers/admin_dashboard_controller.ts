import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Order from '#models/order'

const REVENUE_STATUSES = ['paid', 'processing', 'shipped', 'delivered']

export default class AdminDashboardController {
  async stats({}: HttpContext) {
    const now = DateTime.now()
    const startOfDay = now.startOf('day')
    const startOfWeek = now.startOf('week')
    const startOfMonth = now.startOf('month')

    const [revenueDay, revenueWeek, revenueMonth, todayOrders, outOfStock, unreadMessages, recentOrders] =
      await Promise.all([
        sumRevenueSince(startOfDay),
        sumRevenueSince(startOfWeek),
        sumRevenueSince(startOfMonth),
        countOrdersSince(startOfDay),
        countOutOfStockProducts(),
        countUnreadMessages(),
        Order.query().orderBy('createdAt', 'desc').limit(5).preload('user'),
      ])

    return {
      revenue: {
        day: revenueDay,
        week: revenueWeek,
        month: revenueMonth,
      },
      todayOrders,
      outOfStock,
      unreadMessages,
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
        customer: order.user?.fullName || order.user?.email || 'Client',
      })),
    }
  }
}

async function sumRevenueSince(since: DateTime) {
  const result = await db
    .from('orders')
    .whereIn('status', REVENUE_STATUSES)
    .where('created_at', '>=', since.toSQL()!)
    .sum({ total: 'total' })
  return Number(result[0]?.total ?? 0)
}

async function countOrdersSince(since: DateTime) {
  const result = await db
    .from('orders')
    .where('created_at', '>=', since.toSQL()!)
    .count('* as total')
  return Number(result[0]?.total ?? 0)
}

async function countOutOfStockProducts() {
  const result = await db
    .from('products')
    .where('is_active', true)
    .where('stock', '<=', 0)
    .count('* as total')
  return Number(result[0]?.total ?? 0)
}

async function countUnreadMessages() {
  const result = await db
    .from('contact_messages')
    .where('is_read', false)
    .count('* as total')
  return Number(result[0]?.total ?? 0)
}
