<script setup lang="ts">
import type { PaymentMethod } from '~/composables/useAccount'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'Moyens de paiement — Althea Systems' })

const account = useAccountApi()
const toast = useToast()

const methods = ref<PaymentMethod[]>([])
const showForm = ref(false)
const errorMessage = ref<string | null>(null)
const setupClientSecret = ref<string | null>(null)
const setAsDefault = ref(false)
const initialLoading = ref(true)

async function refresh() {
  methods.value = await account.listPaymentMethods()
}

try {
  await refresh()
} finally {
  initialLoading.value = false
}

async function openCreate() {
  errorMessage.value = null
  setAsDefault.value = false
  try {
    const intent = await account.createSetupIntent()
    setupClientSecret.value = intent.clientSecret
    showForm.value = true
  } catch (err) {
    toast.error(extractFirstError(err) ?? 'Impossible de préparer Stripe.')
  }
}

async function onCardSuccess(paymentMethodId: string) {
  errorMessage.value = null
  try {
    await account.createPaymentMethod({
      stripePaymentMethodId: paymentMethodId,
      isDefault: setAsDefault.value,
    })
    await refresh()
    showForm.value = false
    setupClientSecret.value = null
    toast.success('Carte enregistrée.')
  } catch (err) {
    errorMessage.value = extractFirstError(err) ?? 'Une erreur est survenue.'
  }
}

function onCardError(message: string) {
  errorMessage.value = message
}

async function setDefault(id: number) {
  try {
    await account.setDefaultPaymentMethod(id)
    await refresh()
    toast.success('Carte par défaut mise à jour.')
  } catch (err) {
    toast.error(extractFirstError(err) ?? 'Mise à jour impossible.')
  }
}

async function removeMethod(id: number) {
  if (!confirm('Supprimer cette carte ?')) return
  try {
    await account.deletePaymentMethod(id)
    await refresh()
    toast.success('Carte supprimée.')
  } catch (err) {
    toast.error(extractFirstError(err) ?? 'Suppression impossible.')
  }
}
</script>

<template>
  <section class="mx-auto w-full max-w-[900px] px-4 py-12 md:px-10 md:py-16">
    <NuxtLink to="/account" class="text-sm text-neutral-500 hover:text-brand-500">
      ← Mon compte
    </NuxtLink>
    <header class="mt-2 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="font-display text-h1 font-medium text-brand-text">Moyens de paiement</h1>
        <p class="mt-2 text-sm text-neutral-600">
          Aucune donnée bancaire sensible n’est stockée — les cartes sont enregistrées via Stripe.
        </p>
      </div>
      <button
        v-if="methods.length"
        type="button"
        class="bg-brand-500 hover:bg-brand-700 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors"
        @click="openCreate"
      >
        Ajouter une carte
      </button>
    </header>

    <div v-if="initialLoading" class="mt-8 grid gap-4 md:grid-cols-2">
      <AppSkeleton class="h-32" />
      <AppSkeleton class="h-32" />
    </div>

    <ul v-else-if="methods.length" class="mt-8 grid gap-4 md:grid-cols-2">
      <li
        v-for="method in methods"
        :key="method.id"
        class="rounded-xl border border-neutral-100 bg-white p-5"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="font-display text-base font-medium text-brand-text capitalize">
              {{ method.brand ?? 'Carte' }} •••• {{ method.lastFour }}
            </p>
            <p v-if="method.expMonth && method.expYear" class="text-caption mt-1 text-neutral-500">
              Expire {{ String(method.expMonth).padStart(2, '0') }}/{{ method.expYear }}
            </p>
          </div>
          <span
            v-if="method.isDefault"
            class="bg-brand-500/10 text-brand-500 rounded-full px-2 py-0.5 text-caption"
          >
            Par défaut
          </span>
        </div>
        <div class="mt-4 flex gap-2 text-sm">
          <button
            v-if="!method.isDefault"
            type="button"
            class="rounded-md border border-neutral-200 px-3 py-1 text-neutral-700 hover:border-brand-500 hover:text-brand-500"
            @click="setDefault(method.id)"
          >
            Définir par défaut
          </button>
          <button
            type="button"
            class="hover:border-danger hover:text-danger rounded-md border border-neutral-200 px-3 py-1 text-neutral-700"
            @click="removeMethod(method.id)"
          >
            Supprimer
          </button>
        </div>
      </li>
    </ul>

    <div
      v-else
      class="bg-brand-50 mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-brand-300 py-16 text-center"
    >
      <svg viewBox="0 0 24 24" class="text-brand-500 mb-4 h-10 w-10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 11h18" />
      </svg>
      <h2 class="font-display text-h3 font-medium text-brand-text">Aucune carte enregistrée</h2>
      <p class="mt-2 max-w-sm text-sm text-neutral-600">
        Ajoutez une carte pour finaliser vos commandes en un clic.
      </p>
      <button
        type="button"
        class="bg-brand-500 hover:bg-brand-700 mt-6 rounded-md px-5 py-3 text-sm font-medium text-white transition-colors"
        @click="openCreate"
      >
        Ajouter ma première carte
      </button>
    </div>

    <AppModal :open="showForm" title="Nouvelle carte" @close="showForm = false">
      <p class="text-sm text-neutral-600">
        Saisissez les informations de votre carte. En mode test Stripe, utilisez
        <code class="rounded bg-neutral-100 px-1 py-0.5 text-xs">4242 4242 4242 4242</code>,
        n’importe quelle date future et n’importe quel CVC.
      </p>

      <div class="mt-6">
        <AppStripeCardForm
          v-if="setupClientSecret"
          :client-secret="setupClientSecret"
          @success="onCardSuccess"
          @error="onCardError"
        />
      </div>

      <label class="mt-4 inline-flex items-center gap-2 text-sm text-neutral-700">
        <input
          v-model="setAsDefault"
          type="checkbox"
          class="accent-brand-500 h-4 w-4 rounded border-neutral-300"
        />
        Définir par défaut
      </label>

      <AppFormError :message="errorMessage" />
    </AppModal>
  </section>
</template>
