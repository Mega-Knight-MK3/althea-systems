import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'homepage_slides'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.jsonb('translations').notNullable().defaultTo('{}')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('translations')
    })
  }
}
