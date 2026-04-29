<script setup lang="ts">
import type { AdminCategory } from '~/composables/useApiTypes'

const api = useApi()
const { data: categories } = await useAsyncData<AdminCategory[]>('admin-categories', () =>
  api<AdminCategory[]>('/categories')
)
</script>

<template>
  <UDashboardNavbar title="Nouveau produit">
    <template #left>
      <UButton to="/products" icon="i-lucide-arrow-left" variant="ghost" color="neutral" label="Retour" />
    </template>
  </UDashboardNavbar>
  <UDashboardPanelContent class="p-4 sm:p-6">
    <UCard>
      <ProductForm :categories="categories ?? []" />
    </UCard>
  </UDashboardPanelContent>
</template>
