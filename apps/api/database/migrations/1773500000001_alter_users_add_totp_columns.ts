import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('totp_secret').nullable()
      table.timestamp('totp_enabled_at').nullable()
      table.jsonb('totp_recovery_codes').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('totp_secret')
      table.dropColumn('totp_enabled_at')
      table.dropColumn('totp_recovery_codes')
    })
  }
}
