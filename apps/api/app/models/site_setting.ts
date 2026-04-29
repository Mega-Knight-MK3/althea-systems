import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class SiteSetting extends BaseModel {
  static table = 'site_settings'
  static primaryKey = 'key'
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare key: string

  @column()
  declare value: string

  @column({
    prepare: (value: Record<string, string> | null) => JSON.stringify(value ?? {}),
    consume: (value: string | object | null) => {
      if (!value) return {}
      return typeof value === 'string' ? JSON.parse(value) : value
    },
  })
  declare translations: Record<string, string>

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
