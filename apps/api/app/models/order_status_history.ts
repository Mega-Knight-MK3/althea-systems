import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Order from '#models/order'
import User from '#models/user'

export default class OrderStatusHistory extends BaseModel {
  static table = 'order_status_history'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare orderId: number

  @column()
  declare fromStatus: string | null

  @column()
  declare toStatus: string

  @column()
  declare note: string | null

  @column()
  declare changedByUserId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => User, { foreignKey: 'changedByUserId' })
  declare changedBy: BelongsTo<typeof User>
}
