<script setup lang="ts">
import type { Address } from '~/composables/useAccount'
import type { CartQuote } from '~/composables/useCheckout'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'Commande — Althea Systems' })

const cart = useCart()
const account = useAccountApi()
const checkoutApi = useCheckoutApi()
const router = useRouter()

if (cart.isEmpty.value) {
  await navigateTo('/cart')
}

const step = ref<1 | 2 | 3>(1)
const addresses = ref<Address[]>(await account.listAddresses())

const billingAddressId = ref<number | null>(
  addresses.value.find((a) => a.type === 'billing' && a.isDefault)?.id ??
    addresses.value.find((a) => a.type === 'billing')?.id ??
    null
)
const shippingAddressId = ref<number | null>(
  addresses.value.find((a) => a.type === 'shipping' && a.isDefault)?.id ??
    addresses.value.find((a) => a.type === 'shipping')?.id ??
    null
)

const quote = ref<CartQuote | null>(null)
const clientSecret = ref<string | null>(null)
const paymentIntentId = ref<string | null>(null)
const errorMessage = ref<string | null>(null)
const submitting = ref(false)

const billingChoices = computed(() => addresses.value.filter((a) => a.type === 'billing'))
const shippingChoices = computed(() => addresses.value.filter((a) => a.type === 'shipping'))
const canGoToPayment = computed(
  () => billingAddressId.value !== null && shippingAddressId.value !== null
)

async function goToPayment() {
  if (!canGoToPayment.value) return
  errorMessage.value = null
  submitting.value = true
  try {
    const intent = await checkoutApi.createPaymentIntent(cart.toApiPayload())
    quote.value = intent.quote
    clientSecret.value = intent.clientSecret
    paymentIntentId.value = intent.paymentIntentId
    step.value = 3
  } catch (err) {
    errorMessage.value = extractFirstError(err) ?? 'Impossible de préparer le paiement.'
  } finally {
    submitting.value = false
  }
}

async function onPaid(intentId: string) {
  errorMessage.value = null
  submitting.value = true
  try {
    const result = await checkoutApi.placeOrder({
      items: cart.toApiPayload(),
      shippingAddressId: shippingAddressId.value!,
      billingAddressId: billingAddressId.value!,
      paymentIntentId: intentId,
    })
    cart.clear()
    await router.replace(`/checkout/confirmation?orderId=${result.order.id}`)
  } catch (err) {
    errorMessage.value = extractFirstError(err) ?? 'Impossible de finaliser la commande.'
  } finally {
    submitting.value = false
  }
}

function onPaymentError(message: string) {
  errorMessage.value = message
}

