<script setup lang="ts">
const indicator = useLoadingIndicator()
</script>

<template>
  <div
    v-show="indicator.isLoading.value"
    class="bg-brand-500 fixed inset-x-0 top-0 z-[70] h-0.5 origin-left transition-transform duration-200"
    :style="{ transform: `scaleX(${indicator.progress.value / 100})` }"
  />
</template>
