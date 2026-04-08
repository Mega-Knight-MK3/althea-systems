import vine from '@vinejs/vine'

const phone = vine.string().trim().maxLength(32)

export const createAddressValidator = vine.compile(
  vine.object({
    type: vine.enum(['billing', 'shipping'] as const),
    fullName: vine.string().trim().minLength(2).maxLength(120),
    street: vine.string().trim().minLength(2).maxLength(255),
    line2: vine.string().trim().maxLength(255).nullable().optional(),
    city: vine.string().trim().minLength(2).maxLength(120),
    region: vine.string().trim().maxLength(120).nullable().optional(),
    postalCode: vine.string().trim().minLength(2).maxLength(32),
    country: vine.string().trim().fixedLength(2),
    phone: phone.clone().nullable().optional(),
    isDefault: vine.boolean().optional(),
  })
)

export const updateAddressValidator = vine.compile(
  vine.object({
    type: vine.enum(['billing', 'shipping'] as const).optional(),
    fullName: vine.string().trim().minLength(2).maxLength(120).optional(),
    street: vine.string().trim().minLength(2).maxLength(255).optional(),
    line2: vine.string().trim().maxLength(255).nullable().optional(),
    city: vine.string().trim().minLength(2).maxLength(120).optional(),
    region: vine.string().trim().maxLength(120).nullable().optional(),
    postalCode: vine.string().trim().minLength(2).maxLength(32).optional(),
    country: vine.string().trim().fixedLength(2).optional(),
    phone: phone.clone().nullable().optional(),
    isDefault: vine.boolean().optional(),
  })
)

export const createPaymentMethodValidator = vine.compile(
  vine.object({
    stripePaymentMethodId: vine.string().trim().minLength(3).maxLength(255),
    type: vine.string().trim().maxLength(32).optional(),
    brand: vine.string().trim().maxLength(32).nullable().optional(),
    lastFour: vine.string().trim().fixedLength(4),
    expMonth: vine.number().withoutDecimals().min(1).max(12).optional(),
    expYear: vine.number().withoutDecimals().min(2024).max(2100).optional(),
    isDefault: vine.boolean().optional(),
  })
)

export const updatePaymentMethodValidator = vine.compile(
  vine.object({
    isDefault: vine.boolean().optional(),
  })
)
