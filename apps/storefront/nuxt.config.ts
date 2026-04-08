import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/fonts'],
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
