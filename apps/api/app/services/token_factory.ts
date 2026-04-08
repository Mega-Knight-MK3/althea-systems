import crypto from 'node:crypto'

const TOKEN_BYTE_LENGTH = 32

export function createToken() {
  const value = crypto.randomBytes(TOKEN_BYTE_LENGTH).toString('base64url')
  const hash = hashToken(value)
  return { value, hash }
}

export function hashToken(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex')
}
