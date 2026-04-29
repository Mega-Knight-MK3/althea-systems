import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class HomepageSlide extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare eyebrow: string | null

  @column()
  declare title: string

  @column()
  declare body: string | null

  @column()
  declare ctaLabel: string | null

  @column()
  declare ctaUrl: string | null

  @column()
  declare imageUrl: string | null

  @column()
  declare position: number

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
