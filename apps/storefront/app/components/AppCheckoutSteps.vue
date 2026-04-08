<script setup lang="ts">
const props = defineProps<{ current: 1 | 2 | 3 }>()

const steps = [
  { id: 1, label: 'Identification' },
  { id: 2, label: 'Adresses' },
  { id: 3, label: 'Paiement' },
] as const

function stateOf(step: number) {
  if (step < props.current) return 'done'
  if (step === props.current) return 'current'
  return 'todo'
}
</script>

<template>
  <ol class="mt-8 flex items-center justify-between gap-4">
    <li v-for="(step, index) in steps" :key="step.id" class="flex flex-1 items-center gap-3">
      <span
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors"
        :class="{
          'bg-brand-500 text-white': stateOf(step.id) === 'current',
          'bg-success text-white': stateOf(step.id) === 'done',
          'border border-neutral-200 bg-white text-neutral-500': stateOf(step.id) === 'todo',
        }"
      >
        <svg
          v-if="stateOf(step.id) === 'done'"
          viewBox="0 0 24 24"
          class="h-5 w-5"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="5 12 10 17 19 7" />
        </svg>
        <span v-else>{{ step.id }}</span>
      </span>
      <span
        class="text-caption font-medium uppercase tracking-wide"
        :class="{
          'text-brand-500': stateOf(step.id) === 'current',
          'text-success': stateOf(step.id) === 'done',
          'text-neutral-500': stateOf(step.id) === 'todo',
        }"
      >
        {{ step.label }}
      </span>
      <span
        v-if="index < steps.length - 1"
        class="hidden h-px flex-1 md:block"
        :class="stateOf(step.id) === 'done' ? 'bg-success' : 'bg-neutral-100'"
      />
    </li>
  </ol>
</template>
