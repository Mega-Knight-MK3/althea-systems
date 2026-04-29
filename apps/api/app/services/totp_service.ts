import crypto from 'node:crypto'
import { authenticator } from 'otplib'
import qrcode from 'qrcode'
import env from '#start/env'

const RECOVERY_CODE_COUNT = 10

export function generateTotpSecret() {
  return authenticator.generateSecret()
}

export function buildOtpAuthUrl(email: string, secret: string) {
  const issuer = env.get('TOTP_ISSUER', 'Althea Backoffice')
  return authenticator.keyuri(email, issuer, secret)
}

export async function buildQrCodeDataUrl(otpAuthUrl: string) {
  return qrcode.toDataURL(otpAuthUrl, { width: 240, margin: 1 })
}

export function verifyTotpCode(secret: string, code: string) {
  const sanitized = code.replace(/\s+/g, '')
  return authenticator.check(sanitized, secret)
}

export function generateRecoveryCodes(count = RECOVERY_CODE_COUNT) {
  return Array.from({ length: count }, () => generateRecoveryCode())
}

export function hashRecoveryCode(code: string) {
  return crypto.createHash('sha256').update(code.trim().toLowerCase()).digest('hex')
}

export function consumeRecoveryCode(hashes: string[], submitted: string) {
  const hash = hashRecoveryCode(submitted)
  const index = hashes.indexOf(hash)
  if (index === -1) return null
  const remaining = [...hashes.slice(0, index), ...hashes.slice(index + 1)]
  return remaining
}

function generateRecoveryCode() {
  const raw = crypto.randomBytes(5).toString('hex')
  return `${raw.slice(0, 5)}-${raw.slice(5)}`
}
