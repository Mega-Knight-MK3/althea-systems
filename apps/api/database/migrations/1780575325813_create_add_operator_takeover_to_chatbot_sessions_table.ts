import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'chatbot_sessions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('operator_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
      table.timestamp('taken_over_at', { useTz: true }).nullable()
      table.boolean('is_active').notNullable().defaultTo(true)
      table.index(['operator_id'])
      table.index(['escalated', 'operator_id', 'is_active'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['escalated', 'operator_id', 'is_active'])
      table.dropIndex(['operator_id'])
      table.dropColumn('is_active')
      table.dropColumn('taken_over_at')
      table.dropColumn('operator_id')
    })
  }
}