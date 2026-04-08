<script setup lang="ts">
withDefaults(defineProps<{ withWordmark?: boolean }>(), { withWordmark: true })
</script>

<template>
  <NuxtLink to="/" class="inline-flex items-center gap-3" aria-label="Althea Systems">
    <svg
      viewBox="0 0 64 64"
      class="h-10 w-10 text-brand-500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M14 38c-5 0-9-4-9-9s4-9 9-9c1.4-7 7.7-12.5 15.3-12.5 7 0 12.9 4.6 14.8 11h.4c6.8 0 12.5 5.6 12.5 12.5S51.3 43.5 44.5 43.5H14z"
        fill="currentColor"
        fill-opacity="0.18"
      />
      <path
        d="M14 38c-5 0-9-4-9-9s4-9 9-9c1.4-7 7.7-12.5 15.3-12.5 7 0 12.9 4.6 14.8 11h.4c6.8 0 12.5 5.6 12.5 12.5S51.3 43.5 44.5 43.5H14z"
        stroke="currentColor"
        stroke-width="2"
      />
      <rect x="28" y="22" width="8" height="20" rx="1.5" fill="currentColor" />
      <rect x="22" y="28" width="20" height="8" rx="1.5" fill="currentColor" />
    </svg>
    <span
      v-if="withWordmark"
      class="font-display text-xl leading-tight font-medium text-neutral-800"
    >
      Althea
      <br />
      Systems
    </span>
  </NuxtLink>
</template>
