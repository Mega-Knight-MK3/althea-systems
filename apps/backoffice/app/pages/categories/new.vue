<script setup lang="ts">
import type { AdminCategory } from '~/composables/useApiTypes'

const api = useApi()
const { data: parents } = await useAsyncData<AdminCategory[]>('admin-categories-list', () =>
  api<AdminCategory[]>('/admin/categories')
)
</script>

<template>
  <UDashboardNavbar title="Nouvelle catégorie">
    <template #left>
      <UButton to="/categories" icon="i-lucide-arrow-left" variant="ghost" color="neutral" label="Retour" />
    </template>
  </UDashboardNavbar>
  <div class="flex flex-col gap-4 sm:gap-6 flex-1 overflow-y-auto p-4 sm:p-6">
    <UCard>
      <CategoryForm :parents="parents ?? []" />
    </UCard>
  </div>
</template>
