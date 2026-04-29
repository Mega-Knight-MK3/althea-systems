import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Category from '#models/category'
import {
  bulkSetCategoryStatusValidator,
  reorderCategoriesValidator,
} from '#validators/category'

export default class AdminCategoriesController {
  async index() {
    const categories = await Category.query().orderBy('position', 'asc').orderBy('name', 'asc')
    const counts = await db
      .from('products')
      .select('category_id')
      .count('* as total')
      .groupBy('category_id')

    const countByCategory = new Map<number, number>()
    for (const row of counts) {
      if (row.category_id !== null) countByCategory.set(Number(row.category_id), Number(row.total))
    }

    return categories.map((category) => ({
      ...category.serialize(),
      productCount: countByCategory.get(category.id) ?? 0,
    }))
  }

  async reorder({ request, response }: HttpContext) {
    const { items } = await request.validateUsing(reorderCategoriesValidator)
    await db.transaction(async (trx) => {
      for (const item of items) {
        await trx.from('categories').where('id', item.id).update({ position: item.position })
      }
    })
    return response.noContent()
  }

  async bulkStatus({ request, response }: HttpContext) {
    const { ids, isActive } = await request.validateUsing(bulkSetCategoryStatusValidator)
    await db.from('categories').whereIn('id', ids).update({ is_active: isActive })
    return response.noContent()
  }
}
