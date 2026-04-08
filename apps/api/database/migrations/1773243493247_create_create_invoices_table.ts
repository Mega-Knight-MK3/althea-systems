import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invoices'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('order_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('orders')
        .onDelete('RESTRICT')
      table.string('invoice_number').notNullable().unique()
      table.decimal('subtotal', 10, 2).notNullable()
      table.decimal('tax', 10, 2).notNullable().defaultTo(0)
      table.decimal('total', 10, 2).notNullable()
      table.string('pdf_path').nullable()
      table.timestamp('issued_at').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}