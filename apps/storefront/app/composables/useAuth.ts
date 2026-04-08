export interface AuthUser {
  id: number
  email: string
  fullName: string | null
  phone: string | null
  role: 'customer' | 'admin'
  emailVerifiedAt: string | null
  isActive: boolean
}

export interface AuthToken {
  type: 'bearer'
  value: string
  expiresAt: string | null
}

interface AuthState {
  user: AuthUser | null
  token: AuthToken | null
}

const TOKEN_COOKIE = 'althea_token'
const USER_COOKIE = 'althea_user'

export function useAuth() {
  const tokenCookie = useCookie<AuthToken | null>(TOKEN_COOKIE, {
    default: () => null,
    sameSite: 'lax',
    secure: false,
  })
  const userCookie = useCookie<AuthUser | null>(USER_COOKIE, {
    default: () => null,
    sameSite: 'lax',
    secure: false,
  })
  const state = useState<AuthState>('auth', () => ({
    user: userCookie.value,
    token: tokenCookie.value,
  }))

  const isAuthenticated = computed(() => state.value.user !== null && state.value.token !== null)
  const isEmailVerified = computed(() => state.value.user?.emailVerifiedAt !== null)

  function setSession(user: AuthUser, token: AuthToken, persistent = false) {
    state.value = { user, token }
    userCookie.value = user
    tokenCookie.value = token
    if (persistent) {
      const maxAge = 60 * 60 * 24 * 30
      tokenCookie.value = { ...token }
      ;(tokenCookie as unknown as { maxAge?: number }).maxAge = maxAge
    }
  }

  function setUser(user: AuthUser) {
    state.value = { ...state.value, user }
    userCookie.value = user
  }

  function clearSession() {
    state.value = { user: null, token: null }
    userCookie.value = null
    tokenCookie.value = null
  }

  return {
    user: computed(() => state.value.user),
    token: computed(() => state.value.token),
    isAuthenticated,
    isEmailVerified,
    setSession,
    setUser,
    clearSession,
  }
}
