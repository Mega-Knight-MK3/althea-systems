import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Order from '#models/order'
import CreditNote from '#models/credit_note'

export default class Invoice extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare orderId: number

  @column()
  declare invoiceNumber: string

  @column()
  declare subtotal: number

  @column()
  declare tax: number

  @column()
  declare total: number

  @column.dateTime()
  declare issuedAt: DateTime

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>

  @hasMany(() => CreditNote)
  declare creditNotes: HasMany<typeof CreditNote>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
