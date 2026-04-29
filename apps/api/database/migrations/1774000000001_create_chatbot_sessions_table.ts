import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'chatbot_sessions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.string('visitor_name', 120).nullable()
      table.string('visitor_email', 160).nullable()
      table.string('subject', 160).nullable()
      table.boolean('escalated').notNullable().defaultTo(false)
      table.timestamp('escalated_at', { useTz: true }).nullable()
      table.boolean('is_read').notNullable().defaultTo(false)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).nullable()
      table.index(['escalated', 'is_read'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
