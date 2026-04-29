import vine from '@vinejs/vine'

export const submitContactValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(120),
    email: vine.string().trim().email().normalizeEmail(),
    subject: vine.string().trim().minLength(2).maxLength(160),
    message: vine.string().trim().minLength(10).maxLength(4000),
  })
)
