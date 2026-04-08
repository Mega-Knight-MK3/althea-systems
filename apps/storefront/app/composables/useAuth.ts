export interface AuthUser {
  id: number
  email: string
  fullName: string | null
}

const user = ref<AuthUser | null>(null)

export function useAuth() {
  const isAuthenticated = computed(() => user.value !== null)

  function setUser(next: AuthUser | null) {
    user.value = next
  }

  function logout() {
    user.value = null
  }

  return {
    user,
    isAuthenticated,
    setUser,
    logout,
  }
}
