import vine from '@vinejs/vine'

export const startSessionValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(120).optional(),
    email: vine.string().trim().email().normalizeEmail().optional(),
    subject: vine.string().trim().minLength(1).maxLength(160).optional(),
  })
)

export const postMessageValidator = vine.compile(
  vine.object({
    content: vine.string().trim().minLength(1).maxLength(2000),
  })
)

export const escalateValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(120).optional(),
    email: vine.string().trim().email().normalizeEmail(),
    subject: vine.string().trim().minLength(1).maxLength(160).optional(),
  })
)
