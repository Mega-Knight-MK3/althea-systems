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

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export interface AdminOrder {
  id: number
  userId: number
  status: OrderStatus
  subtotal: string | number
  tax: string | number
  shippingCost?: string | number
  total: string | number
  stripePaymentIntentId?: string | null
  createdAt: string
  customer?: string
  customerEmail?: string | null
  paymentMethod?: { brand?: string | null, lastFour?: string | null } | null
  invoice?: { id: number, invoiceNumber: string, pdfPath?: string | null } | null
}

export interface AdminOrderItem {
  id: number
  productName: string
  quantity: number
  unitPrice: string | number
  total: string | number
}

export interface AdminOrderStatusHistoryEntry {
  id: number
  fromStatus: string | null
  toStatus: string
  note: string | null
  createdAt: string
  changedBy?: { id: number, fullName: string | null, email: string } | null
}

export interface AdminOrderDetail {
  order: AdminOrder & {
    items: AdminOrderItem[]
    billingAddress: AdminAddress | null
    shippingAddress: AdminAddress | null
    user: AdminUser | null
  }
  history: AdminOrderStatusHistoryEntry[]
}

export interface AdminUserDetail {
  user: AdminUser
  addresses: AdminAddress[]
  orders: AdminOrder[]
  orderCount: number
  totalRevenue: number
}

export interface AdminContactMessage {
  id: number
  userId: number | null
  name: string
  email: string
  subject: string
  message: string
  isRead: boolean
  createdAt: string
}

export interface AdminChatbotSession {
  id: number
  userId: number | null
  visitorName: string | null
  visitorEmail: string | null
  subject: string | null
  escalated: boolean
  escalatedAt: string | null
  isRead: boolean
  createdAt: string
  identity?: string
  user?: { id: number, email: string, fullName: string | null } | null
}

export interface AdminChatbotMessage {
  id: number
  sessionId: number
  role: 'user' | 'bot' | 'agent'
  content: string
  intent: string | null
  createdAt: string
}

export interface AdminInvoice {
  id: number
  invoiceNumber: string
  orderId: number
  subtotal: string | number
  tax: string | number
  total: string | number
  pdfPath: string | null
  issuedAt: string
  customer: string
  customerEmail: string | null
  orderStatus: string | null
}

export interface AdminCreditNote {
  id: number
  creditNoteNumber: string
  invoiceId: number
  invoiceNumber: string | null
  amount: string | number
  reason: string | null
  pdfPath: string | null
  issuedAt: string
  customer: string
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
