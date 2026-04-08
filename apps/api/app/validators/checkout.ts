import vine from '@vinejs/vine'

const cartItem = vine.object({
  productId: vine.number().positive(),
  quantity: vine.number().withoutDecimals().min(1).max(99),
})

export const quoteValidator = vine.compile(
  vine.object({
    items: vine.array(cartItem).minLength(1),
  })
)

export const createOrderValidator = vine.compile(
  vine.object({
    items: vine.array(cartItem).minLength(1),
    shippingAddressId: vine.number().positive(),
    billingAddressId: vine.number().positive(),
    paymentIntentId: vine.string().trim().minLength(3),
  })
)

export const createPaymentIntentValidator = vine.compile(
  vine.object({
    items: vine.array(cartItem).minLength(1),
  })
)
