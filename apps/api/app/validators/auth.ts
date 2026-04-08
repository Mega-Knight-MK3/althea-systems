import vine from '@vinejs/vine'

const passwordRules = vine.string().minLength(8).maxLength(128)

export const registerValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(120).optional(),
    email: vine
      .string()
      .trim()
      .email()
      .normalizeEmail()
      .unique({ table: 'users', column: 'email' }),
    password: passwordRules.clone(),
  })
)

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email().normalizeEmail(),
    password: vine.string(),
    rememberMe: vine.boolean().optional(),
  })
)

export const verifyEmailValidator = vine.compile(
  vine.object({
    token: vine.string().trim().minLength(10),
  })
)

export const requestPasswordResetValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email().normalizeEmail(),
  })
)

export const resetPasswordValidator = vine.compile(
  vine.object({
    token: vine.string().trim().minLength(10),
    password: passwordRules.clone(),
  })
)

export const updateProfileValidator = vine.withMetaData<{ userId: number }>().compile(
  vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(120).nullable().optional(),
    phone: vine.string().trim().maxLength(32).nullable().optional(),
  })
)

export const changeEmailValidator = vine.withMetaData<{ userId: number }>().compile(
  vine.object({
    email: vine
      .string()
      .trim()
      .email()
      .normalizeEmail()
      .unique(async (db, value, field) => {
        const row = await db
          .from('users')
          .where('email', value)
          .whereNot('id', field.meta.userId)
          .first()
        return !row
      }),
    currentPassword: vine.string(),
  })
)

export const changePasswordValidator = vine.compile(
  vine.object({
    currentPassword: vine.string(),
    newPassword: passwordRules.clone(),
  })
)
