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

export interface AdminUser {
  id: number
  email: string
  fullName: string | null
  phone: string | null
  role: 'customer' | 'admin'
  isActive: boolean
  emailVerifiedAt: string | null
  createdAt: string
  accountStatus: 'active' | 'inactive' | 'pending'
  orderCount?: number
  totalRevenue?: number
}

export interface AdminAddress {
  id: number
  userId: number
  fullName: string | null
  line1: string
  line2: string | null
  city: string
  postalCode: string
  country: string
  isDefault: boolean
}

export interface AdminOrder {
  id: number
  userId: number
  status: string
  subtotal: string | number
  tax: string | number
  total: string | number
  createdAt: string
}

export interface AdminUserDetail {
  user: AdminUser
  addresses: AdminAddress[]
  orders: AdminOrder[]
  orderCount: number
  totalRevenue: number
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
