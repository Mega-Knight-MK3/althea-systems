<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useHead({ title: 'Commande confirmée — Althea Systems' })

const route = useRoute()
const checkoutApi = useCheckoutApi()
const config = useRuntimeConfig()

const orderId = computed(() => Number(route.query.orderId))
const order = ref<Awaited<ReturnType<typeof checkoutApi.getOrder>> | null>(null)
const errorMessage = ref<string | null>(null)

if (Number.isFinite(orderId.value)) {
  try {
    order.value = await checkoutApi.getOrder(orderId.value)
  } catch (err) {
    errorMessage.value = extractFirstError(err) ?? 'Commande introuvable.'
  }
}

const formatPrice = (value: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)

const invoiceUrl = computed(() => {
  if (!order.value?.invoice) return null
  return `${config.public.apiBase}/account/orders/${order.value.id}/invoice`
})
</script>

<template>
  <section class="mx-auto w-full max-w-[800px] px-4 py-12 md:px-10 md:py-16">
    <div v-if="order" class="space-y-8">
      <header class="text-center">
        <p class="text-caption text-success tracking-widest uppercase">Merci pour votre commande</p>
        <h1 class="font-display text-h1 mt-2 font-medium text-brand-text">
          Commande #{{ order.id }} confirmée
        </h1>
        <p class="mt-3 text-sm text-neutral-600">
          Vous recevrez un email de confirmation avec votre facture.
        </p>
      </header>

      <ul class="divide-y divide-neutral-100 rounded-xl border border-neutral-100 bg-white">
        <li v-for="item in order.items" :key="item.id" class="flex justify-between p-4 text-sm">
          <span>
            <span class="font-medium text-brand-text">{{ item.productName }}</span>
            <span class="ml-2 text-neutral-500">× {{ item.quantity }}</span>
          </span>
          <span>{{ formatPrice(item.total) }}</span>
        </li>
      </ul>

      <dl class="space-y-2 text-sm text-neutral-700">
        <div class="flex justify-between">
          <dt>Sous-total</dt>
          <dd>{{ formatPrice(order.subtotal) }}</dd>
        </div>
        <div class="flex justify-between">
          <dt>Livraison</dt>
          <dd>{{ formatPrice(order.shippingCost) }}</dd>
        </div>
        <div class="flex justify-between">
          <dt>TVA</dt>
          <dd>{{ formatPrice(order.tax) }}</dd>
        </div>
        <div class="text-brand-text flex justify-between border-t border-neutral-100 pt-3 text-base font-medium">
          <dt>Total payé</dt>
          <dd>{{ formatPrice(order.total) }}</dd>
        </div>
      </dl>

      <div class="flex flex-wrap gap-3">
        <a
          v-if="invoiceUrl"
          :href="invoiceUrl"
          class="bg-brand-500 hover:bg-brand-700 inline-flex rounded-md px-5 py-3 text-sm font-medium text-white transition-colors"
          target="_blank"
        >
          Télécharger la facture
        </a>
        <NuxtLink
          to="/account/orders"
          class="rounded-md border border-neutral-200 px-5 py-3 text-sm text-neutral-700 hover:border-brand-500 hover:text-brand-500"
        >
          Voir mes commandes
        </NuxtLink>
      </div>
    </div>

    <div v-else class="rounded-xl border border-danger/20 bg-danger/5 p-6">
      <p class="text-danger text-sm">{{ errorMessage ?? 'Commande introuvable.' }}</p>
      <NuxtLink to="/" class="mt-4 inline-flex text-sm text-brand-500 hover:text-brand-700">
        ← Retour à l’accueil
      </NuxtLink>
    </div>
  </section>
</template>
