import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Invoice from '#models/invoice'

export default class CreditNote extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare invoiceId: number

  @column()
  declare creditNoteNumber: string

  @column()
  declare amount: number

  @column()
  declare reason: string | null

  @column()
  declare pdfPath: string | null

  @column.dateTime()
  declare issuedAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Invoice)
  declare invoice: BelongsTo<typeof Invoice>
}
