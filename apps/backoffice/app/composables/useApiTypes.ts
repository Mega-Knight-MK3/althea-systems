export interface Paginated<T> {
  meta: {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
    firstPage: number
    firstPageUrl: string
    lastPageUrl: string
    nextPageUrl: string | null
    previousPageUrl: string | null
  }
  data: T[]
}

export interface AdminCategory {
  id: number
  name: string
  slug: string
  description: string | null
  parentId: number | null
  imagePath: string | null
  position: number
  isActive: boolean
  productCount?: number
}

export interface AdminProduct {
  id: number
  name: string
  slug: string
  description: string | null
  price: string | number
  vatRate: number
  stock: number
  categoryId: number | null
  category: AdminCategory | null
  isActive: boolean
  sortPriority: number
  createdAt: string
  updatedAt: string | null
}
