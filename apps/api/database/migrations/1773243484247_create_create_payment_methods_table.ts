import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payment_methods'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('type').notNullable()
      table.string('stripe_payment_method_id').notNullable()
      table.string('brand', 32).nullable()
      table.string('last_four', 4).notNullable()
      table.smallint('exp_month').nullable()
      table.smallint('exp_year').nullable()
      table.boolean('is_default').notNullable().defaultTo(false)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['stripe_payment_method_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}