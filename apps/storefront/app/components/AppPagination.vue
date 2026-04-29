<script setup lang="ts">
interface Props {
  currentPage: number
  lastPage: number
  total: number
  perPage: number
  windowSize?: number
}

const props = withDefaults(defineProps<Props>(), { windowSize: 5 })
const emit = defineEmits<{ 'update:page': [number] }>()

const pages = computed<number[]>(() => {
  if (props.lastPage <= 1) return [1]
  const half = Math.floor(props.windowSize / 2)
  let start = Math.max(1, props.currentPage - half)
  let end = Math.min(props.lastPage, start + props.windowSize - 1)
  if (end - start + 1 < props.windowSize) start = Math.max(1, end - props.windowSize + 1)
  const list: number[] = []
  for (let p = start; p <= end; p++) list.push(p)
  return list
})

const rangeStart = computed(() => (props.currentPage - 1) * props.perPage + 1)
const rangeEnd = computed(() => Math.min(props.currentPage * props.perPage, props.total))

function go(page: number) {
  if (page < 1 || page > props.lastPage || page === props.currentPage) return
  emit('update:page', page)
}
</script>

<template>
  <nav v-if="lastPage > 1" class="flex items-center justify-between gap-3" aria-label="Pagination">
    <p class="text-sm text-neutral-600">
      {{ rangeStart }}–{{ rangeEnd }} sur {{ total }}
    </p>
    <ul class="flex items-center gap-1">
      <li>
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 text-sm text-neutral-700 transition-colors hover:border-brand-500 hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="currentPage <= 1"
          aria-label="Page précédente"
          @click="go(currentPage - 1)"
        >
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </li>
      <li v-for="page in pages" :key="page">
        <button
          type="button"
          class="flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-sm transition-colors"
          :class="page === currentPage
            ? 'border-brand-500 bg-brand-500 text-white'
            : 'border-neutral-200 text-neutral-700 hover:border-brand-500 hover:text-brand-500'"
          :aria-current="page === currentPage ? 'page' : undefined"
          @click="go(page)"
        >
          {{ page }}
        </button>
      </li>
      <li>
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 text-sm text-neutral-700 transition-colors hover:border-brand-500 hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="currentPage >= lastPage"
          aria-label="Page suivante"
          @click="go(currentPage + 1)"
        >
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </li>
    </ul>
  </nav>
</template>
