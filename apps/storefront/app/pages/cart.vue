<script setup lang="ts">
useHead({ title: 'Panier — Althea Systems' })

const cart = useCart()
const checkoutApi = useCheckoutApi()
const { isAuthenticated } = useAuth()

const quote = ref<Awaited<ReturnType<typeof checkoutApi.quote>> | null>(null)
const loading = ref(false)
const errorMessage = ref<string | null>(null)

async function refreshQuote() {
  if (cart.isEmpty.value) {
    quote.value = null
    return
  }
  loading.value = true
  errorMessage.value = null
  try {
    quote.value = await checkoutApi.quote(cart.toApiPayload())
  } catch (err) {
    errorMessage.value = extractFirstError(err) ?? 'Impossible de mettre à jour le panier.'
  } finally {
    loading.value = false
  }
}

await refreshQuote()
watch(() => cart.items.value, refreshQuote, { deep: true })

function lineFor(productId: number) {
  return quote.value?.lines.find((line) => line.productId === productId) ?? null
}

const formatPrice = (value: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)

const hasUnavailable = computed(() => (quote.value?.unavailable.length ?? 0) > 0)
const canCheckout = computed(
  () => !cart.isEmpty.value && !loading.value && !hasUnavailable.value
)
</script>

<template>
  <section class="mx-auto w-full max-w-[1200px] px-4 py-12 md:px-10 md:py-16">
    <h1 class="font-display text-h1 font-medium text-brand-text">Mon panier</h1>

    <div v-if="cart.isEmpty.value" class="mt-10 rounded-xl border border-neutral-100 p-8 text-center">
      <p class="text-sm text-neutral-600">Votre panier est vide.</p>
      <NuxtLink
        to="/"
        class="bg-brand-500 hover:bg-brand-700 mt-6 inline-flex rounded-md px-5 py-3 text-sm font-medium text-white transition-colors"
      >
        Découvrir les produits
      </NuxtLink>
    </div>

    <div v-else class="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
      <div class="space-y-4">
        <div
          v-if="hasUnavailable"
          class="bg-warning/10 text-warning rounded-md border border-warning/20 px-4 py-3 text-sm"
        >
          Certains produits ne sont plus disponibles. Retirez-les avant de passer à la caisse.
        </div>
        <ul class="divide-y divide-neutral-100 rounded-xl border border-neutral-100 bg-white">
          <li v-for="item in cart.items.value" :key="item.productId" class="flex gap-4 p-4">
            <div class="bg-brand-50 flex h-20 w-20 shrink-0 items-center justify-center rounded-lg">
              <span class="font-display text-brand-500 text-xs uppercase">
                {{ item.name.charAt(0) }}
              </span>
            </div>
            <div class="flex flex-1 flex-col justify-between">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <NuxtLink
                    :to="`/products/${item.slug}`"
                    class="font-display text-base font-medium text-brand-text hover:text-brand-500"
                  >
                    {{ item.name }}
                  </NuxtLink>
                  <p
                    v-if="lineFor(item.productId) && !lineFor(item.productId)?.available"
                    class="text-danger mt-1 text-caption"
                  >
                    Indisponible
                  </p>
                </div>
                <button
                  type="button"
                  class="text-caption text-neutral-500 hover:text-danger"
                  @click="cart.remove(item.productId)"
                >
                  Retirer
                </button>
              </div>
              <div class="mt-3 flex items-center justify-between">
                <div class="inline-flex items-center rounded-md border border-neutral-200">
                  <button
                    type="button"
                    class="px-3 py-1 text-neutral-600 hover:text-brand-500"
                    aria-label="Diminuer"
                    @click="cart.setQuantity(item.productId, item.quantity - 1)"
                  >
                    −
                  </button>
                  <span class="min-w-8 text-center text-sm">{{ item.quantity }}</span>
                  <button
                    type="button"
                    class="px-3 py-1 text-neutral-600 hover:text-brand-500"
                    aria-label="Augmenter"
                    @click="cart.setQuantity(item.productId, item.quantity + 1)"
                  >
                    +
                  </button>
                </div>
                <p class="font-display text-brand-500 text-base">
                  {{ formatPrice(item.unitPrice * item.quantity) }}
                </p>
              </div>
            </div>
          </li>
        </ul>
        <AppFormError :message="errorMessage" />
      </div>

      <aside class="rounded-xl border border-neutral-100 bg-white p-6">
        <h2 class="font-display text-h3 font-medium text-brand-text">Récapitulatif</h2>
        <dl class="mt-6 space-y-3 text-sm text-neutral-700">
          <div class="flex justify-between">
            <dt>Sous-total</dt>
            <dd>{{ formatPrice(quote?.subtotal ?? cart.subtotal.value) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt>Livraison</dt>
            <dd>{{ formatPrice(quote?.shipping ?? 0) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt>TVA</dt>
            <dd>{{ formatPrice(quote?.tax ?? 0) }}</dd>
          </div>
          <div class="text-brand-text mt-4 flex justify-between border-t border-neutral-100 pt-4 text-base font-medium">
            <dt>Total</dt>
            <dd>{{ formatPrice(quote?.total ?? cart.subtotal.value) }}</dd>
          </div>
        </dl>

        <NuxtLink
          v-if="canCheckout"
          to="/checkout"
          class="bg-brand-500 hover:bg-brand-700 mt-6 inline-flex w-full items-center justify-center rounded-md px-4 py-3 text-sm font-medium text-white transition-colors"
        >
          Passer à la caisse
        </NuxtLink>
        <button
          v-else
          type="button"
          disabled
          class="mt-6 inline-flex w-full cursor-not-allowed items-center justify-center rounded-md bg-neutral-300 px-4 py-3 text-sm font-medium text-white"
        >
          Passer à la caisse
        </button>

        <p v-if="!isAuthenticated" class="mt-3 text-caption text-neutral-500">
          Vous devrez vous connecter pour finaliser la commande.
        </p>
      </aside>
    </div>
  </section>
</template>
