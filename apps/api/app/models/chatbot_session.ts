import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import ChatbotMessage from '#models/chatbot_message'

export default class ChatbotSession extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number | null

  @column()
  declare visitorName: string | null

  @column()
  declare visitorEmail: string | null

  @column()
  declare subject: string | null

  @column()
  declare escalated: boolean

  @column.dateTime()
  declare escalatedAt: DateTime | null

  @column()
  declare isRead: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => ChatbotMessage, { foreignKey: 'sessionId' })
  declare messages: HasMany<typeof ChatbotMessage>
}
