import type { Product } from '~~/app/types/catalog'

export interface CartItem {
  productId: number
  slug: string
  name: string
  unitPrice: number
  quantity: number
}

const CART_COOKIE = 'althea_cart'

export function useCart() {
  const cookie = useCookie<CartItem[]>(CART_COOKIE, {
    default: () => [],
    sameSite: 'lax',
    secure: false,
  })
  const items = useState<CartItem[]>('cart', () => cookie.value ?? [])

  watch(
    items,
    (next) => {
      cookie.value = next
    },
    { deep: true }
  )

  const itemCount = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
  const subtotal = computed(() =>
    round(items.value.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0))
  )
  const isEmpty = computed(() => items.value.length === 0)

  function add(product: Product, quantity = 1) {
    const existing = items.value.find((item) => item.productId === product.id)
    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, 99)
      return
    }
    items.value.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      unitPrice: Number(product.price),
      quantity,
    })
  }

  function setQuantity(productId: number, quantity: number) {
    const item = items.value.find((entry) => entry.productId === productId)
    if (!item) return
    if (quantity <= 0) {
      remove(productId)
      return
    }
    item.quantity = Math.min(quantity, 99)
  }

  function remove(productId: number) {
    items.value = items.value.filter((item) => item.productId !== productId)
  }

  function clear() {
    items.value = []
  }

  function toApiPayload() {
    return items.value.map((item) => ({ productId: item.productId, quantity: item.quantity }))
  }

  return {
    items,
    itemCount,
    subtotal,
    isEmpty,
    add,
    setQuantity,
    remove,
    clear,
    toApiPayload,
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
