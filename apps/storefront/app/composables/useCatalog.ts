import type {
  Category,
  HomepageConfig,
  PaginatedProducts,
  Product,
  ProductImage,
} from '~~/app/types/catalog'

export interface ProductListParams {
  q?: string
  categoryId?: number
  minPrice?: number
  maxPrice?: number
  inStockOnly?: boolean
  sort?: 'priority' | 'price' | 'date' | 'stock' | 'relevance'
  order?: 'asc' | 'desc'
  page?: number
  perPage?: number
}

export function useHomepageConfig() {
  const api = useApi()
  return useAsyncData('homepage-config', () => api<HomepageConfig>('/site-config/homepage'))
}

export function useCategories() {
  const api = useApi()
  return useAsyncData('categories', () => api<Category[]>('/categories'))
}

export function useCategory(slug: MaybeRefOrGetter<string>) {
  const api = useApi()
  const slugRef = computed(() => toValue(slug))
  return useAsyncData(
    () => `category:${slugRef.value}`,
    () => api<Category>(`/categories/${slugRef.value}`),
    { watch: [slugRef] }
  )
}

export function useProducts(params: MaybeRefOrGetter<ProductListParams> = () => ({})) {
  const api = useApi()
  const paramsRef = computed(() => toValue(params))
  return useAsyncData(
    () => `products:${JSON.stringify(paramsRef.value)}`,
    () => api<PaginatedProducts>('/products', { query: paramsRef.value }),
    { watch: [paramsRef] }
  )
}

export function useProduct(slug: MaybeRefOrGetter<string>) {
  const api = useApi()
  const slugRef = computed(() => toValue(slug))
  return useAsyncData(
    () => `product:${slugRef.value}`,
    () => api<Product>(`/products/${slugRef.value}`),
    { watch: [slugRef] }
  )
}

export function useSimilarProducts(slug: MaybeRefOrGetter<string>) {
  const api = useApi()
  const slugRef = computed(() => toValue(slug))
  return useAsyncData(
    () => `similar:${slugRef.value}`,
    () => api<Product[]>(`/products/${slugRef.value}/similar`),
    { watch: [slugRef] }
  )
}

export function useProductImages(slug: MaybeRefOrGetter<string>) {
  const api = useApi()
  const slugRef = computed(() => toValue(slug))
  return useAsyncData(
    () => `images:${slugRef.value}`,
    () => api<ProductImage[]>(`/products/${slugRef.value}/images`),
    { watch: [slugRef] }
  )
}

export function productImageUrl(id: string) {
  const config = useRuntimeConfig()
  return `${config.public.apiBase}/images/${id}`
}
