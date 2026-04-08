import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export type AddressType = 'billing' | 'shipping'

export default class Address extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare type: AddressType

  @column()
  declare fullName: string

  @column()
  declare street: string

  @column({ columnName: 'line2' })
  declare line2: string | null

  @column()
  declare city: string

  @column()
  declare region: string | null

  @column()
  declare postalCode: string

  @column()
  declare country: string

  @column()
  declare phone: string | null

  @column()
  declare isDefault: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
