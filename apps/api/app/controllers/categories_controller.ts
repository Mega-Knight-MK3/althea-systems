import type { HttpContext } from '@adonisjs/core/http'
import Category from '#models/category'
import { createCategoryValidator, updateCategoryValidator } from '#validators/category'

export default class CategoriesController {
  async index() {
    return Category.query().orderBy('position', 'asc').orderBy('name', 'asc')
  }

  async show({ params }: HttpContext) {
    return Category.query()
      .where('slug', params.slug)
      .preload('children', (q) => q.orderBy('position', 'asc'))
      .firstOrFail()
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createCategoryValidator)
    const category = await Category.create(payload)
    return response.created(category)
  }

  async update({ params, request }: HttpContext) {
    const category = await Category.findOrFail(params.id)
    const payload = await request.validateUsing(updateCategoryValidator, {
      meta: { categoryId: category.id },
    })
    category.merge(payload)
    await category.save()
    return category
  }

  async destroy({ params, response }: HttpContext) {
    const category = await Category.findOrFail(params.id)
    await category.delete()
    return response.noContent()
  }
}
