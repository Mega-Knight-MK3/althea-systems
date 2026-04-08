import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table.string('status').notNullable().defaultTo('pending')
      table.decimal('subtotal', 10, 2).notNullable()
      table.decimal('tax', 10, 2).notNullable().defaultTo(0)
      table.decimal('shipping_cost', 10, 2).notNullable().defaultTo(0)
      table.decimal('total', 10, 2).notNullable()
      table
        .integer('shipping_address_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('addresses')
        .onDelete('SET NULL')
      table
        .integer('billing_address_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('addresses')
        .onDelete('SET NULL')
      table
        .integer('payment_method_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('payment_methods')
        .onDelete('SET NULL')
      table.string('stripe_payment_intent_id').nullable()
      table.timestamp('placed_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}