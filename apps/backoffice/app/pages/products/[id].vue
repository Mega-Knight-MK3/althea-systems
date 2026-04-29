<script setup lang="ts">
import type { AdminCategory, AdminProduct, Paginated } from '~/composables/useApiTypes'

const route = useRoute()
const router = useRouter()
const api = useApi()
const toast = useToast()
const id = Number(route.params.id)

const { data: categories } = await useAsyncData<AdminCategory[]>('admin-categories', () =>
  api<AdminCategory[]>('/categories')
)

const { data: product, refresh } = await useAsyncData<AdminProduct | null>(`admin-product-${id}`, async () => {
  const list = await api<Paginated<AdminProduct>>('/admin/products', {
    params: { perPage: 100, status: 'all' }
  })
  return list.data.find((p) => p.id === id) ?? null
})

if (!product.value) {
  throw createError({ statusCode: 404, statusMessage: 'Produit introuvable' })
}

async function destroy() {
  if (!product.value) return
  if (!confirm(`Supprimer le produit “${product.value.name}” ?`)) return
  await api(`/admin/products/${product.value.id}`, { method: 'DELETE' })
  toast.add({ color: 'success', title: 'Produit supprimé.' })
  router.push('/products')
}
</script>

<template>
  <UDashboardNavbar :title="product?.name ?? 'Produit'">
    <template #left>
      <UButton to="/products" icon="i-lucide-arrow-left" variant="ghost" color="neutral" label="Retour" />
    </template>
    <template #right>
      <UButton color="error" variant="soft" icon="i-lucide-trash-2" label="Supprimer" @click="destroy" />
    </template>
  </UDashboardNavbar>
  <UDashboardPanelContent class="p-4 sm:p-6">
    <UCard v-if="product">
      <ProductForm :product="product" :categories="categories ?? []" @saved="refresh()" />
    </UCard>
  </UDashboardPanelContent>
</template>
