export default defineNuxtPlugin((nuxtApp) => {
  const i18n = nuxtApp.$i18n as { locale: { value: string }, locales: { value: Array<{ code: string, dir?: string }> } }

  const apply = (code: string) => {
    const meta = i18n.locales.value.find((l) => l.code === code)
    const dir = meta?.dir ?? 'ltr'
    document.documentElement.setAttribute('dir', dir)
    document.documentElement.setAttribute('lang', code)
  }

  apply(i18n.locale.value)
  watch(() => i18n.locale.value, (next) => apply(next))
})
