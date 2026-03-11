import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('status').notNullable().defaultTo('pending')
      table.decimal('subtotal', 10, 2).notNullable()
      table.decimal('tax', 10, 2).notNullable()
      table.decimal('shipping_cost', 10, 2).notNullable()
      table.decimal('total', 10, 2).notNullable()
      table.integer('shipping_address_id').unsigned().notNullable().references('id').inTable('addresses')
      table.integer('billing_address_id').unsigned().notNullable().references('id').inTable('addresses')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}