<script setup lang="ts">
useHead({ title: 'Panier — Althea Systems' })

const cart = useCart()
const checkoutApi = useCheckoutApi()
const { isAuthenticated } = useAuth()
const toast = useToast()

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

function removeUnavailable() {
  for (const line of quote.value?.unavailable ?? []) {
    cart.remove(line.productId)
  }
  toast.info('Produits indisponibles retirés du panier.')
}

function onRemove(productId: number, name: string) {
  cart.remove(productId)
  toast.info(`${name} retiré du panier.`)
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
    <div class="flex flex-wrap items-end justify-between gap-3">
      <h1 class="font-display text-h1 font-medium text-brand-text">Mon panier</h1>
      <NuxtLink to="/" class="text-sm text-neutral-500 hover:text-brand-500">
        ← Continuer mes achats
      </NuxtLink>
    </div>

    <div
      v-if="cart.isEmpty.value"
      class="bg-brand-50 mt-10 flex flex-col items-center justify-center rounded-xl border border-dashed border-brand-300 py-16 text-center"
    >
      <svg viewBox="0 0 24 24" class="text-brand-500 mb-4 h-10 w-10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 4h2.4l2.6 11h11l2-8H7" />
        <circle cx="10" cy="20" r="1.4" fill="currentColor" />
        <circle cx="18" cy="20" r="1.4" fill="currentColor" />
      </svg>
      <h2 class="font-display text-h3 font-medium text-brand-text">Votre panier est vide</h2>
      <p class="mt-2 max-w-sm text-sm text-neutral-600">
        Parcourez le catalogue et ajoutez vos produits pour les retrouver ici.
      </p>
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
          class="bg-warning/10 text-warning flex items-start justify-between gap-4 rounded-md border border-warning/20 px-4 py-3 text-sm"
        >
          <span>
            Certains produits ne sont plus disponibles. Retirez-les pour finaliser votre commande.
          </span>
          <button
            type="button"
            class="rounded-md border border-warning/40 px-3 py-1 text-xs font-medium hover:bg-warning/20"
            @click="removeUnavailable"
          >
            Retirer tout
          </button>
        </div>

        <ul class="divide-y divide-neutral-100 rounded-xl border border-neutral-100 bg-white">
          <li v-for="item in cart.items.value" :key="item.productId" class="flex gap-4 p-5">
            <div class="bg-brand-50 flex h-24 w-24 shrink-0 items-center justify-center rounded-lg">
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
                  <p v-else class="text-caption mt-1 text-neutral-500">
                    {{ formatPrice(item.unitPrice) }} l’unité
                  </p>
                </div>
                <button
                  type="button"
                  class="text-caption text-neutral-500 transition-colors hover:text-danger"
                  @click="onRemove(item.productId, item.name)"
                >
                  Retirer
                </button>
              </div>
              <div class="mt-4 flex items-center justify-between">
                <div class="inline-flex items-center rounded-md border border-neutral-200">
                  <button
                    type="button"
                    class="px-4 py-2 text-base text-neutral-600 transition-colors hover:text-brand-500"
                    aria-label="Diminuer la quantité"
                    @click="cart.setQuantity(item.productId, item.quantity - 1)"
                  >
                    −
                  </button>
                  <span class="min-w-10 text-center text-base font-medium">{{ item.quantity }}</span>
                  <button
                    type="button"
                    class="px-4 py-2 text-base text-neutral-600 transition-colors hover:text-brand-500"
                    aria-label="Augmenter la quantité"
                    @click="cart.setQuantity(item.productId, item.quantity + 1)"
                  >
                    +
                  </button>
                </div>
                <p class="font-display text-brand-500 text-lg">
                  {{ formatPrice(item.unitPrice * item.quantity) }}
                </p>
              </div>
            </div>
          </li>
        </ul>
        <AppFormError :message="errorMessage" />
      </div>

      <aside
        class="rounded-xl border border-neutral-100 bg-white p-6 lg:sticky lg:top-24 lg:self-start"
      >
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

        <p v-if="!isAuthenticated" class="text-caption mt-3 text-neutral-500">
          Vous devrez vous connecter pour finaliser la commande.
        </p>
      </aside>
    </div>
  </section>
</template>
