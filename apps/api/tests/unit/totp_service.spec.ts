import { test } from '@japa/runner'
import { authenticator } from 'otplib'
import {
  buildOtpAuthUrl,
  consumeRecoveryCode,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCode,
  verifyTotpCode,
} from '#services/totp_service'

test.group('totp service', () => {
  test('generates a base32 secret', ({ assert }) => {
    const secret = generateTotpSecret()
    assert.match(secret, /^[A-Z2-7]+$/)
  })

  test('builds an otpauth url with the issuer and email', ({ assert }) => {
    const url = buildOtpAuthUrl('admin@althea.local', 'JBSWY3DPEHPK3PXP')
    assert.include(url, 'otpauth://totp/')
    assert.include(url, 'admin%40althea.local')
    assert.include(url, 'JBSWY3DPEHPK3PXP')
  })

  test('verifies a valid TOTP code', ({ assert }) => {
    const secret = 'JBSWY3DPEHPK3PXP'
    const code = authenticator.generate(secret)
    assert.isTrue(verifyTotpCode(secret, code))
  })

  test('rejects an invalid code', ({ assert }) => {
    assert.isFalse(verifyTotpCode('JBSWY3DPEHPK3PXP', '000000'))
  })

  test('consumes a recovery code exactly once', ({ assert }) => {
    const codes = generateRecoveryCodes(3)
    const hashes = codes.map(hashRecoveryCode)
    const remaining = consumeRecoveryCode(hashes, codes[0]!)
    assert.isNotNull(remaining)
    assert.lengthOf(remaining!, 2)
    assert.isNull(consumeRecoveryCode(remaining!, codes[0]!))
  })
})
