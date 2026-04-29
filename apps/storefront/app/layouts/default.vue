<script setup lang="ts">
const menuOpen = ref(false)
const { t } = useI18n()
</script>

<template>
  <div class="flex min-h-screen flex-col bg-white text-neutral-800">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-md focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
    >
      {{ t('nav.skip_to_content') }}
    </a>
    <AppLoadingBar />
    <AppHeader @open-menu="menuOpen = true" />
    <main id="main-content" class="flex-1" tabindex="-1">
      <slot />
    </main>
    <AppFooter />
    <AppMobileMenu :open="menuOpen" @close="menuOpen = false" />
    <ClientOnly>
      <AppChatbot />
    </ClientOnly>
    <AppToastHost />
  </div>
</template>
