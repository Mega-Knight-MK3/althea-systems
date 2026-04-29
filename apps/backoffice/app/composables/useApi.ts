export function useApi() {
  const config = useRuntimeConfig()
  const { token, clearSession } = useAdminAuth()
  return $fetch.create({
    baseURL: config.public.apiBase,
    onRequest({ options }) {
      const value = token.value?.value
      if (!value) return
      const headers = new Headers(options.headers as HeadersInit | undefined)
      headers.set('Authorization', `Bearer ${value}`)
      options.headers = headers
    },
    onResponseError({ response }) {
      if (response.status === 401) clearSession()
    }
  })
}
