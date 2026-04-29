import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/fonts', '@nuxtjs/i18n'],
  i18n: {
    defaultLocale: 'fr',
    strategy: 'no_prefix',
    locales: [
      { code: 'fr', name: 'Français', file: 'fr.json', dir: 'ltr' },
      { code: 'en', name: 'English', file: 'en.json', dir: 'ltr' },
      { code: 'ar', name: 'العربية', file: 'ar.json', dir: 'rtl' }
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'althea_locale',
      redirectOn: 'root',
      fallbackLocale: 'fr'
    }
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3333',
      stripePublishableKey: process.env.NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    },
  },
  css: ['~~/assets/css/main.css'],
  fonts: {
    families: [
      { name: 'Inter', provider: 'google', weights: [400, 500, 600] },
      { name: 'Poppins', provider: 'google', weights: [600, 700] },
    ],
  },
  vite: {
    plugins: [tailwindcss()],
  },
})
