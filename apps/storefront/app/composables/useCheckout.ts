export interface QuotedLine {
  productId: number
  productName: string
  unitPrice: number
  quantity: number
  total: number
  available: boolean
  stock: number
}

export interface CartQuote {
  lines: QuotedLine[]
  unavailable: QuotedLine[]
  subtotal: number
  shipping: number
  tax: number
  total: number
}

export interface PaymentIntentResult {
  clientSecret: string
  paymentIntentId: string
  quote: CartQuote
}

export interface OrderItemResult {
  id: number
  productId: number | null
  productName: string
  quantity: number
  unitPrice: number
  total: number
}

export interface OrderResult {
  id: number
  status: string
  subtotal: number
  shippingCost: number
  tax: number
  total: number
  placedAt: string | null
  createdAt: string
  items: OrderItemResult[]
  invoice: { id: number; invoiceNumber: string; pdfPath: string | null } | null
}

export function useCheckoutApi() {
  const api = useApi()
  return {
    quote: (items: Array<{ productId: number; quantity: number }>) =>
      api<CartQuote>('/checkout/quote', { method: 'POST', body: { items } }),
    createPaymentIntent: (items: Array<{ productId: number; quantity: number }>) =>
      api<PaymentIntentResult>('/checkout/intent', { method: 'POST', body: { items } }),
    placeOrder: (payload: {
      items: Array<{ productId: number; quantity: number }>
      shippingAddressId: number
      billingAddressId: number
      paymentIntentId: string
    }) => api<{ order: OrderResult }>('/account/orders', { method: 'POST', body: payload }),
    listOrders: () => api<OrderResult[]>('/account/orders'),
    getOrder: (id: number) => api<OrderResult>(`/account/orders/${id}`),
  }
}
