import Product from '#models/product'

export interface CartLineInput {
  productId: number
  quantity: number
}

export interface QuotedLine {
  productId: number
  productName: string
  unitPrice: number
  quantity: number
  total: number
  available: boolean
  stock: number
}

export interface QuoteResult {
  lines: QuotedLine[]
  unavailable: QuotedLine[]
  subtotal: number
  shipping: number
  tax: number
  total: number
}

const SHIPPING_FLAT_RATE = 0
const TAX_RATE = 0

export async function quoteCart(input: CartLineInput[]): Promise<QuoteResult> {
  const ids = input.map((item) => item.productId)
  const products = await Product.query().whereIn('id', ids)
  const byId = new Map(products.map((product) => [product.id, product]))

  const lines = input.map<QuotedLine>((item) => {
    const product = byId.get(item.productId)
    const unitPrice = product ? Number(product.price) : 0
    const stock = product?.stock ?? 0
    const available = !!product && product.isActive && stock >= item.quantity
    return {
      productId: item.productId,
      productName: product?.name ?? 'Produit indisponible',
      unitPrice,
      quantity: item.quantity,
      total: round(unitPrice * item.quantity),
      available,
      stock,
    }
  })

  const subtotal = round(lines.filter((l) => l.available).reduce((sum, l) => sum + l.total, 0))
  const shipping = subtotal > 0 ? SHIPPING_FLAT_RATE : 0
  const tax = round(subtotal * TAX_RATE)
  const total = round(subtotal + shipping + tax)

  return {
    lines,
    unavailable: lines.filter((l) => !l.available),
    subtotal,
    shipping,
    tax,
    total,
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
