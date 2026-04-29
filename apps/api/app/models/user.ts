import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column()
  declare phone: string | null

  @column()
  declare role: 'customer' | 'admin'

  @column({ serializeAs: null })
  declare password: string

  @column.dateTime()
  declare emailVerifiedAt: DateTime | null

  @column()
  declare isActive: boolean

  @column()
  declare stripeCustomerId: string | null

  @column({ serializeAs: null })
  declare totpSecret: string | null

  @column.dateTime({ serializeAs: null })
  declare totpEnabledAt: DateTime | null

  @column({
    serializeAs: null,
    prepare: (value: string[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | string[] | null) => {
      if (!value) return null
      return Array.isArray(value) ? value : JSON.parse(value)
    },
  })
  declare totpRecoveryCodes: string[] | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  get isEmailVerified() {
    return this.emailVerifiedAt !== null
  }

  get isTotpEnabled() {
    return this.totpEnabledAt !== null && !!this.totpSecret
  }

  static accessTokens = DbAccessTokensProvider.forModel(User)
}