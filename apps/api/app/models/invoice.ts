import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
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

  @column()
  declare pdfPath: string | null

  @column.dateTime()
  declare issuedAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>

  @hasMany(() => CreditNote)
  declare creditNotes: HasMany<typeof CreditNote>
}
