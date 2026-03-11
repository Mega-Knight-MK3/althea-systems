import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'credit_notes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('invoice_id').unsigned().notNullable().references('id').inTable('invoices').onDelete('CASCADE')
      table.string('credit_note_number').notNullable().unique()
      table.decimal('amount', 10, 2).notNullable()
      table.text('reason').notNullable()
      table.timestamp('issued_at').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}