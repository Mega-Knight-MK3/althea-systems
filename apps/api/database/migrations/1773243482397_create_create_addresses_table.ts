import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'addresses'

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
      table.string('full_name').notNullable()
      table.string('street').notNullable()
      table.string('line2').nullable()
      table.string('city').notNullable()
      table.string('region').nullable()
      table.string('postal_code', 32).notNullable()
      table.string('country', 2).notNullable()
      table.string('phone', 32).nullable()
      table.boolean('is_default').notNullable().defaultTo(false)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}