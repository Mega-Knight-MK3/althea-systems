import type { HttpContext } from '@adonisjs/core/http'
import Category from '#models/category'
import { createCategoryValidator, updateCategoryValidator } from '#validators/category'
import { localizeNamed, pickLocale, type Locale } from '#services/locale'

export default class CategoriesController {
  async index({ request }: HttpContext) {
    const categories = await Category.query().orderBy('position', 'asc').orderBy('name', 'asc')
    const locale = pickLocale(request.header('accept-language'))
    return categories.map((c) => localizeCategory(c, locale))
  }

  async show({ params, request }: HttpContext) {
    const category = await Category.query()
      .where('slug', params.slug)
      .preload('children', (q) => q.orderBy('position', 'asc'))
      .firstOrFail()
    const locale = pickLocale(request.header('accept-language'))
    return localizeCategory(category, locale)
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

function localizeCategory(category: Category, locale: Locale): Record<string, unknown> {
  const { name, description } = localizeNamed(category, locale)
  const serialized = category.serialize() as Record<string, unknown>
  serialized.name = name
  serialized.description = description
  const children = serialized.children as Array<Record<string, unknown>> | undefined
  if (Array.isArray(children) && category.children) {
    serialized.children = category.children.map((child) => {
      const localizedChild = localizeNamed(child, locale)
      const childSerialized = child.serialize() as Record<string, unknown>
      childSerialized.name = localizedChild.name
      childSerialized.description = localizedChild.description
      return childSerialized
    })
  }
  return serialized
}
