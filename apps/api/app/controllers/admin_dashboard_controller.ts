import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Order from '#models/order'
import { salesRangeValidator } from '#validators/admin_dashboard'

const REVENUE_STATUSES = ['paid', 'processing', 'shipped', 'delivered']
const UNCATEGORIZED_LABEL = 'Sans catégorie'

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

  async sales({ request }: HttpContext) {
    const { range = '7d' } = await request.validateUsing(salesRangeValidator)
    const buckets = range === '5w' ? buildWeekBuckets(5) : buildDayBuckets(7)
    const since = buckets[0].start

    const rows = await db
      .from('order_items')
      .innerJoin('orders', 'orders.id', 'order_items.order_id')
      .leftJoin('products', 'products.id', 'order_items.product_id')
      .leftJoin('categories', 'categories.id', 'products.category_id')
      .whereIn('orders.status', REVENUE_STATUSES)
      .where('orders.created_at', '>=', since.toSQL()!)
      .select(
        db.raw('orders.created_at as order_created_at'),
        db.raw('coalesce(categories.name, ?) as category_name', [UNCATEGORIZED_LABEL]),
        db.raw('order_items.total::numeric as total')
      )

    const categoryTotals = new Map<string, number>()
    const stackByCategory = new Map<string, number[]>()
    const bucketTotals = new Array(buckets.length).fill(0)

    for (const row of rows) {
      const itemTotal = Number(row.total ?? 0)
      const category = row.category_name as string
      const placedAt = DateTime.fromJSDate(new Date(row.order_created_at))
      const idx = findBucketIndex(buckets, placedAt)
      if (idx === -1) continue

      bucketTotals[idx] += itemTotal
      categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + itemTotal)

      const series = stackByCategory.get(category) ?? new Array(buckets.length).fill(0)
      series[idx] += itemTotal
      stackByCategory.set(category, series)
    }

    return {
      range,
      bucketLabels: buckets.map((b) => b.label),
      totals: bucketTotals.map(round2),
      byCategory: [...categoryTotals.entries()]
        .map(([name, total]) => ({ name, total: round2(total) }))
        .sort((a, b) => b.total - a.total),
      stackedByCategory: [...stackByCategory.entries()]
        .map(([name, values]) => ({ name, values: values.map(round2) }))
        .sort((a, b) => sumArray(b.values) - sumArray(a.values)),
    }
  }
}

interface Bucket {
  start: DateTime
  end: DateTime
  label: string
}

function buildDayBuckets(count: number): Bucket[] {
  const today = DateTime.now().startOf('day')
  return Array.from({ length: count }, (_, i) => {
    const start = today.minus({ days: count - 1 - i })
    return {
      start,
      end: start.plus({ days: 1 }),
      label: start.setLocale('fr').toFormat('ccc dd/LL'),
    }
  })
}

function buildWeekBuckets(count: number): Bucket[] {
  const thisWeek = DateTime.now().startOf('week')
  return Array.from({ length: count }, (_, i) => {
    const start = thisWeek.minus({ weeks: count - 1 - i })
    return {
      start,
      end: start.plus({ weeks: 1 }),
      label: `S${start.weekNumber}`,
    }
  })
}

function findBucketIndex(buckets: Bucket[], when: DateTime) {
  return buckets.findIndex((b) => when >= b.start && when < b.end)
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

function sumArray(values: number[]) {
  return values.reduce((acc, v) => acc + v, 0)
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
