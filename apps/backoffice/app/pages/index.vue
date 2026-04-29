<script setup lang="ts">
interface DashboardStats {
  revenue: { day: number, week: number, month: number }
  todayOrders: number
  outOfStock: number
  unreadMessages: number
  recentOrders: Array<{
    id: number
    status: string
    total: number
    createdAt: string
    customer: string
  }>
}

const api = useApi()
const { user } = useAdminAuth()
const { currency, dateTime } = useFormat()

const { data: stats, pending, refresh } = await useAsyncData<DashboardStats>('admin-dashboard', () =>
  api<DashboardStats>('/admin/dashboard/stats')
)

const kpiCards = computed(() => {
  const s = stats.value
  return [
    { label: 'Revenu du jour', value: s ? currency(s.revenue.day) : '—', icon: 'i-lucide-banknote', color: 'primary' },
    { label: 'Cette semaine', value: s ? currency(s.revenue.week) : '—', icon: 'i-lucide-calendar-days', color: 'primary' },
    { label: 'Ce mois-ci', value: s ? currency(s.revenue.month) : '—', icon: 'i-lucide-trending-up', color: 'primary' },
    { label: 'Commandes aujourd\'hui', value: s ? String(s.todayOrders) : '—', icon: 'i-lucide-shopping-bag', color: 'neutral' }
  ] as const
})

const alerts = computed(() => {
  const s = stats.value
  return [
    {
      label: 'Produits en rupture',
      value: s?.outOfStock ?? 0,
      icon: 'i-lucide-package-x',
      color: (s?.outOfStock ?? 0) > 0 ? 'error' : 'neutral',
      to: '/products'
    },
    {
      label: 'Messages non lus',
      value: s?.unreadMessages ?? 0,
      icon: 'i-lucide-mail',
      color: (s?.unreadMessages ?? 0) > 0 ? 'warning' : 'neutral',
      to: '/messages'
    }
  ] as const
})

const statusColor: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'neutral'> = {
  pending: 'warning',
  paid: 'primary',
  processing: 'primary',
  shipped: 'primary',
  delivered: 'success',
  cancelled: 'error',
  refunded: 'neutral'
}
</script>

<template>
  <UDashboardNavbar title="Tableau de bord">
    <template #right>
      <UButton
        icon="i-lucide-refresh-cw"
        variant="ghost"
        color="neutral"
        :loading="pending"
        aria-label="Rafraîchir"
        @click="refresh()"
      />
    </template>
  </UDashboardNavbar>

  <UDashboardPanelContent>
    <div class="space-y-6">
      <header>
        <p class="text-sm text-muted">Bienvenue</p>
        <h1 class="text-2xl font-semibold">{{ user?.fullName || user?.email }}</h1>
      </header>

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <UCard v-for="kpi in kpiCards" :key="kpi.label">
          <div class="flex items-start gap-3">
            <div class="rounded-lg bg-elevated p-2">
              <UIcon :name="kpi.icon" class="size-5 text-primary" />
            </div>
            <div>
              <p class="text-sm text-muted">{{ kpi.label }}</p>
              <p class="text-2xl font-semibold">{{ kpi.value }}</p>
            </div>
          </div>
        </UCard>
      </section>

      <section class="grid gap-4 md:grid-cols-2">
        <UCard v-for="alert in alerts" :key="alert.label">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <UIcon :name="alert.icon" class="size-5" :class="alert.color === 'error' ? 'text-error' : alert.color === 'warning' ? 'text-warning' : 'text-muted'" />
              <p class="font-medium">{{ alert.label }}</p>
            </div>
            <UBadge :color="alert.color" variant="subtle">{{ alert.value }}</UBadge>
          </div>
          <template #footer>
            <UButton :to="alert.to" variant="ghost" color="neutral" size="sm" trailing-icon="i-lucide-arrow-right">
              Voir le détail
            </UButton>
          </template>
        </UCard>
      </section>

      <section class="grid gap-4 lg:grid-cols-3">
        <UCard class="lg:col-span-2">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="font-semibold">Dernières commandes</h2>
              <UButton to="/orders" variant="link" color="neutral" size="sm">Toutes les commandes</UButton>
            </div>
          </template>
          <div v-if="stats?.recentOrders?.length" class="divide-y divide-default">
            <div
              v-for="order in stats.recentOrders"
              :key="order.id"
              class="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div>
                <p class="font-medium">#{{ order.id }} — {{ order.customer }}</p>
                <p class="text-sm text-muted">{{ dateTime(order.createdAt) }}</p>
              </div>
              <div class="flex items-center gap-3">
                <UBadge :color="statusColor[order.status] || 'neutral'" variant="subtle">{{ order.status }}</UBadge>
                <span class="font-semibold">{{ currency(order.total) }}</span>
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-muted">Aucune commande pour l'instant.</p>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold">Actions rapides</h2>
          </template>
          <div class="flex flex-col gap-2">
            <UButton to="/orders/new" icon="i-lucide-plus-circle" color="primary" block>Nouvelle commande</UButton>
            <UButton to="/products/new" icon="i-lucide-package-plus" variant="soft" block>Ajouter un produit</UButton>
            <UButton to="/messages" icon="i-lucide-mails" variant="soft" color="neutral" block>Voir les messages</UButton>
          </div>
        </UCard>
      </section>
    </div>
  </UDashboardPanelContent>
</template>
