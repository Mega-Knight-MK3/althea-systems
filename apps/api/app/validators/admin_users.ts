import vine from '@vinejs/vine'

export const listUsersValidator = vine.compile(
  vine.object({
    q: vine.string().trim().minLength(1).maxLength(120).optional(),
    status: vine.enum(['all', 'active', 'inactive', 'pending'] as const).optional(),
    page: vine.number().withoutDecimals().min(1).optional(),
    perPage: vine.number().withoutDecimals().min(1).max(100).optional(),
  })
)

export const updateUserAdminValidator = vine.compile(
  vine.object({
    isActive: vine.boolean().optional(),
    role: vine.enum(['customer', 'admin'] as const).optional(),
  })
)
