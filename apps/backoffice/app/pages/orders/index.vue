<script setup lang="ts">
import type { AdminOrder, OrderStatus, Paginated } from '~/composables/useApiTypes'

const route = useRoute()
const api = useApi()
const { currency, dateTime } = useFormat()
const { statuses, label, color } = useOrderStatus()

const search = ref('')
const status = ref<'all' | OrderStatus>('all')
const userId = ref<number | null>(route.query.userId ? Number(route.query.userId) : null)
const page = ref(1)
const perPage = ref(25)

const debouncedSearch = ref('')
let debounceTimer: ReturnType<typeof setTimeout> | undefined
watch(search, (value) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { debouncedSearch.value = value }, 300)
})

const queryParams = computed(() => {
  const params: Record<string, string | number> = { page: page.value, perPage: perPage.value, status: status.value }
  if (debouncedSearch.value) params.q = debouncedSearch.value
  if (userId.value) params.userId = userId.value
  return params
})

const { data, pending, refresh } = await useAsyncData<Paginated<AdminOrder>>(
  'admin-orders',
  () => api<Paginated<AdminOrder>>('/admin/orders', { params: queryParams.value }),
  { watch: [queryParams] }
)

watch([debouncedSearch, status, perPage], () => { page.value = 1 })

const statusItems = computed(() => [
  { label: 'Tous statuts', value: 'all' as const },
  ...statuses.map((s) => ({ label: label(s), value: s }))
])
</script>

<template>
  <UDashboardNavbar title="Commandes" />
  <UDashboardPanelContent class="p-4 sm:p-6">
    <UCard>
      <template #header>
        <div class="flex flex-wrap items-center gap-3">
          <UInput v-model="search" icon="i-lucide-search" placeholder="N° commande, nom, email" class="w-64" />
          <USelect v-model="status" :items="statusItems" class="w-48" />
          <USelect v-model="perPage" :items="[{ label: '10', value: 10 }, { label: '25', value: 25 }, { label: '50', value: 50 }]" class="w-24" />
          <UBadge v-if="userId" color="primary" variant="subtle" class="ml-2">
            Utilisateur #{{ userId }}
            <button class="ml-2" @click="userId = null">×</button>
          </UBadge>
          <UButton class="ml-auto" icon="i-lucide-refresh-cw" variant="ghost" color="neutral" :loading="pending" aria-label="Rafraîchir" @click="refresh()" />
        </div>
      </template>

      <div v-if="pending && !data" class="py-12 text-center text-sm text-muted">Chargement...</div>
      <div v-else-if="!data?.data?.length" class="py-12 text-center text-sm text-muted">Aucune commande.</div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="text-left text-muted uppercase text-xs">
            <tr>
              <th class="px-3 py-2">N°</th>
              <th class="px-3 py-2">Date</th>
              <th class="px-3 py-2">Client</th>
              <th class="px-3 py-2 text-right">Montant TTC</th>
              <th class="px-3 py-2">Paiement</th>
              <th class="px-3 py-2">Statut</th>
              <th class="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-for="order in data.data" :key="order.id">
              <td class="px-3 py-3 font-medium">#{{ order.id }}</td>
              <td class="px-3 py-3 text-muted text-xs">{{ dateTime(order.createdAt) }}</td>
              <td class="px-3 py-3">
                <div class="font-medium">{{ order.customer }}</div>
                <div v-if="order.customerEmail" class="text-xs text-muted">{{ order.customerEmail }}</div>
              </td>
              <td class="px-3 py-3 text-right font-semibold">{{ currency(Number(order.total)) }}</td>
              <td class="px-3 py-3 text-xs">
                <span v-if="order.paymentMethod">{{ order.paymentMethod.brand }} •••• {{ order.paymentMethod.lastFour }}</span>
                <span v-else-if="order.stripePaymentIntentId" class="text-muted">Stripe</span>
                <span v-else class="text-muted">—</span>
              </td>
              <td class="px-3 py-3">
                <UBadge :color="color(order.status)" variant="subtle">{{ label(order.status) }}</UBadge>
              </td>
              <td class="px-3 py-3 text-right">
                <UButton :to="`/orders/${order.id}`" icon="i-lucide-arrow-right" variant="ghost" color="neutral" size="sm" aria-label="Détail" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <template v-if="data && data.meta.lastPage > 1" #footer>
        <div class="flex items-center justify-between">
          <p class="text-sm text-muted">{{ data.meta.total }} commande(s) — page {{ data.meta.currentPage }} / {{ data.meta.lastPage }}</p>
          <UPagination v-model:page="page" :items-per-page="perPage" :total="data.meta.total" />
        </div>
      </template>
    </UCard>
  </UDashboardPanelContent>
</template>
