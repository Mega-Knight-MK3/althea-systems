<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

const handleOutsideClick = (event: MouseEvent) => {
  if (!root.value || !open.value) return
  if (!root.value.contains(event.target as Node)) open.value = false
}

onMounted(() => {
  if (import.meta.client) document.addEventListener('click', handleOutsideClick)
})

onBeforeUnmount(() => {
  if (import.meta.client) document.removeEventListener('click', handleOutsideClick)
})

const items = computed(() =>
  (locales.value as Array<{ code: string, name?: string, dir?: string }>).map((l) => ({
    code: l.code,
    name: l.name ?? l.code,
    dir: l.dir ?? 'ltr'
  }))
)

const current = computed(() => items.value.find((l) => l.code === locale.value))

function pick(code: string) {
  setLocale(code as 'fr' | 'en' | 'ar')
  open.value = false
}
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-brand-500"
      :aria-label="$t('nav.language')"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="font-medium uppercase">{{ current?.code }}</span>
      <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
    <ul
      v-if="open"
      class="absolute right-0 z-30 mt-1 min-w-[140px] overflow-hidden rounded-md border border-neutral-100 bg-white shadow-lg"
      role="listbox"
    >
      <li v-for="item in items" :key="item.code">
        <button
          type="button"
          class="flex w-full items-center justify-between gap-3 px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50"
          :class="{ 'bg-brand-50 text-brand-text': item.code === locale }"
          :aria-selected="item.code === locale"
          @click="pick(item.code)"
        >
          <span>{{ item.name }}</span>
          <span class="font-mono text-xs uppercase text-neutral-400">{{ item.code }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>
