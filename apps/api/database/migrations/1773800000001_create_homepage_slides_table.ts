import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'homepage_slides'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('eyebrow', 80).nullable()
      table.string('title', 200).notNullable()
      table.text('body').nullable()
      table.string('cta_label', 80).nullable()
      table.string('cta_url', 255).nullable()
      table.string('image_url', 500).nullable()
      table.integer('position').notNullable().defaultTo(0)
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
