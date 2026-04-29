<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useHead({ title: 'Mes commandes — Althea Systems' })

const checkoutApi = useCheckoutApi()
const config = useRuntimeConfig()
const orders = ref<Awaited<ReturnType<typeof checkoutApi.listOrders>>>(
  await checkoutApi.listOrders()
)

const formatPrice = (value: number | string) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(value))

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString('fr-FR') : '—'

const yearFilter = ref<number | 'all'>('all')
const statusFilter = ref<string>('all')
const search = ref('')

const expanded = ref<Set<number>>(new Set())
function toggleExpand(id: number) {
  const copy = new Set(expanded.value)
  if (copy.has(id)) copy.delete(id); else copy.add(id)
  expanded.value = copy
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  paid: 'Payée',
  processing: 'En préparation',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  refunded: 'Remboursée'
}

const availableYears = computed(() => {
  const set = new Set<number>()
  for (const order of orders.value) {
    set.add(new Date(order.placedAt ?? order.createdAt).getFullYear())
  }
  return Array.from(set).sort((a, b) => b - a)
})

const availableStatuses = computed(() => {
  const set = new Set<string>()
  for (const order of orders.value) set.add(order.status)
  return Array.from(set)
})

const filtered = computed(() => {
  const needle = search.value.trim().toLowerCase()
  return orders.value.filter((order) => {
    const year = new Date(order.placedAt ?? order.createdAt).getFullYear()
    if (yearFilter.value !== 'all' && year !== yearFilter.value) return false
    if (statusFilter.value !== 'all' && order.status !== statusFilter.value) return false
    if (!needle) return true
    if (String(order.id).includes(needle)) return true
    return order.items.some((item) => item.productName.toLowerCase().includes(needle))
  })
})

const ordersByYear = computed(() => {
  const grouped = new Map<number, typeof orders.value>()
  for (const order of filtered.value) {
    const year = new Date(order.placedAt ?? order.createdAt).getFullYear()
    if (!grouped.has(year)) grouped.set(year, [])
    grouped.get(year)!.push(order)
  }
  return Array.from(grouped.entries()).sort((a, b) => b[0] - a[0])
})

function clearFilters() {
  yearFilter.value = 'all'
  statusFilter.value = 'all'
  search.value = ''
}
</script>

