<script setup lang="ts">
import type { AdminUser, Paginated } from '~/composables/useApiTypes'

const api = useApi()
const { currency, dateTime } = useFormat()

const search = ref('')
const status = ref<'all' | 'active' | 'inactive' | 'pending'>('all')
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

const queryParams = computed(() => {
  const params: Record<string, string | number> = {
    page: page.value,
    perPage: perPage.value,
    status: status.value
  }
  if (debouncedSearch.value) params.q = debouncedSearch.value
  return params
})

const { data, pending, refresh } = await useAsyncData<Paginated<AdminUser>>(
  'admin-users',
  () => api<Paginated<AdminUser>>('/admin/users', { params: queryParams.value }),
  { watch: [queryParams] }
)

watch([debouncedSearch, status, perPage], () => { page.value = 1 })

const statusItems = [
  { label: 'Tous', value: 'all' as const },
  { label: 'Actif', value: 'active' as const },
  { label: 'En attente', value: 'pending' as const },
  { label: 'Désactivé', value: 'inactive' as const }
]

const statusBadge: Record<string, { color: 'success' | 'warning' | 'error', label: string }> = {
  active: { color: 'success', label: 'Actif' },
  pending: { color: 'warning', label: 'En attente' },
  inactive: { color: 'error', label: 'Désactivé' }
}
</script>

<template>
  <UDashboardNavbar title="Utilisateurs" />
  <UDashboardPanelContent class="p-4 sm:p-6">
    <UCard>
      <template #header>
        <div class="flex flex-wrap items-center gap-3">
          <UInput v-model="search" icon="i-lucide-search" placeholder="Rechercher (nom, email)" class="w-64" />
          <USelect v-model="status" :items="statusItems" class="w-48" />
          <USelect v-model="perPage" :items="[{ label: '10', value: 10 }, { label: '25', value: 25 }, { label: '50', value: 50 }]" class="w-24" />
          <UButton class="ml-auto" icon="i-lucide-refresh-cw" variant="ghost" color="neutral" :loading="pending" aria-label="Rafraîchir" @click="refresh()" />
        </div>
      </template>

      <div v-if="pending && !data" class="py-12 text-center text-sm text-muted">Chargement...</div>
      <div v-else-if="!data?.data?.length" class="py-12 text-center text-sm text-muted">
        Aucun utilisateur ne correspond à ces filtres.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="text-left text-muted uppercase text-xs">
            <tr>
              <th class="px-3 py-2">Nom / Email</th>
              <th class="px-3 py-2">Rôle</th>
              <th class="px-3 py-2 text-right">Commandes</th>
              <th class="px-3 py-2 text-right">CA</th>
              <th class="px-3 py-2">Inscrit le</th>
              <th class="px-3 py-2">Statut</th>
              <th class="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-for="user in data.data" :key="user.id">
              <td class="px-3 py-3">
                <div class="font-medium">{{ user.fullName || '—' }}</div>
                <div class="text-xs text-muted">{{ user.email }}</div>
              </td>
              <td class="px-3 py-3">
                <UBadge :color="user.role === 'admin' ? 'primary' : 'neutral'" variant="subtle">
                  {{ user.role === 'admin' ? 'Admin' : 'Client' }}
                </UBadge>
              </td>
              <td class="px-3 py-3 text-right">{{ user.orderCount ?? 0 }}</td>
              <td class="px-3 py-3 text-right">{{ currency(user.totalRevenue ?? 0) }}</td>
              <td class="px-3 py-3 text-muted text-xs">{{ dateTime(user.createdAt) }}</td>
              <td class="px-3 py-3">
                <UBadge :color="statusBadge[user.accountStatus]?.color ?? 'neutral'" variant="subtle">
                  {{ statusBadge[user.accountStatus]?.label ?? user.accountStatus }}
                </UBadge>
              </td>
              <td class="px-3 py-3 text-right">
                <UButton :to="`/users/${user.id}`" icon="i-lucide-arrow-right" variant="ghost" color="neutral" size="sm" aria-label="Détail" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <template v-if="data && data.meta.lastPage > 1" #footer>
        <div class="flex items-center justify-between">
          <p class="text-sm text-muted">
            {{ data.meta.total }} utilisateur(s) — page {{ data.meta.currentPage }} / {{ data.meta.lastPage }}
          </p>
          <UPagination v-model:page="page" :items-per-page="perPage" :total="data.meta.total" />
        </div>
      </template>
    </UCard>
  </UDashboardPanelContent>
</template>
