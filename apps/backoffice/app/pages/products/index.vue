<script setup lang="ts">
import type { AdminCategory, AdminProduct, Paginated } from '~/composables/useApiTypes'

const api = useApi()
const { currency, dateTime } = useFormat()

const search = ref('')
const status = ref<'all' | 'active' | 'inactive'>('all')
const categoryId = ref<number | null>(null)
const page = ref(1)
const perPage = ref(25)

const debouncedSearch = ref('')
let debounceTimer: ReturnType<typeof setTimeout> | undefined
watch(search, (value) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedSearch.value = value
  }, 300)
})

const { data: categories } = await useAsyncData<AdminCategory[]>('admin-categories', () =>
  api<AdminCategory[]>('/categories')
)

const queryParams = computed(() => {
  const params: Record<string, string | number> = {
    page: page.value,
    perPage: perPage.value,
    status: status.value,
    sort: 'date',
    order: 'desc'
  }
  if (debouncedSearch.value) params.q = debouncedSearch.value
  if (categoryId.value) params.categoryId = categoryId.value
  return params
})

const { data, pending, refresh } = await useAsyncData<Paginated<AdminProduct>>(
  'admin-products',
  () => api<Paginated<AdminProduct>>('/admin/products', { params: queryParams.value }),
  { watch: [queryParams] }
)

watch([debouncedSearch, status, categoryId, perPage], () => {
  page.value = 1
})

function ttc(price: number | string, vatRate: number) {
  const ht = Number(price)
  return ht + (ht * vatRate) / 100
}

const categoryItems = computed(() => [
  { label: 'Toutes', value: null as number | null },
  ...((categories.value ?? []).map((c) => ({ label: c.name, value: c.id })))
])

const statusItems = [
  { label: 'Tous', value: 'all' as const },
  { label: 'Publié', value: 'active' as const },
  { label: 'Brouillon', value: 'inactive' as const }
]

const perPageItems = [
  { label: '10 / page', value: 10 },
  { label: '25 / page', value: 25 },
  { label: '50 / page', value: 50 }
]

async function destroy(product: AdminProduct) {
  if (!confirm(`Supprimer le produit “${product.name}” ?`)) return
  await api(`/admin/products/${product.id}`, { method: 'DELETE' })
  refresh()
}

function exportCsv() {
  const rows = data.value?.data ?? []
  const header = ['id', 'nom', 'categorie', 'prix_ht', 'tva', 'prix_ttc', 'stock', 'statut', 'cree_le']
  const lines = rows.map((p) => [
    p.id,
    quote(p.name),
    quote(p.category?.name ?? ''),
    Number(p.price).toFixed(2),
    p.vatRate,
    ttc(p.price, p.vatRate).toFixed(2),
    p.stock,
    p.isActive ? 'publie' : 'brouillon',
    p.createdAt
  ].join(','))
  const csv = [header.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `produits-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function quote(value: string) {
  return `"${value.replace(/"/g, '""')}"`
}
</script>

<template>
  <UDashboardNavbar title="Produits">
    <template #right>
      <UButton to="/products/new" icon="i-lucide-plus" label="Nouveau produit" />
    </template>
  </UDashboardNavbar>

  <div class="flex flex-col gap-4 sm:gap-6 flex-1 overflow-y-auto p-4 sm:p-6">
    <UCard>
      <template #header>
        <div class="flex flex-wrap items-center gap-3">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Rechercher..."
            class="w-64"
          />
          <USelect v-model="status" :items="statusItems" class="w-40" />
          <USelect v-model="categoryId" :items="categoryItems" class="w-48" />
          <USelect v-model="perPage" :items="perPageItems" class="w-32" />
          <span class="ml-auto flex gap-2">
            <UButton
              icon="i-lucide-download"
              variant="ghost"
              color="neutral"
              label="CSV"
              :disabled="!data?.data?.length"
              @click="exportCsv"
            />
            <UButton
              icon="i-lucide-refresh-cw"
              variant="ghost"
              color="neutral"
              :loading="pending"
              aria-label="Rafraîchir"
              @click="refresh()"
            />
          </span>
        </div>
      </template>

      <div v-if="pending && !data" class="py-12 text-center text-sm text-muted">Chargement...</div>
      <div v-else-if="!data?.data?.length" class="py-12 text-center text-sm text-muted">
        Aucun produit ne correspond à ces filtres.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="text-left text-muted uppercase text-xs">
            <tr>
              <th class="px-3 py-2">Nom</th>
              <th class="px-3 py-2">Catégorie</th>
              <th class="px-3 py-2 text-right">HT</th>
              <th class="px-3 py-2 text-right">TVA</th>
              <th class="px-3 py-2 text-right">TTC</th>
              <th class="px-3 py-2 text-right">Stock</th>
              <th class="px-3 py-2">Statut</th>
              <th class="px-3 py-2">Créé le</th>
              <th class="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-for="product in data.data" :key="product.id">
              <td class="px-3 py-3">
                <div class="font-medium">{{ product.name }}</div>
                <div v-if="product.description" class="text-xs text-muted line-clamp-1 max-w-md">
                  {{ product.description }}
                </div>
              </td>
              <td class="px-3 py-3">{{ product.category?.name || '—' }}</td>
              <td class="px-3 py-3 text-right">{{ currency(product.price) }}</td>
              <td class="px-3 py-3 text-right">{{ product.vatRate }} %</td>
              <td class="px-3 py-3 text-right font-medium">{{ currency(ttc(product.price, product.vatRate)) }}</td>
              <td class="px-3 py-3 text-right">
                <span :class="product.stock <= 0 ? 'text-error font-medium' : ''">{{ product.stock }}</span>
              </td>
              <td class="px-3 py-3">
                <UBadge :color="product.isActive ? 'success' : 'warning'" variant="subtle">
                  {{ product.isActive ? 'Publié' : 'Brouillon' }}
                </UBadge>
              </td>
              <td class="px-3 py-3 text-muted text-xs">{{ dateTime(product.createdAt) }}</td>
              <td class="px-3 py-3 text-right">
                <div class="flex justify-end gap-1">
                  <UButton
                    :to="`/products/${product.id}`"
                    icon="i-lucide-pencil"
                    variant="ghost"
                    color="neutral"
                    size="sm"
                    aria-label="Éditer"
                  />
                  <UButton
                    icon="i-lucide-trash-2"
                    variant="ghost"
                    color="error"
                    size="sm"
                    aria-label="Supprimer"
                    @click="destroy(product)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <template v-if="data && data.meta.lastPage > 1" #footer>
        <div class="flex items-center justify-between">
          <p class="text-sm text-muted">
            {{ data.meta.total }} produit(s) — page {{ data.meta.currentPage }} / {{ data.meta.lastPage }}
          </p>
          <UPagination
            v-model:page="page"
            :items-per-page="perPage"
            :total="data.meta.total"
          />
        </div>
      </template>
    </UCard>
  </div>
</template>
