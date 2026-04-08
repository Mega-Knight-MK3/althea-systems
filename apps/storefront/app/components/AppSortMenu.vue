<script setup lang="ts">
export type SortOption = {
  value: string
  label: string
  sort: 'priority' | 'price' | 'date' | 'stock' | 'relevance'
  order: 'asc' | 'desc'
}

const props = defineProps<{
  modelValue: string
  options: SortOption[]
}>()

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

function onChange(event: Event) {
  emit('update:modelValue', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <label class="inline-flex items-center gap-2 text-sm text-neutral-700">
    <span class="sr-only md:not-sr-only">Trier par</span>
    <select
      :value="props.modelValue"
      class="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-brand-500 focus:outline-none"
      @change="onChange"
    >
      <option v-for="option in props.options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </label>
</template>