const formatPrice = (value: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
</script>

<template>
  <section class="mx-auto w-full max-w-[900px] px-4 py-12 md:px-10 md:py-16">
    <h1 class="font-display text-h1 font-medium text-brand-text">Finaliser ma commande</h1>

    <AppCheckoutSteps :current="step" />

    <section v-if="step === 1" class="mt-10 space-y-4 rounded-xl border border-neutral-100 bg-white p-6">
      <h2 class="font-display text-h3 font-medium text-brand-text">Identification</h2>
      <p class="text-sm text-neutral-600">
        Vous êtes connecté. Cliquez pour passer à l’étape suivante.
      </p>
      <button
        type="button"
        class="bg-brand-500 hover:bg-brand-700 inline-flex rounded-md px-4 py-2 text-sm font-medium text-white transition-colors"
        @click="step = 2"
      >
        Continuer
      </button>
    </section>

    <section
      v-else-if="step === 2"
      class="mt-10 space-y-6 rounded-xl border border-neutral-100 bg-white p-6"
    >
      <h2 class="font-display text-h3 font-medium text-brand-text">Adresses</h2>

      <div>
        <p class="text-caption text-neutral-500 uppercase">Livraison</p>
        <div v-if="shippingChoices.length" class="mt-2 space-y-2">
          <label
            v-for="address in shippingChoices"
            :key="address.id"
            class="flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-100 p-3 hover:border-brand-500"
          >
            <input
              v-model="shippingAddressId"
              type="radio"
              name="shipping-address"
              :value="address.id"
              class="accent-brand-500 mt-1"
            />
            <span class="text-sm">
              <span class="font-medium text-brand-text">{{ address.fullName }}</span><br />
              {{ address.street }}<br />
              {{ address.postalCode }} {{ address.city }} ({{ address.country }})
            </span>
          </label>
        </div>
        <p v-else class="mt-2 text-sm text-neutral-500">
          Aucune adresse de livraison.
          <NuxtLink to="/account/addresses" class="text-brand-500 hover:text-brand-700">
            En ajouter une
          </NuxtLink>
        </p>
      </div>

      <div>
        <p class="text-caption text-neutral-500 uppercase">Facturation</p>
        <div v-if="billingChoices.length" class="mt-2 space-y-2">
          <label
            v-for="address in billingChoices"
            :key="address.id"
            class="flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-100 p-3 hover:border-brand-500"
          >
            <input
              v-model="billingAddressId"
              type="radio"
              name="billing-address"
              :value="address.id"
              class="accent-brand-500 mt-1"
            />
            <span class="text-sm">
              <span class="font-medium text-brand-text">{{ address.fullName }}</span><br />
              {{ address.street }}<br />
              {{ address.postalCode }} {{ address.city }} ({{ address.country }})
            </span>
          </label>
        </div>
        <p v-else class="mt-2 text-sm text-neutral-500">
          Aucune adresse de facturation.
          <NuxtLink to="/account/addresses" class="text-brand-500 hover:text-brand-700">
            En ajouter une
          </NuxtLink>
        </p>
      </div>

      <AppFormError :message="errorMessage" />

      <div class="flex justify-between">
        <button
          type="button"
          class="rounded-md border border-neutral-200 px-4 py-2 text-sm text-neutral-700"
          @click="step = 1"
        >
          Retour
        </button>
        <button
          type="button"
          class="bg-brand-500 hover:bg-brand-700 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-neutral-300"
          :disabled="!canGoToPayment || submitting"
          @click="goToPayment"
        >
          {{ submitting ? 'Préparation…' : 'Continuer vers le paiement' }}
        </button>
      </div>
    </section>

    <section
      v-else
      class="mt-10 grid gap-6 rounded-xl border border-neutral-100 bg-white p-6 md:grid-cols-[1fr_320px]"
    >
      <div>
        <h2 class="font-display text-h3 font-medium text-brand-text">Paiement</h2>
        <p class="mt-2 text-sm text-neutral-600">
          Saisissez vos informations de carte. Stripe Elements gère la collecte de manière
          sécurisée.
        </p>
        <div class="mt-6">
          <AppStripePaymentForm
            v-if="clientSecret"
            :client-secret="clientSecret"
            @paid="onPaid"
            @error="onPaymentError"
          />
        </div>
        <AppFormError :message="errorMessage" />
        <button
          type="button"
          class="mt-4 text-sm text-neutral-500 hover:text-brand-500"
          @click="step = 2"
        >
          ← Modifier les adresses
        </button>
      </div>

      <aside class="rounded-lg bg-neutral-50 p-4">
        <h3 class="font-display text-base font-medium text-brand-text">Récapitulatif</h3>
        <dl v-if="quote" class="mt-4 space-y-2 text-sm text-neutral-700">
          <div class="flex justify-between">
            <dt>Sous-total</dt>
            <dd>{{ formatPrice(quote.subtotal) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt>Livraison</dt>
            <dd>{{ formatPrice(quote.shipping) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt>TVA</dt>
            <dd>{{ formatPrice(quote.tax) }}</dd>
          </div>
          <div class="text-brand-text mt-3 flex justify-between border-t border-neutral-200 pt-3 text-base font-medium">
            <dt>Total</dt>
            <dd>{{ formatPrice(quote.total) }}</dd>
          </div>
        </dl>
      </aside>
    </section>
  </section>
</template>
