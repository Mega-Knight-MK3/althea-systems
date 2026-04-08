import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import { Exception } from '@adonisjs/core/exceptions'
import User from '#models/user'
import EmailVerification from '#models/email_verification'
import {
  loginValidator,
  registerValidator,
  verifyEmailValidator,
} from '#validators/auth'
import { createToken, hashToken } from '#services/token_factory'
import { sendEmailVerification } from '#services/account_mailer'

const SHORT_TOKEN_EXPIRY = '12 hours'
const LONG_TOKEN_EXPIRY = '30 days'
const TOKEN_NAME = 'storefront_session'
const VERIFICATION_TTL_HOURS = 24

export default class AuthController {
  async register({ request, response }: HttpContext) {
    const payload = await request.validateUsing(registerValidator)
    const user = await User.create(payload)
    await issueVerificationEmail(user, user.email)
    return response.created({ user })
  }

  async login({ request }: HttpContext) {
    const { email, password, rememberMe } = await request.validateUsing(loginValidator)
    const user = await User.verifyCredentials(email, password)

    if (!user.isActive) {
      throw new Exception('Compte désactivé.', { code: 'E_ACCOUNT_DISABLED', status: 403 })
    }

    const token = await User.accessTokens.create(user, ['*'], {
      name: TOKEN_NAME,
      expiresIn: rememberMe ? LONG_TOKEN_EXPIRY : SHORT_TOKEN_EXPIRY,
    })

    return {
      user,
      emailVerified: user.isEmailVerified,
      token: serializeToken(token),
    }
  }

  async refresh({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const current = user.currentAccessToken
    await User.accessTokens.delete(user, current.identifier)
    const token = await User.accessTokens.create(user, ['*'], {
      name: TOKEN_NAME,
      expiresIn: SHORT_TOKEN_EXPIRY,
    })
    return { user, token: serializeToken(token) }
  }

  async logout({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await User.accessTokens.delete(user, user.currentAccessToken.identifier)
    return response.noContent()
  }

  async me({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    return { user, emailVerified: user.isEmailVerified }
  }

  async verifyEmail({ request, response }: HttpContext) {
    const { token } = await request.validateUsing(verifyEmailValidator)
    const verification = await EmailVerification.query()
      .where('tokenHash', hashToken(token))
      .whereNull('usedAt')
      .where('expiresAt', '>', DateTime.now().toSQL()!)
      .first()

    if (!verification) {
      return response.unprocessableEntity({ message: 'Lien de confirmation invalide ou expiré.' })
    }

    const user = await User.findOrFail(verification.userId)
    user.email = verification.email
    user.emailVerifiedAt = DateTime.now()
    await user.save()

    verification.usedAt = DateTime.now()
    await verification.save()

    return { user }
  }

  async resendVerification({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    if (user.isEmailVerified) {
      return response.badRequest({ message: 'Email déjà vérifié.' })
    }
    await issueVerificationEmail(user, user.email)
    return response.accepted({ message: 'Email envoyé.' })
  }
}

export async function issueVerificationEmail(user: User, email: string) {
  const { value, hash } = createToken()
  await EmailVerification.create({
    userId: user.id,
    email,
    tokenHash: hash,
    expiresAt: DateTime.now().plus({ hours: VERIFICATION_TTL_HOURS }),
  })
  await sendEmailVerification(user, value, email)
}

function serializeToken(token: Awaited<ReturnType<typeof User.accessTokens.create>>) {
  return {
    type: 'bearer' as const,
    value: token.value!.release(),
    expiresAt: token.expiresAt,
  }
}
