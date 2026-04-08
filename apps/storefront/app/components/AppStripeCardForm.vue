<script setup lang="ts">
import type { Stripe, StripeCardElement } from '@stripe/stripe-js'

const props = defineProps<{ clientSecret: string; submitLabel?: string }>()
const emit = defineEmits<{
  (e: 'success', paymentMethodId: string): void
  (e: 'error', message: string): void
}>()

const cardEl = ref<HTMLElement | null>(null)
const errorMessage = ref<string | null>(null)
const loading = ref(false)
const ready = ref(false)
const { getStripe, publishableKey } = useStripe()

let stripe: Stripe | null = null
let card: StripeCardElement | null = null

onMounted(async () => {
  if (!publishableKey) {
    errorMessage.value = 'Clé Stripe manquante.'
    return
  }
  stripe = await getStripe()
  if (!stripe || !cardEl.value) return
  const elements = stripe.elements()
  card = elements.create('card', { hidePostalCode: true })
  card.mount(cardEl.value)
  card.on('ready', () => {
    ready.value = true
  })
  card.on('change', (event) => {
    errorMessage.value = event.error?.message ?? null
  })
})

onBeforeUnmount(() => {
  card?.destroy()
  card = null
})

async function onSubmit() {
  if (!stripe || !card) return
  errorMessage.value = null
  loading.value = true
  try {
    const result = await stripe.confirmCardSetup(props.clientSecret, {
      payment_method: { card },
    })
    if (result.error) {
      errorMessage.value = result.error.message ?? 'Échec de la confirmation.'
      emit('error', errorMessage.value)
      return
    }
    const paymentMethod = result.setupIntent.payment_method
    if (typeof paymentMethod !== 'string') {
      errorMessage.value = 'Stripe n’a pas renvoyé d’identifiant de carte.'
      emit('error', errorMessage.value)
      return
    }
    emit('success', paymentMethod)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue.'
    errorMessage.value = message
    emit('error', message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="onSubmit">
    <div class="rounded-md border border-neutral-200 bg-white px-3 py-3">
      <div ref="cardEl" />
    </div>
    <p v-if="errorMessage" class="text-danger text-sm">{{ errorMessage }}</p>
    <button
      type="submit"
      class="bg-brand-500 hover:bg-brand-700 inline-flex w-full items-center justify-center rounded-md px-4 py-3 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-neutral-300"
      :disabled="loading || !ready"
    >
      {{ loading ? 'Confirmation…' : (submitLabel ?? 'Enregistrer la carte') }}
    </button>
  </form>
</template>
