<script setup lang="ts">
import type { Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js'

const props = defineProps<{ clientSecret: string }>()
const emit = defineEmits<{
  (e: 'paid', paymentIntentId: string): void
  (e: 'error', message: string): void
}>()

const mountEl = ref<HTMLElement | null>(null)
const errorMessage = ref<string | null>(null)
const loading = ref(false)
const ready = ref(false)
const { getStripe, publishableKey } = useStripe()

let stripe: Stripe | null = null
let elements: StripeElements | null = null
let paymentElement: StripePaymentElement | null = null

onMounted(async () => {
  if (!publishableKey) {
    errorMessage.value = 'Clé Stripe manquante.'
    return
  }
  stripe = await getStripe()
  if (!stripe || !mountEl.value) return
  elements = stripe.elements({ clientSecret: props.clientSecret })
  paymentElement = elements.create('payment')
  paymentElement.mount(mountEl.value)
  paymentElement.on('ready', () => {
    ready.value = true
  })
})

onBeforeUnmount(() => {
  paymentElement?.destroy()
  paymentElement = null
  elements = null
})

async function onSubmit() {
  if (!stripe || !elements) return
  errorMessage.value = null
  loading.value = true
  try {
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    })
    if (result.error) {
      errorMessage.value = result.error.message ?? 'Le paiement a échoué.'
      emit('error', errorMessage.value)
      return
    }
    const intent = result.paymentIntent
    if (intent && intent.status === 'succeeded') {
      emit('paid', intent.id)
      return
    }
    errorMessage.value = `Statut inattendu : ${intent?.status ?? 'inconnu'}`
    emit('error', errorMessage.value)
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
    <div ref="mountEl" />
    <p v-if="errorMessage" class="text-danger text-sm">{{ errorMessage }}</p>
    <button
      type="submit"
      class="bg-brand-500 hover:bg-brand-700 inline-flex w-full items-center justify-center rounded-md px-4 py-3 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-neutral-300"
      :disabled="loading || !ready"
    >
      {{ loading ? 'Paiement en cours…' : 'Confirmer le paiement' }}
    </button>
  </form>
</template>
