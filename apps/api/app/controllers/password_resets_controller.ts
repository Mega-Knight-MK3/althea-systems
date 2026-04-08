import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import User from '#models/user'
import PasswordReset from '#models/password_reset'
import {
  requestPasswordResetValidator,
  resetPasswordValidator,
} from '#validators/auth'
import { createToken, hashToken } from '#services/token_factory'
import { sendPasswordReset } from '#services/account_mailer'

const RESET_TTL_HOURS = 24

export default class PasswordResetsController {
  async request({ request }: HttpContext) {
    const { email } = await request.validateUsing(requestPasswordResetValidator)
    const user = await User.findBy('email', email)

    if (user) {
      const { value, hash } = createToken()
      await PasswordReset.create({
        userId: user.id,
        tokenHash: hash,
        expiresAt: DateTime.now().plus({ hours: RESET_TTL_HOURS }),
      })
      await sendPasswordReset(user, value)
    }

    return { message: 'Si un compte existe pour cette adresse, un email vous a été envoyé.' }
  }

  async reset({ request, response }: HttpContext) {
    const { token, password } = await request.validateUsing(resetPasswordValidator)

    const reset = await PasswordReset.query()
      .where('tokenHash', hashToken(token))
      .whereNull('usedAt')
      .where('expiresAt', '>', DateTime.now().toSQL()!)
      .first()

    if (!reset) {
      return response.unprocessableEntity({ message: 'Lien invalide ou expiré.' })
    }

    const user = await User.findOrFail(reset.userId)
    user.password = password
    await user.save()

    reset.usedAt = DateTime.now()
    await reset.save()

    return { message: 'Mot de passe réinitialisé.' }
  }
}
