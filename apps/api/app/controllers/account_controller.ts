import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import { Exception } from '@adonisjs/core/exceptions'
import hash from '@adonisjs/core/services/hash'
import User from '#models/user'
import EmailVerification from '#models/email_verification'
import {
  changeEmailValidator,
  changePasswordValidator,
  updateProfileValidator,
} from '#validators/auth'
import { createToken } from '#services/token_factory'
import { sendEmailVerification } from '#services/account_mailer'

const VERIFICATION_TTL_HOURS = 24

export default class AccountController {
  async show({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    return { user, emailVerified: user.isEmailVerified }
  }

  async updateProfile({ auth, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateProfileValidator, {
      meta: { userId: user.id },
    })
    user.merge(payload)
    await user.save()
    return { user }
  }

  async changeEmail({ auth, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const { email, currentPassword } = await request.validateUsing(changeEmailValidator, {
      meta: { userId: user.id },
    })

    await assertCurrentPassword(user, currentPassword)

    const { value, hash: tokenHash } = createToken()
    await EmailVerification.create({
      userId: user.id,
      email,
      tokenHash,
      expiresAt: DateTime.now().plus({ hours: VERIFICATION_TTL_HOURS }),
    })
    await sendEmailVerification(user, value, email)

    return { message: 'Un email de confirmation a été envoyé à la nouvelle adresse.' }
  }

  async changePassword({ auth, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const { currentPassword, newPassword } = await request.validateUsing(changePasswordValidator)

    await assertCurrentPassword(user, currentPassword)

    user.password = newPassword
    await user.save()

    return { message: 'Mot de passe mis à jour.' }
  }

  async deactivate({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    user.isActive = false
    await user.save()
    await User.accessTokens.delete(user, user.currentAccessToken.identifier)
    return response.noContent()
  }
}

async function assertCurrentPassword(user: User, password: string) {
  const valid = await hash.verify(user.password, password)
  if (!valid) {
    throw new Exception('Mot de passe actuel invalide.', {
      code: 'E_INVALID_CURRENT_PASSWORD',
      status: 422,
    })
  }
}
