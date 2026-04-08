<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useHead({ title: 'Mes commandes — Althea Systems' })

const checkoutApi = useCheckoutApi()
const config = useRuntimeConfig()
const orders = ref<Awaited<ReturnType<typeof checkoutApi.listOrders>>>(
  await checkoutApi.listOrders()
)

const formatPrice = (value: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString('fr-FR') : '—'

const ordersByYear = computed(() => {
  const grouped = new Map<number, typeof orders.value>()
  for (const order of orders.value) {
    const year = new Date(order.placedAt ?? order.createdAt).getFullYear()
    if (!grouped.has(year)) grouped.set(year, [])
    grouped.get(year)!.push(order)
  }
  return Array.from(grouped.entries()).sort((a, b) => b[0] - a[0])
})
</script>

<template>
  <section class="mx-auto w-full max-w-[1000px] px-4 py-12 md:px-10 md:py-16">
    <NuxtLink to="/account" class="text-sm text-neutral-500 hover:text-brand-500">
      ← Mon compte
    </NuxtLink>
    <h1 class="font-display text-h1 mt-2 font-medium text-brand-text">Mes commandes</h1>

    <p v-if="!orders.length" class="mt-8 text-sm text-neutral-500">
      Vous n’avez pas encore passé de commande.
    </p>

    <div v-else class="mt-10 space-y-12">
      <section v-for="[year, list] in ordersByYear" :key="year">
        <h2 class="font-display text-h3 font-medium text-brand-text">{{ year }}</h2>
        <ul class="mt-4 space-y-3">
          <li
            v-for="order in list"
            :key="order.id"
            class="rounded-xl border border-neutral-100 bg-white p-5"
          >
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p class="font-display text-base font-medium text-brand-text">
                  Commande #{{ order.id }}
                </p>
                <p class="text-caption mt-1 text-neutral-500">
                  {{ formatDate(order.placedAt ?? order.createdAt) }} ·
                  {{ order.items.length }} produit{{ order.items.length > 1 ? 's' : '' }}
                </p>
              </div>
              <div class="text-right">
                <p class="font-display text-brand-500 text-base">{{ formatPrice(order.total) }}</p>
                <p class="text-caption text-neutral-500 capitalize">{{ order.status }}</p>
              </div>
            </div>
            <div class="mt-4 flex flex-wrap gap-3 text-sm">
              <a
                v-if="order.invoice"
                :href="`${config.public.apiBase}/account/orders/${order.id}/invoice`"
                target="_blank"
                class="rounded-md border border-neutral-200 px-3 py-1 text-neutral-700 hover:border-brand-500 hover:text-brand-500"
              >
                Télécharger la facture
              </a>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>
