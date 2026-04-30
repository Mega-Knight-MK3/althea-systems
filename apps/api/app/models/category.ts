import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Product from '#models/product'
import type { NamedTranslations } from '#services/locale'

export default class Category extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare description: string | null

  @column()
  declare parentId: number | null

  @column()
  declare imagePath: string | null

  @column()
  declare position: number

  @column()
  declare isActive: boolean

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

  @belongsTo(() => Category, { foreignKey: 'parentId' })
  declare parent: BelongsTo<typeof Category>

  @hasMany(() => Category, { foreignKey: 'parentId' })
  declare children: HasMany<typeof Category>

  @hasMany(() => Product)
  declare products: HasMany<typeof Product>
}
