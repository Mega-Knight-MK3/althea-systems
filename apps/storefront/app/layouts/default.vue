<script setup lang="ts">
const menuOpen = ref(false)
</script>

<template>
  <div class="flex min-h-screen flex-col bg-white text-neutral-800">
    <AppLoadingBar />
    <AppHeader @open-menu="menuOpen = true" />
    <main class="flex-1">
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
