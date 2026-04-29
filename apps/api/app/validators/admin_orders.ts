import vine from '@vinejs/vine'

export const ORDER_STATUSES = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const

export const listOrdersValidator = vine.compile(
  vine.object({
    q: vine.string().trim().minLength(1).maxLength(120).optional(),
    status: vine.enum(['all', ...ORDER_STATUSES] as const).optional(),
    userId: vine.number().positive().optional(),
    page: vine.number().withoutDecimals().min(1).optional(),
    perPage: vine.number().withoutDecimals().min(1).max(100).optional(),
  })
)

export const updateOrderStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(ORDER_STATUSES),
    note: vine.string().trim().maxLength(500).optional(),
  })
)
