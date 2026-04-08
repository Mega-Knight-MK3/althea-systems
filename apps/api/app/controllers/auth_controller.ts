import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { loginValidator, registerValidator } from '#validators/auth'

const TOKEN_EXPIRES_IN = '7 days'
const TOKEN_NAME = 'storefront_session'

export default class AuthController {
  async register({ request, response }: HttpContext) {
    const payload = await request.validateUsing(registerValidator)
    const user = await User.create(payload)
    const token = await User.accessTokens.create(user, ['*'], {
      name: TOKEN_NAME,
      expiresIn: TOKEN_EXPIRES_IN,
    })

    return response.created({
      user,
      token: serializeToken(token),
    })
  }

  async login({ request }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)
    const user = await User.verifyCredentials(email, password)
    const token = await User.accessTokens.create(user, ['*'], {
      name: TOKEN_NAME,
      expiresIn: TOKEN_EXPIRES_IN,
    })

    return {
      user,
      token: serializeToken(token),
    }
  }

  async refresh({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const current = user.currentAccessToken
    await User.accessTokens.delete(user, current.identifier)
    const token = await User.accessTokens.create(user, ['*'], {
      name: TOKEN_NAME,
      expiresIn: TOKEN_EXPIRES_IN,
    })

    return {
      user,
      token: serializeToken(token),
    }
  }

  async logout({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await User.accessTokens.delete(user, user.currentAccessToken.identifier)
    return response.noContent()
  }

  async me({ auth }: HttpContext) {
    return { user: auth.getUserOrFail() }
  }
}

function serializeToken(token: Awaited<ReturnType<typeof User.accessTokens.create>>) {
  return {
    type: 'bearer' as const,
    value: token.value!.release(),
    expiresAt: token.expiresAt,
  }
}
