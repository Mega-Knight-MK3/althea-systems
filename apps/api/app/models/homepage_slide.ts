import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export interface SlideLocaleFields {
  eyebrow?: string | null
  title?: string | null
  body?: string | null
  ctaLabel?: string | null
}

export type SlideTranslations = Record<string, SlideLocaleFields>

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

  @column({
    prepare: (value: SlideTranslations | null) => JSON.stringify(value ?? {}),
    consume: (value: string | object | null) => {
      if (!value) return {}
      return typeof value === 'string' ? JSON.parse(value) : value
    },
  })
  declare translations: SlideTranslations

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
