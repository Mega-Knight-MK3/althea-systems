<script setup lang="ts">
const props = defineProps<{ open: boolean; title?: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()

watch(
  () => props.open,
  (isOpen) => {
    if (import.meta.client) {
      document.documentElement.style.overflow = isOpen ? 'hidden' : ''
    }
  }
)

onBeforeUnmount(() => {
  if (import.meta.client) {
    document.documentElement.style.overflow = ''
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-end justify-center bg-neutral-900/60 p-0 md:items-center md:p-4"
        @click.self="emit('close')"
      >
        <div
          class="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl md:max-w-lg md:rounded-2xl"
          role="dialog"
          aria-modal="true"
        >
          <header v-if="title || $slots.header" class="mb-6 flex items-start justify-between gap-4">
            <h2 v-if="title" class="font-display text-h3 font-medium text-brand-text">{{ title }}</h2>
            <slot name="header" />
            <button
              type="button"
              class="text-neutral-500 transition-colors hover:text-brand-500"
              aria-label="Fermer"
              @click="emit('close')"
            >
              <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M6 6l12 12" />
                <path d="M18 6 6 18" />
              </svg>
            </button>
          </header>
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
