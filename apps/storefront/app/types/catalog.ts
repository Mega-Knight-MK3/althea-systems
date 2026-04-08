export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  parentId: number | null
  imagePath: string | null
  position: number
  children?: Category[]
}

export interface Product {
  id: number
  name: string
  slug: string
  description: string | null
  price: number
  stock: number
  categoryId: number | null
  isActive: boolean
  sortPriority: number
  category?: Category | null
}

export interface ProductImage {
  id: string
  filename: string
  contentType: string | null
  size: number
  uploadedAt: string
  metadata: { productId: number; position?: number; alt?: string | null } | null
}

export interface PaginatedProducts {
  data: Product[]
  meta: {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
  }
}

export interface HomepageConfig {
  carousel: {
    slides: Array<{
      id: number
      eyebrow: string
      title: string
      body: string
      ctaLabel: string
      ctaUrl: string
      imageUrl: string
    }>
  }
  intro: {
    body: string
    stats: Array<{ id: string; value: string; label: string }>
  }
  featuredProductSlugs: string[]
}
