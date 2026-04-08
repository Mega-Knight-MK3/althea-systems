<script setup lang="ts">
import type { PaymentMethod, PaymentMethodInput } from '~/composables/useAccount'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'Moyens de paiement — Althea Systems' })

const account = useAccountApi()

const methods = ref<PaymentMethod[]>([])
const showForm = ref(false)
const errorMessage = ref<string | null>(null)
const loading = ref(false)

const emptyForm: PaymentMethodInput = {
  stripePaymentMethodId: '',
  type: 'card',
  brand: 'Visa',
  lastFour: '',
  expMonth: undefined,
  expYear: undefined,
  isDefault: false,
}
const form = ref<PaymentMethodInput>({ ...emptyForm })

async function refresh() {
  methods.value = await account.listPaymentMethods()
}

await refresh()

function openCreate() {
  form.value = { ...emptyForm }
  showForm.value = true
}

async function saveMethod() {
  errorMessage.value = null
  loading.value = true
  try {
    await account.createPaymentMethod(form.value)
    await refresh()
    showForm.value = false
  } catch (err) {
    errorMessage.value = extractFirstError(err) ?? 'Une erreur est survenue.'
  } finally {
    loading.value = false
  }
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
      Aucune donnée bancaire sensible n’est stockée — les cartes sont enregistrées via Stripe.
    </p>

    <ul v-if="methods.length" class="mt-8 grid gap-4 md:grid-cols-2">
      <li
        v-for="method in methods"
        :key="method.id"
        class="rounded-xl border border-neutral-100 bg-white p-5"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="font-display text-base font-medium text-brand-text">
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
        <form
          class="max-h-full w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6"
          @submit.prevent="saveMethod"
        >
          <h2 class="font-display text-h3 font-medium text-brand-text">Nouvelle carte</h2>
          <p class="mt-2 text-caption text-neutral-500">
            Saisissez l’identifiant Stripe Payment Method renvoyé par Stripe Elements (intégration
            front-end Stripe à brancher avec une clé publique).
          </p>

          <div class="mt-6 space-y-4">
            <label class="block">
              <span class="text-caption text-neutral-500 uppercase">Stripe payment method id</span>
              <input
                v-model="form.stripePaymentMethodId"
                type="text"
                required
                placeholder="pm_..."
                class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </label>

            <div class="grid grid-cols-2 gap-4">
              <label class="block">
                <span class="text-caption text-neutral-500 uppercase">Marque</span>
                <input
                  v-model="form.brand"
                  type="text"
                  class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </label>
              <label class="block">
                <span class="text-caption text-neutral-500 uppercase">4 derniers chiffres</span>
                <input
                  v-model="form.lastFour"
                  type="text"
                  maxlength="4"
                  pattern="[0-9]{4}"
                  required
                  class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </label>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <label class="block">
                <span class="text-caption text-neutral-500 uppercase">Mois (1-12)</span>
                <input
                  v-model.number="form.expMonth"
                  type="number"
                  min="1"
                  max="12"
                  class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </label>
              <label class="block">
                <span class="text-caption text-neutral-500 uppercase">Année</span>
                <input
                  v-model.number="form.expYear"
                  type="number"
                  min="2024"
                  max="2100"
                  class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </label>
            </div>

            <label class="inline-flex items-center gap-2 text-sm text-neutral-700">
              <input
                v-model="form.isDefault"
                type="checkbox"
                class="accent-brand-500 h-4 w-4 rounded border-neutral-300"
              />
              Carte par défaut
            </label>
          </div>

          <AppFormError :message="errorMessage" />

          <div class="mt-6 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-md border border-neutral-200 px-4 py-2 text-sm text-neutral-700"
              @click="showForm = false"
            >
              Annuler
            </button>
            <button
              type="submit"
              class="bg-brand-500 hover:bg-brand-700 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:bg-neutral-300"
              :disabled="loading"
            >
              {{ loading ? 'Enregistrement…' : 'Enregistrer' }}
            </button>
          </div>
        </form>
      </div>
    </Teleport>
  </section>
</template>
