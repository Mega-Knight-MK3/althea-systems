import type { AuthToken, AuthUser } from './useAuth'

interface LoginResponse {
  user: AuthUser
  token: AuthToken
  emailVerified: boolean
}

interface RegisterResponse {
  user: AuthUser
}

export function useAuthApi() {
  const api = useApi()
  const auth = useAuth()

  async function register(payload: { fullName?: string; email: string; password: string }) {
    return api<RegisterResponse>('/auth/register', { method: 'POST', body: payload })
  }

  async function login(payload: { email: string; password: string; rememberMe?: boolean }) {
    const response = await api<LoginResponse>('/auth/login', { method: 'POST', body: payload })
    auth.setSession(response.user, response.token, payload.rememberMe ?? false)
    return response
  }

  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST' })
    } finally {
      auth.clearSession()
    }
  }

  async function refreshMe() {
    const { user } = await api<{ user: AuthUser; emailVerified: boolean }>('/auth/me')
    auth.setUser(user)
    return user
  }

  async function verifyEmail(token: string) {
    return api<{ user: AuthUser }>('/auth/verify-email', {
      method: 'POST',
      body: { token },
    })
  }

  async function requestPasswordReset(email: string) {
    return api<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    })
  }

  async function resetPassword(token: string, password: string) {
    return api<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: { token, password },
    })
  }

  return {
    register,
    login,
    logout,
    refreshMe,
    verifyEmail,
    requestPasswordReset,
    resetPassword,
  }
}
