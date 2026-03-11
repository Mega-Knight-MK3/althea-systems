import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Address from '#models/address'
import OrderItem from '#models/order_item'

export default class Order extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

  @column()
  declare subtotal: number

  @column()
  declare tax: number

  @column()
  declare shippingCost: number

  @column()
  declare total: number

  @column()
  declare shippingAddressId: number

  @column()
  declare billingAddressId: number

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Address, { foreignKey: 'shippingAddressId' })
  declare shippingAddress: BelongsTo<typeof Address>

  @belongsTo(() => Address, { foreignKey: 'billingAddressId' })
  declare billingAddress: BelongsTo<typeof Address>

  @hasMany(() => OrderItem)
  declare items: HasMany<typeof OrderItem>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
