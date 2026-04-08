<script setup lang="ts">
import type { PaymentMethod } from '~/composables/useAccount'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'Moyens de paiement — Althea Systems' })

const account = useAccountApi()

const methods = ref<PaymentMethod[]>([])
const showForm = ref(false)
const errorMessage = ref<string | null>(null)
const setupClientSecret = ref<string | null>(null)
const setAsDefault = ref(false)

async function refresh() {
  methods.value = await account.listPaymentMethods()
}

await refresh()

async function openCreate() {
  errorMessage.value = null
  setAsDefault.value = false
  try {
    const intent = await account.createSetupIntent()
    setupClientSecret.value = intent.clientSecret
    showForm.value = true
  } catch (err) {
    errorMessage.value = extractFirstError(err) ?? 'Impossible de préparer Stripe.'
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
  } catch (err) {
    errorMessage.value = extractFirstError(err) ?? 'Une erreur est survenue.'
  }
}

function onCardError(message: string) {
  errorMessage.value = message
}

async function setDefault(id: number) {
  await account.setDefaultPaymentMethod(id)
  await refresh()
}

async function removeMethod(id: number) {
  if (!confirm('Supprimer cette carte ?')) return
  await account.deletePaymentMethod(id)
  await refresh()
}
</script>

<template>
  <section class="mx-auto w-full max-w-[900px] px-4 py-12 md:px-10 md:py-16">
    <NuxtLink to="/account" class="text-sm text-neutral-500 hover:text-brand-500">
      ← Mon compte
    </NuxtLink>
    <header class="mt-2 flex flex-wrap items-end justify-between gap-4">
      <h1 class="font-display text-h1 font-medium text-brand-text">Moyens de paiement</h1>
      <button
        type="button"
        class="bg-brand-500 hover:bg-brand-700 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors"
        @click="openCreate"
      >
        Ajouter une carte
      </button>
    </header>

    <p class="mt-2 text-sm text-neutral-500">
      Aucune donnée bancaire sensible n’est stockée sur nos serveurs — les cartes sont enregistrées
      via Stripe.
    </p>

    <ul v-if="methods.length" class="mt-8 grid gap-4 md:grid-cols-2">
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
            class="rounded-md border border-neutral-200 px-3 py-1 text-neutral-700 hover:border-danger hover:text-danger"
            @click="removeMethod(method.id)"
          >
            Supprimer
          </button>
        </div>
      </li>
    </ul>

    <p v-else class="mt-8 text-sm text-neutral-500">
      Vous n’avez pas encore enregistré de carte.
    </p>

    <Teleport to="body">
      <div
        v-if="showForm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4"
        @click.self="showForm = false"
      >
        <div class="max-h-full w-full max-w-md overflow-y-auto rounded-xl bg-white p-6">
          <h2 class="font-display text-h3 font-medium text-brand-text">Nouvelle carte</h2>
          <p class="mt-2 text-caption text-neutral-500">
            Saisissez les informations de votre carte. Le test Stripe accepte
            <code>4242 4242 4242 4242</code>, n’importe quelle date future et n’importe quel CVC.
          </p>

          <div class="mt-4">
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

          <button
            type="button"
            class="mt-4 w-full rounded-md border border-neutral-200 px-4 py-2 text-sm text-neutral-700"
            @click="showForm = false"
          >
            Annuler
          </button>
        </div>
      </div>
    </Teleport>
  </section>
</template>
