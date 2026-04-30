import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Category from '#models/category'
import type { NamedTranslations } from '#services/locale'

export default class Product extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare description: string | null

  @column()
  declare price: number

  @column({
    consume: (value: string | number | null) => (value === null ? 0 : Number(value)),
  })
  declare vatRate: number

  @column()
  declare stock: number

  @column()
  declare categoryId: number | null

  @column()
  declare isActive: boolean

  @column()
  declare sortPriority: number

  @column({
    prepare: (value: NamedTranslations | null) => JSON.stringify(value ?? {}),
    consume: (value: string | object | null) => {
      if (!value) return {}
      return typeof value === 'string' ? JSON.parse(value) : value
    },
  })
  declare translations: NamedTranslations

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Category)
  declare category: BelongsTo<typeof Category>
}
