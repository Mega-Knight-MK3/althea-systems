<script setup lang="ts">
import type { Address, AddressInput } from '~/composables/useAccount'
import { countryName } from '~~/app/data/countries'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'Adresses — Althea Systems' })

const account = useAccountApi()
const toast = useToast()

const addresses = ref<Address[]>([])
const editing = ref<Address | null>(null)
const showForm = ref(false)
const errorMessage = ref<string | null>(null)
const loading = ref(false)
const initialLoading = ref(true)

const emptyForm: AddressInput = {
  type: 'shipping',
  fullName: '',
  street: '',
  line2: '',
  city: '',
  region: '',
  postalCode: '',
  country: 'FR',
  phone: '',
  isDefault: false,
}
const form = ref<AddressInput>({ ...emptyForm })

async function refresh() {
  addresses.value = await account.listAddresses()
}

try {
  await refresh()
} finally {
  initialLoading.value = false
}

function openCreate() {
  editing.value = null
  form.value = { ...emptyForm }
  errorMessage.value = null
  showForm.value = true
}

function openEdit(address: Address) {
  editing.value = address
  form.value = {
    type: address.type,
    fullName: address.fullName,
    street: address.street,
    line2: address.line2 ?? '',
    city: address.city,
    region: address.region ?? '',
    postalCode: address.postalCode,
    country: address.country,
    phone: address.phone ?? '',
    isDefault: address.isDefault,
  }
  errorMessage.value = null
  showForm.value = true
}

async function saveAddress() {
  errorMessage.value = null
  loading.value = true
  try {
    if (editing.value) {
      await account.updateAddress(editing.value.id, form.value)
      toast.success('Adresse mise à jour.')
    } else {
      await account.createAddress(form.value)
      toast.success('Adresse ajoutée.')
    }
    await refresh()
    showForm.value = false
  } catch (err) {
    errorMessage.value = extractFirstError(err) ?? 'Une erreur est survenue.'
  } finally {
    loading.value = false
  }
}

async function removeAddress(id: number) {
  if (!confirm('Supprimer cette adresse ?')) return
  try {
    await account.deleteAddress(id)
    toast.success('Adresse supprimée.')
    await refresh()
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
        <h1 class="font-display text-h1 font-medium text-brand-text">Carnet d’adresses</h1>
        <p class="mt-2 text-sm text-neutral-600">
          Gérez vos adresses de livraison et de facturation.
        </p>
      </div>
      <button
        v-if="addresses.length"
        type="button"
        class="bg-brand-500 hover:bg-brand-700 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors"
        @click="openCreate"
      >
        Ajouter une adresse
      </button>
    </header>

    <div v-if="initialLoading" class="mt-8 grid gap-4 md:grid-cols-2">
      <AppSkeleton class="h-40" />
      <AppSkeleton class="h-40" />
    </div>

    <ul v-else-if="addresses.length" class="mt-8 grid gap-4 md:grid-cols-2">
      <li
        v-for="address in addresses"
        :key="address.id"
        class="flex flex-col rounded-xl border border-neutral-100 bg-white p-5"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="font-display text-base font-medium text-brand-text">{{ address.fullName }}</p>
            <p class="text-caption mt-1 text-neutral-500 uppercase">
              {{ address.type === 'billing' ? 'Facturation' : 'Livraison' }}
            </p>
          </div>
          <span
            v-if="address.isDefault"
            class="bg-brand-500/10 text-brand-500 rounded-full px-2 py-0.5 text-caption"
          >
            Par défaut
          </span>
        </div>
        <p class="mt-3 flex-1 text-sm text-neutral-700">
          {{ address.street }}<br />
          <span v-if="address.line2">{{ address.line2 }}<br /></span>
          {{ address.postalCode }} {{ address.city }}<br />
          <span v-if="address.region">{{ address.region }}, </span>{{ countryName(address.country) }}<br />
          <span v-if="address.phone" class="text-neutral-500">{{ address.phone }}</span>
        </p>
        <div class="mt-4 flex gap-2 text-sm">
          <button
            type="button"
            class="rounded-md border border-neutral-200 px-3 py-1 text-neutral-700 transition-colors hover:border-brand-500 hover:text-brand-500"
            @click="openEdit(address)"
          >
            Modifier
          </button>
          <button
            type="button"
            class="hover:border-danger hover:text-danger rounded-md border border-neutral-200 px-3 py-1 text-neutral-700 transition-colors"
            @click="removeAddress(address.id)"
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
      <svg
        viewBox="0 0 24 24"
        class="text-brand-500 mb-4 h-10 w-10"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
      <h2 class="font-display text-h3 font-medium text-brand-text">Aucune adresse enregistrée</h2>
      <p class="mt-2 max-w-sm text-sm text-neutral-600">
        Ajoutez une adresse de livraison et de facturation pour finaliser vos commandes plus
        rapidement.
      </p>
      <button
        type="button"
        class="bg-brand-500 hover:bg-brand-700 mt-6 rounded-md px-5 py-3 text-sm font-medium text-white transition-colors"
        @click="openCreate"
      >
        Ajouter ma première adresse
      </button>
    </div>

    <AppModal
      :open="showForm"
      :title="editing ? 'Modifier l’adresse' : 'Nouvelle adresse'"
      @close="showForm = false"
    >
      <AppAddressForm
        v-model="form"
        :loading="loading"
        :error-message="errorMessage"
        :submit-label="editing ? 'Enregistrer les changements' : 'Ajouter cette adresse'"
        @submit="saveAddress"
        @cancel="showForm = false"
      />
    </AppModal>
  </section>
</template>
