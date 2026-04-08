<script setup lang="ts">
defineProps<{ message: string | null | undefined }>()
</script>

<template>
  <p v-if="message" class="bg-danger/10 text-danger mt-4 rounded-md px-4 py-2 text-sm">
    {{ message }}
  </p>
</template>
