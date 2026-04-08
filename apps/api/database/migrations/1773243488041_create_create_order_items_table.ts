import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'order_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('order_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('orders')
        .onDelete('CASCADE')
      table
        .integer('product_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('products')
        .onDelete('SET NULL')
      table.string('product_name').notNullable()
      table.integer('quantity').notNullable()
      table.decimal('unit_price', 10, 2).notNullable()
      table.decimal('total', 10, 2).notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}