<script setup lang="ts">
defineProps<{ class?: string }>()
</script>

<template>
  <div
    class="animate-pulse rounded-md bg-neutral-100"
    :class="$props.class"
    aria-hidden="true"
  />
</template>
