<script setup lang="ts">
const { toasts, dismiss } = useToast()

const toneClasses: Record<string, string> = {
  success: 'border-success/20 bg-success/10 text-success',
  error: 'border-danger/20 bg-danger/10 text-danger',
  info: 'border-brand-300/40 bg-brand-50 text-brand-text',
}
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed inset-x-4 top-4 z-[60] flex flex-col items-end gap-2 md:right-6 md:left-auto md:w-[360px]"
      aria-live="polite"
    >
      <TransitionGroup
        enter-active-class="transition-all duration-200"
        leave-active-class="transition-all duration-200"
        enter-from-class="opacity-0 -translate-y-2"
        leave-to-class="opacity-0 translate-x-4"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex w-full items-start gap-3 rounded-lg border bg-white px-4 py-3 text-sm shadow-md"
          :class="toneClasses[toast.tone]"
          role="status"
        >
          <span class="flex-1">{{ toast.message }}</span>
          <button
            type="button"
            class="text-current opacity-60 transition-opacity hover:opacity-100"
            aria-label="Fermer"
            @click="dismiss(toast.id)"
          >
            ×
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
