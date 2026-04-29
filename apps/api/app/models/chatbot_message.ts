import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import ChatbotSession from '#models/chatbot_session'

export type ChatbotRole = 'user' | 'bot' | 'agent'

export default class ChatbotMessage extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare sessionId: number

  @column()
  declare role: ChatbotRole

  @column()
  declare content: string

  @column()
  declare intent: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => ChatbotSession, { foreignKey: 'sessionId' })
  declare session: BelongsTo<typeof ChatbotSession>
}
