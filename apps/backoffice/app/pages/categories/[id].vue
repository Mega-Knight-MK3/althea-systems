<script setup lang="ts">
import type { AdminCategory } from '~/composables/useApiTypes'

const route = useRoute()
const router = useRouter()
const api = useApi()
const toast = useToast()
const id = Number(route.params.id)

const { data: categories, refresh } = await useAsyncData<AdminCategory[]>('admin-categories-list', () =>
  api<AdminCategory[]>('/admin/categories')
)

const category = computed(() => categories.value?.find((c) => c.id === id) ?? null)

if (!category.value) {
  throw createError({ statusCode: 404, statusMessage: 'Catégorie introuvable' })
}

async function destroy() {
  if (!category.value) return
  if (!confirm(`Supprimer la catégorie « ${category.value.name} » ?`)) return
  await api(`/admin/categories/${category.value.id}`, { method: 'DELETE' })
  toast.add({ color: 'success', title: 'Catégorie supprimée.' })
  router.push('/categories')
}
</script>

<template>
  <UDashboardNavbar :title="category?.name ?? 'Catégorie'">
    <template #left>
      <UButton to="/categories" icon="i-lucide-arrow-left" variant="ghost" color="neutral" label="Retour" />
    </template>
    <template #right>
      <UButton color="error" variant="soft" icon="i-lucide-trash-2" label="Supprimer" @click="destroy" />
    </template>
  </UDashboardNavbar>
  <UDashboardPanelContent class="p-4 sm:p-6">
    <UCard v-if="category">
      <CategoryForm :category="category" :parents="categories ?? []" @saved="refresh()" />
    </UCard>
  </UDashboardPanelContent>
</template>
