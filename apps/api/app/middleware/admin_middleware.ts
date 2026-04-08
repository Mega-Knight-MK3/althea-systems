import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { errors } from '@adonisjs/auth'

export default class AdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user
    if (!user || user.role !== 'admin') {
      throw new errors.E_UNAUTHORIZED_ACCESS('Admin access required', {
        guardDriverName: 'access_tokens',
      })
    }
    return next()
  }
}
