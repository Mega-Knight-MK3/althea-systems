import vine from '@vinejs/vine'

export const salesRangeValidator = vine.compile(
  vine.object({
    range: vine.enum(['7d', '5w'] as const).optional()
  })
)
