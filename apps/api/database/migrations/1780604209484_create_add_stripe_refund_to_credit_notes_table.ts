import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'credit_notes'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('stripe_refund_id').nullable().index()
      table
        .enum('refund_status', ['pending', 'completed', 'failed'])
        .notNullable()
        .defaultTo('pending')
      table.enum('refund_method', ['stripe', 'manual', 'bank_transfer']).notNullable().defaultTo('manual')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('stripe_refund_id')
      table.dropColumn('refund_status')
      table.dropColumn('refund_method')
    })
  }
}