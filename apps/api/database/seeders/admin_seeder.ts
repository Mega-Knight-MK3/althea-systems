import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import env from '#start/env'
import User from '#models/user'

export default class AdminSeeder extends BaseSeeder {
  async run() {
    const email = env.get('ADMIN_EMAIL', 'admin@althea.local')
    const password = env.get('ADMIN_PASSWORD', 'AltheaAdmin!2026')
    const fullName = env.get('ADMIN_FULL_NAME', 'Althea Admin')

    const existing = await User.findBy('email', email)
    if (existing) {
      existing.role = 'admin'
      existing.isActive = true
      if (!existing.emailVerifiedAt) existing.emailVerifiedAt = DateTime.now()
      await existing.save()
      return
    }

    await User.create({
      email,
      password,
      fullName,
      role: 'admin',
      isActive: true,
      emailVerifiedAt: DateTime.now(),
    })
  }
}