<template>
  <section class="mx-auto w-full max-w-[1000px] px-4 py-12 md:px-10 md:py-16">
    <NuxtLink to="/account" class="text-sm text-neutral-500 hover:text-brand-500">← Mon compte</NuxtLink>
    <h1 class="font-display text-h1 mt-2 font-medium text-brand-text">Mes commandes</h1>

    <p v-if="!orders.length" class="mt-8 text-sm text-neutral-500">
      Vous n'avez pas encore passé de commande.
    </p>

    <template v-else>
      <div class="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-neutral-100 bg-white p-4">
        <label class="block text-xs font-medium uppercase tracking-wide text-neutral-500">
          Année
          <select v-model="yearFilter" class="mt-1 block rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-brand-400 focus:outline-none">
            <option value="all">Toutes</option>
            <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
          </select>
        </label>
        <label class="block text-xs font-medium uppercase tracking-wide text-neutral-500">
          Statut
          <select v-model="statusFilter" class="mt-1 block rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-brand-400 focus:outline-none">
            <option value="all">Tous</option>
            <option v-for="s in availableStatuses" :key="s" :value="s">{{ STATUS_LABELS[s] || s }}</option>
          </select>
        </label>
        <label class="block flex-1 text-xs font-medium uppercase tracking-wide text-neutral-500 min-w-[200px]">
          Rechercher
          <input
            v-model="search"
            type="search"
            placeholder="Produit ou n° de commande..."
            class="mt-1 block w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-800 focus:border-brand-400 focus:outline-none"
          />
        </label>
        <button
          type="button"
          class="rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-700 hover:border-brand-500 hover:text-brand-500"
          @click="clearFilters"
        >
          Réinitialiser
        </button>
      </div>

      <p v-if="!filtered.length" class="mt-8 text-sm text-neutral-500">
        Aucune commande ne correspond à ces filtres.
      </p>

      <div v-else class="mt-10 space-y-12">
        <section v-for="[year, list] in ordersByYear" :key="year">
          <h2 class="font-display text-h3 font-medium text-brand-text">{{ year }}</h2>
          <ul class="mt-4 space-y-3">
            <li
              v-for="order in list"
              :key="order.id"
              class="rounded-xl border border-neutral-100 bg-white"
            >
              <button
                type="button"
                class="flex w-full flex-wrap items-center justify-between gap-4 p-5 text-left"
                :aria-expanded="expanded.has(order.id)"
                :aria-controls="`order-${order.id}-detail`"
                @click="toggleExpand(order.id)"
              >
                <div>
                  <p class="font-display text-base font-medium text-brand-text">Commande #{{ order.id }}</p>
                  <p class="text-caption mt-1 text-neutral-500">
                    {{ formatDate(order.placedAt ?? order.createdAt) }} ·
                    {{ order.items.length }} produit{{ order.items.length > 1 ? 's' : '' }}
                  </p>
                </div>
                <div class="text-right flex items-center gap-4">
                  <div>
                    <p class="font-display text-brand-500 text-base">{{ formatPrice(order.total) }}</p>
                    <p class="text-caption text-neutral-500">{{ STATUS_LABELS[order.status] || order.status }}</p>
                  </div>
                  <svg
                    viewBox="0 0 24 24"
                    class="h-5 w-5 text-neutral-400 transition-transform"
                    :class="{ 'rotate-180': expanded.has(order.id) }"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
              </button>

              <div
                v-if="expanded.has(order.id)"
                :id="`order-${order.id}-detail`"
                class="border-t border-neutral-100 px-5 py-5"
              >
                <div class="grid gap-6 md:grid-cols-2">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Produits</p>
                    <ul class="mt-2 space-y-2 text-sm">
                      <li v-for="item in order.items" :key="item.id" class="flex justify-between gap-3">
                        <span>{{ item.productName }} <span class="text-neutral-500">× {{ item.quantity }}</span></span>
                        <span class="font-medium">{{ formatPrice(item.total) }}</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Adresse de facturation</p>
                    <div v-if="order.billingAddress" class="mt-2 text-sm text-neutral-700">
                      <p>{{ order.billingAddress.fullName }}</p>
                      <p>{{ order.billingAddress.street }}</p>
                      <p v-if="order.billingAddress.line2">{{ order.billingAddress.line2 }}</p>
                      <p>{{ order.billingAddress.postalCode }} {{ order.billingAddress.city }}</p>
                      <p class="text-neutral-500">{{ order.billingAddress.country }}</p>
                    </div>
                    <p v-else class="mt-2 text-sm text-neutral-500">—</p>

                    <p class="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">Paiement</p>
                    <p v-if="order.paymentMethod" class="mt-2 text-sm text-neutral-700">
                      {{ order.paymentMethod.brand }} se terminant par {{ order.paymentMethod.lastFour }}
                    </p>
                    <p v-else-if="order.stripePaymentIntentId" class="mt-2 text-sm text-neutral-500">Carte (Stripe)</p>
                    <p v-else class="mt-2 text-sm text-neutral-500">—</p>
                  </div>
                </div>

                <div class="mt-5 flex flex-wrap gap-3 text-sm">
                  <a
                    v-if="order.invoice"
                    :href="`${config.public.apiBase}/account/orders/${order.id}/invoice`"
                    target="_blank"
                    class="rounded-md border border-neutral-200 px-3 py-1 text-neutral-700 hover:border-brand-500 hover:text-brand-500"
                  >
                    Télécharger la facture
                  </a>
                </div>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </section>
</template>
