import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Address from '#models/address'
import OrderItem from '#models/order_item'
import PaymentMethod from '#models/payment_method'
import Invoice from '#models/invoice'

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export default class Order extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare status: OrderStatus

  @column()
  declare subtotal: number

  @column()
  declare tax: number

  @column()
  declare shippingCost: number

  @column()
  declare total: number

  @column()
  declare shippingAddressId: number | null

  @column()
  declare billingAddressId: number | null

  @column()
  declare paymentMethodId: number | null

  @column()
  declare stripePaymentIntentId: string | null

  @column.dateTime()
  declare placedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Address, { foreignKey: 'shippingAddressId' })
  declare shippingAddress: BelongsTo<typeof Address>

  @belongsTo(() => Address, { foreignKey: 'billingAddressId' })
  declare billingAddress: BelongsTo<typeof Address>

  @belongsTo(() => PaymentMethod)
  declare paymentMethod: BelongsTo<typeof PaymentMethod>

  @hasMany(() => OrderItem)
  declare items: HasMany<typeof OrderItem>

  @hasOne(() => Invoice)
  declare invoice: HasOne<typeof Invoice>
}
