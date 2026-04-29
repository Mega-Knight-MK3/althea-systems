export interface AdminAuthUser {
  id: number
  email: string
  fullName: string | null
  role: 'customer' | 'admin'
  emailVerifiedAt: string | null
  isActive: boolean
}

export interface AdminToken {
  type: 'bearer'
  value: string
  expiresAt: string | null
}

interface AdminAuthState {
  user: AdminAuthUser | null
  token: AdminToken | null
  twoFactorEnabled: boolean
}

const TOKEN_COOKIE = 'althea_admin_token'
const USER_COOKIE = 'althea_admin_user'
const TWO_FA_COOKIE = 'althea_admin_2fa'

export function useAdminAuth() {
  const tokenCookie = useCookie<AdminToken | null>(TOKEN_COOKIE, {
    default: () => null,
    sameSite: 'lax',
    secure: false
  })
  const userCookie = useCookie<AdminAuthUser | null>(USER_COOKIE, {
    default: () => null,
    sameSite: 'lax',
    secure: false
  })
  const twoFaCookie = useCookie<boolean>(TWO_FA_COOKIE, {
    default: () => false,
    sameSite: 'lax',
    secure: false
  })

  const state = useState<AdminAuthState>('admin-auth', () => ({
    user: userCookie.value,
    token: tokenCookie.value,
    twoFactorEnabled: twoFaCookie.value ?? false
  }))

  const isAuthenticated = computed(() => state.value.user !== null && state.value.token !== null)

  function setSession(user: AdminAuthUser, token: AdminToken, twoFactorEnabled: boolean) {
    state.value = { user, token, twoFactorEnabled }
    userCookie.value = user
    tokenCookie.value = token
    twoFaCookie.value = twoFactorEnabled
  }

  function setTwoFactorEnabled(value: boolean) {
    state.value = { ...state.value, twoFactorEnabled: value }
    twoFaCookie.value = value
  }

  function clearSession() {
    state.value = { user: null, token: null, twoFactorEnabled: false }
    userCookie.value = null
    tokenCookie.value = null
    twoFaCookie.value = false
  }

  return {
    user: computed(() => state.value.user),
    token: computed(() => state.value.token),
    twoFactorEnabled: computed(() => state.value.twoFactorEnabled),
    isAuthenticated,
    setSession,
    setTwoFactorEnabled,
    clearSession
  }
}
