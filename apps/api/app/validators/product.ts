import vine from '@vinejs/vine'

const slug = vine
  .string()
  .trim()
  .minLength(2)
  .maxLength(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const vatRate = vine.number().min(0).max(50)

export const createProductValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(255),
    slug: slug.clone().unique({ table: 'products', column: 'slug' }),
    description: vine.string().trim().maxLength(8000).optional(),
    price: vine.number().positive(),
    vatRate: vatRate.clone().optional(),
    stock: vine.number().withoutDecimals().min(0).optional(),
    categoryId: vine.number().positive().optional(),
    isActive: vine.boolean().optional(),
    sortPriority: vine.number().withoutDecimals().min(0).optional(),
  })
)

export const updateProductValidator = vine.withMetaData<{ productId: number }>().compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(255).optional(),
    slug: slug
      .clone()
      .unique(async (db, value, field) => {
        const row = await db
          .from('products')
          .where('slug', value)
          .whereNot('id', field.meta.productId)
          .first()
        return !row
      })
      .optional(),
    description: vine.string().trim().maxLength(8000).nullable().optional(),
    price: vine.number().positive().optional(),
    vatRate: vatRate.clone().optional(),
    stock: vine.number().withoutDecimals().min(0).optional(),
    categoryId: vine.number().positive().nullable().optional(),
    isActive: vine.boolean().optional(),
    sortPriority: vine.number().withoutDecimals().min(0).optional(),
  })
)

export const listProductsValidator = vine.compile(
  vine.object({
    q: vine.string().trim().minLength(1).maxLength(120).optional(),
    categoryId: vine.number().positive().optional(),
    minPrice: vine.number().min(0).optional(),
    maxPrice: vine.number().min(0).optional(),
    inStockOnly: vine.boolean().optional(),
    sort: vine.enum(['priority', 'price', 'date', 'stock', 'relevance', 'name'] as const).optional(),
    order: vine.enum(['asc', 'desc'] as const).optional(),
    page: vine.number().withoutDecimals().min(1).optional(),
    perPage: vine.number().withoutDecimals().min(1).max(100).optional(),
    status: vine.enum(['active', 'inactive', 'all'] as const).optional(),
  })
)
