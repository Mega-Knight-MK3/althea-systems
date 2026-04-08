<script setup lang="ts">
const { itemCount, isEmpty } = useCart()
const { isAuthenticated } = useAuth()

const emit = defineEmits<{ (e: 'open-menu'): void }>()
</script>

<template>
  <header class="sticky top-0 z-40 bg-white">
    <div
      class="mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between gap-6 px-4 md:h-[76px] md:px-10"
    >
      <AppLogo class="shrink-0" />

      <div class="hidden flex-1 md:block">
        <AppSearchBar />
      </div>

      <div class="flex shrink-0 items-center gap-4 md:gap-6">
        <NuxtLink
          to="/cart"
          class="relative text-neutral-700 transition-colors hover:text-brand-500"
          aria-label="Panier"
        >
          <svg
            viewBox="0 0 24 24"
            class="h-6 w-6"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            aria-hidden="true"
          >
            <path
              d="M3 4h2.4l2.6 11h11l2-8H7"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <circle cx="10" cy="20" r="1.4" fill="currentColor" />
            <circle cx="18" cy="20" r="1.4" fill="currentColor" />
          </svg>
          <span
            v-if="!isEmpty"
            class="bg-brand-500 absolute -top-1 -right-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold text-white"
            aria-label="Articles dans le panier"
          >
            {{ itemCount }}
          </span>
        </NuxtLink>

        <button
          type="button"
          class="hidden text-neutral-700 transition-colors hover:text-brand-500 md:inline-flex"
          aria-label="Changer la langue"
        >
          <svg
            viewBox="0 0 24 24"
            class="h-6 w-6"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            aria-hidden="true"
          >
            <path d="M3 6h12" stroke-linecap="round" />
            <path d="M9 4v2" stroke-linecap="round" />
            <path d="M5 6c0 5 3 8 7 9" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M14 15c0-3 2-5 4-5s4 2 4 5l-2 5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M16 17h6" stroke-linecap="round" />
          </svg>
        </button>

        <NuxtLink
          :to="isAuthenticated ? '/account' : '/login'"
          class="hidden h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white transition-colors hover:bg-brand-700 md:inline-flex"
          :aria-label="isAuthenticated ? 'Mon compte' : 'Se connecter'"
        >
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor" aria-hidden="true">
            <circle cx="12" cy="9" r="4" />
            <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
          </svg>
        </NuxtLink>

        <button
          type="button"
          class="text-neutral-700 transition-colors hover:text-brand-500"
          aria-label="Ouvrir le menu"
          @click="emit('open-menu')"
        >
          <svg
            viewBox="0 0 24 24"
            class="h-7 w-7"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h16" />
          </svg>
        </button>
      </div>
    </div>

    <div class="border-b border-neutral-100 px-4 pb-3 md:hidden">
      <AppSearchBar />
    </div>
  </header>
</template>
