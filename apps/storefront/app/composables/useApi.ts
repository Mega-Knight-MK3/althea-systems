export function useApi() {
  const config = useRuntimeConfig()
  const { token, clearSession } = useAuth()
  const { locale } = useI18n()
  return $fetch.create({
    baseURL: config.public.apiBase,
    onRequest({ options }) {
      const headers = new Headers(options.headers as HeadersInit | undefined)
      headers.set('Accept-Language', locale.value)
      const value = token.value?.value
      if (value) headers.set('Authorization', `Bearer ${value}`)
      options.headers = headers
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        clearSession()
      }
    },
  })
}
