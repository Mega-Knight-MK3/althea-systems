import Product from '#models/product'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

export type SortKey = 'priority' | 'price' | 'date' | 'stock' | 'relevance'
export type SortOrder = 'asc' | 'desc'

export interface ProductListQuery {
  q?: string
  categoryId?: number
  minPrice?: number
  maxPrice?: number
  inStockOnly?: boolean
  sort?: SortKey
  order?: SortOrder
  page?: number
  perPage?: number
}

const DEFAULT_PAGE = 1
const DEFAULT_PER_PAGE = 24
const RELEVANCE_RANK_SQL = `
  CASE
    WHEN LOWER(name) = LOWER(?) THEN 0
    WHEN LOWER(name) LIKE LOWER(?) || '%' THEN 1
    WHEN LOWER(name) LIKE '%' || LOWER(?) || '%' THEN 2
    WHEN LOWER(COALESCE(description, '')) LIKE '%' || LOWER(?) || '%' THEN 3
    ELSE 4
  END
`

export async function listProducts(query: ProductListQuery) {
  const builder = Product.query().preload('category')

  applyFilters(builder, query)
  applySort(builder, query)

  const page = query.page ?? DEFAULT_PAGE
  const perPage = query.perPage ?? DEFAULT_PER_PAGE
  return builder.paginate(page, perPage)
}

function applyFilters(
  builder: ModelQueryBuilderContract<typeof Product>,
  query: ProductListQuery
) {
  builder.where('isActive', true)

  if (query.q) applyFuzzyTextFilter(builder, query.q)
  if (query.categoryId) builder.where('categoryId', query.categoryId)
  if (query.minPrice !== undefined) builder.where('price', '>=', query.minPrice)
  if (query.maxPrice !== undefined) builder.where('price', '<=', query.maxPrice)
  if (query.inStockOnly) builder.where('stock', '>', 0)
}

function applyFuzzyTextFilter(
  builder: ModelQueryBuilderContract<typeof Product>,
  needle: string
) {
  const pattern = `%${needle}%`
  builder.where((sub) => {
    sub.whereILike('name', pattern).orWhereILike('description', pattern)
  })
}

function applySort(
  builder: ModelQueryBuilderContract<typeof Product>,
  query: ProductListQuery
) {
  const order = query.order ?? defaultOrderFor(query.sort)

  if (query.q && (!query.sort || query.sort === 'relevance')) {
    builder
      .select('*')
      .select(builder.client.raw(`${RELEVANCE_RANK_SQL} as relevance_rank`, [
        query.q,
        query.q,
        query.q,
        query.q,
      ]))
      .orderBy('relevance_rank', 'asc')
      .orderBy('stock', 'desc')
      .orderBy('sortPriority', 'desc')
    return
  }

  switch (query.sort) {
    case 'price':
      builder.orderBy('price', order).orderBy('stock', 'desc')
      return
    case 'date':
      builder.orderBy('createdAt', order)
      return
    case 'stock':
      builder.orderBy('stock', order)
      return
    case 'priority':
    default:
      builder.orderByRaw('CASE WHEN stock > 0 THEN 0 ELSE 1 END asc')
      builder.orderBy('sortPriority', 'desc').orderBy('createdAt', 'desc')
  }
}

function defaultOrderFor(sort: SortKey | undefined): SortOrder {
  if (sort === 'price' || sort === 'stock') return 'asc'
  return 'desc'
}
