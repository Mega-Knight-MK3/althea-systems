import vine from '@vinejs/vine'

export const adminLoginValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email().normalizeEmail(),
    password: vine.string(),
  })
)

export const adminTotpChallengeValidator = vine.compile(
  vine.object({
    challengeToken: vine.string().trim().minLength(10),
    code: vine.string().trim().minLength(6).maxLength(11),
  })
)

export const adminTotpConfirmValidator = vine.compile(
  vine.object({
    code: vine.string().trim().minLength(6).maxLength(6),
  })
)

export const adminTotpDisableValidator = vine.compile(
  vine.object({
    currentPassword: vine.string(),
    code: vine.string().trim().minLength(6).maxLength(11),
  })
)
