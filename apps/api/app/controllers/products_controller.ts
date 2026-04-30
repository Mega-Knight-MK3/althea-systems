import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import {
  createProductValidator,
  listProductsValidator,
  updateProductValidator,
} from '#validators/product'
import { listProducts } from '#services/product_search'
import { localizeNamed, pickLocale } from '#services/locale'

const SIMILAR_PRODUCT_LIMIT = 6

export default class ProductsController {
  async index({ request }: HttpContext) {
    const query = await listProductsValidator.validate(request.qs())
    const result = await listProducts(query)
    return localizePaginator(result, pickLocale(request.header('accept-language')))
  }

  async adminIndex({ request }: HttpContext) {
    const query = await listProductsValidator.validate(request.qs())
    return listProducts({ ...query, status: query.status ?? 'all' })
  }

  async show({ params, request }: HttpContext) {
    const product = await Product.query()
      .where('slug', params.slug)
      .preload('category')
      .firstOrFail()
    const locale = pickLocale(request.header('accept-language'))
    return localizeProduct(product, locale)
  }

  async similar({ params, request }: HttpContext) {
    const product = await Product.query().where('slug', params.slug).firstOrFail()
    if (!product.categoryId) return []

    const items = await Product.query()
      .where('isActive', true)
      .where('categoryId', product.categoryId)
      .whereNot('id', product.id)
      .orderByRaw('CASE WHEN stock > 0 THEN 0 ELSE 1 END asc')
      .orderBy('sortPriority', 'desc')
      .orderByRaw('RANDOM()')
      .limit(SIMILAR_PRODUCT_LIMIT)
      .preload('category')

    const locale = pickLocale(request.header('accept-language'))
    return items.map((item) => localizeProduct(item, locale))
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createProductValidator)
    const product = await Product.create(payload)
    return response.created(product)
  }

  async update({ params, request }: HttpContext) {
    const product = await Product.findOrFail(params.id)
    const payload = await request.validateUsing(updateProductValidator, {
      meta: { productId: product.id },
    })
    product.merge(payload)
    await product.save()
    return product
  }

  async destroy({ params, response }: HttpContext) {
    const product = await Product.findOrFail(params.id)
    await product.delete()
    return response.noContent()
  }
}

function localizeProduct(product: Product, locale: ReturnType<typeof pickLocale>) {
  const { name, description } = localizeNamed(product, locale)
  const serialized = product.serialize() as Record<string, unknown>
  serialized.name = name
  serialized.description = description
  if (serialized.category && typeof serialized.category === 'object') {
    const cat = serialized.category as Record<string, unknown>
    const localizedCat = localizeNamed(product.category, locale)
    cat.name = localizedCat.name
    cat.description = localizedCat.description
  }
  return serialized
}

interface PaginatedProducts {
  all(): Product[]
  getMeta(): unknown
}

function localizePaginator(result: PaginatedProducts, locale: ReturnType<typeof pickLocale>) {
  return {
    meta: result.getMeta(),
    data: result.all().map((p) => localizeProduct(p, locale)),
  }
}
