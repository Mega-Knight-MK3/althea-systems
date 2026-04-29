import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'chatbot_messages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('session_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('chatbot_sessions')
        .onDelete('CASCADE')
      table.enum('role', ['user', 'bot', 'agent']).notNullable()
      table.text('content').notNullable()
      table.string('intent', 80).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.index(['session_id', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
