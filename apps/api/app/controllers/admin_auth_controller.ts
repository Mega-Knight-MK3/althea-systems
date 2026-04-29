import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import { Exception } from '@adonisjs/core/exceptions'
import encryption from '@adonisjs/core/services/encryption'
import hash from '@adonisjs/core/services/hash'
import User from '#models/user'
import {
  adminLoginValidator,
  adminTotpChallengeValidator,
  adminTotpConfirmValidator,
  adminTotpDisableValidator,
} from '#validators/admin_auth'
import {
  buildOtpAuthUrl,
  buildQrCodeDataUrl,
  consumeRecoveryCode,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCode,
  verifyTotpCode,
} from '#services/totp_service'
import { consume as consumeRateLimit } from '#services/rate_limiter'

const ADMIN_TOKEN_NAME = 'backoffice_session'
const ADMIN_SESSION_EXPIRY = '8 hours'
const CHALLENGE_PURPOSE = 'admin-2fa-challenge'
const CHALLENGE_EXPIRY = '5 minutes'

export default class AdminAuthController {
  async login({ request, response }: HttpContext) {
    const { email, password } = await request.validateUsing(adminLoginValidator)

    const limit = consumeRateLimit(`admin-login:${request.ip()}:${email.toLowerCase()}`, {
      max: 5,
      windowMs: 60_000,
    })
    if (!limit.allowed) {
      response.header('Retry-After', String(limit.retryAfterSeconds))
      throw new Exception('Trop de tentatives. Réessayez plus tard.', {
        code: 'E_TOO_MANY_REQUESTS',
        status: 429,
      })
    }

    const user = await User.verifyCredentials(email, password)

    ensureActiveAdmin(user)

    if (user.isTotpEnabled) {
      const challengeToken = encryption.encrypt(
        { userId: user.id },
        CHALLENGE_EXPIRY,
        CHALLENGE_PURPOSE
      )
      return response.accepted({ requires2fa: true, challengeToken })
    }

    return issueAdminSession(user)
  }

  async verify2fa({ request, response }: HttpContext) {
    const { challengeToken, code } = await request.validateUsing(adminTotpChallengeValidator)

    const limit = consumeRateLimit(`admin-2fa:${request.ip()}`, { max: 10, windowMs: 60_000 })
    if (!limit.allowed) {
      response.header('Retry-After', String(limit.retryAfterSeconds))
      throw new Exception('Trop de tentatives. Réessayez plus tard.', {
        code: 'E_TOO_MANY_REQUESTS',
        status: 429,
      })
    }

    const payload = encryption.decrypt<{ userId: number }>(challengeToken, CHALLENGE_PURPOSE)
    if (!payload) throw new Exception('Challenge expiré.', { status: 401 })

    const user = await User.findOrFail(payload.userId)
    ensureActiveAdmin(user)

    if (!user.isTotpEnabled || !user.totpSecret) {
      throw new Exception('2FA non configurée.', { status: 400 })
    }

    if (!consumeOtpOrRecovery(user, code)) {
      throw new Exception('Code invalide.', { status: 401 })
    }
    await user.save()

    return issueAdminSession(user)
  }

  async me({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    ensureActiveAdmin(user)
    return {
      user,
      twoFactorEnabled: user.isTotpEnabled,
      recoveryCodesCount: user.totpRecoveryCodes?.length ?? 0,
    }
  }

  async logout({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await User.accessTokens.delete(user, user.currentAccessToken.identifier)
    return response.noContent()
  }

  async startTotpEnrollment({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    ensureActiveAdmin(user)

    const secret = generateTotpSecret()
    user.totpSecret = secret
    user.totpEnabledAt = null
    user.totpRecoveryCodes = null
    await user.save()

    const otpAuthUrl = buildOtpAuthUrl(user.email, secret)
    const qrCodeDataUrl = await buildQrCodeDataUrl(otpAuthUrl)
    return { secret, otpAuthUrl, qrCodeDataUrl }
  }

  async confirmTotpEnrollment({ auth, request }: HttpContext) {
    const user = auth.getUserOrFail()
    ensureActiveAdmin(user)
    const { code } = await request.validateUsing(adminTotpConfirmValidator)

    if (!user.totpSecret) throw new Exception('Aucune inscription 2FA en cours.', { status: 400 })
    if (!verifyTotpCode(user.totpSecret, code)) {
      throw new Exception('Code invalide.', { status: 422 })
    }

    const recoveryCodes = generateRecoveryCodes()
    user.totpRecoveryCodes = recoveryCodes.map(hashRecoveryCode)
    user.totpEnabledAt = DateTime.now()
    await user.save()

    return { recoveryCodes }
  }

  async disableTotp({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    ensureActiveAdmin(user)
    const { currentPassword, code } = await request.validateUsing(adminTotpDisableValidator)

    const passwordOk = await hash.verify(user.password, currentPassword)
    if (!passwordOk) throw new Exception('Mot de passe incorrect.', { status: 422 })

    if (!user.isTotpEnabled || !user.totpSecret) {
      return response.badRequest({ message: '2FA non activée.' })
    }

    if (!consumeOtpOrRecovery(user, code)) {
      throw new Exception('Code invalide.', { status: 422 })
    }

    user.totpSecret = null
    user.totpEnabledAt = null
    user.totpRecoveryCodes = null
    await user.save()

    return response.noContent()
  }
}

function ensureActiveAdmin(user: User) {
  if (user.role !== 'admin') {
    throw new Exception('Accès réservé aux administrateurs.', { status: 403 })
  }
  if (!user.isActive) {
    throw new Exception('Compte désactivé.', { status: 403 })
  }
}

function consumeOtpOrRecovery(user: User, submitted: string): boolean {
  if (user.totpSecret && verifyTotpCode(user.totpSecret, submitted)) return true
  if (!user.totpRecoveryCodes?.length) return false

  const remaining = consumeRecoveryCode(user.totpRecoveryCodes, submitted)
  if (!remaining) return false
  user.totpRecoveryCodes = remaining
  return true
}

async function issueAdminSession(user: User) {
  const token = await User.accessTokens.create(user, ['*'], {
    name: ADMIN_TOKEN_NAME,
    expiresIn: ADMIN_SESSION_EXPIRY,
  })
  return {
    user,
    twoFactorEnabled: user.isTotpEnabled,
    token: {
      type: 'bearer' as const,
      value: token.value!.release(),
      expiresAt: token.expiresAt,
    },
  }
}
