import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import {
  createProductValidator,
  listProductsValidator,
  updateProductValidator,
} from '#validators/product'
import { listProducts } from '#services/product_search'

const SIMILAR_PRODUCT_LIMIT = 6

export default class ProductsController {
  async index({ request }: HttpContext) {
    const query = await listProductsValidator.validate(request.qs())
    return listProducts(query)
  }

  async adminIndex({ request }: HttpContext) {
    const query = await listProductsValidator.validate(request.qs())
    return listProducts({ ...query, status: query.status ?? 'all' })
  }

  async show({ params }: HttpContext) {
    return Product.query().where('slug', params.slug).preload('category').firstOrFail()
  }

  async similar({ params }: HttpContext) {
    const product = await Product.query().where('slug', params.slug).firstOrFail()
    if (!product.categoryId) return []

    return Product.query()
      .where('isActive', true)
      .where('categoryId', product.categoryId)
      .whereNot('id', product.id)
      .orderByRaw('CASE WHEN stock > 0 THEN 0 ELSE 1 END asc')
      .orderBy('sortPriority', 'desc')
      .orderByRaw('RANDOM()')
      .limit(SIMILAR_PRODUCT_LIMIT)
      .preload('category')
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
