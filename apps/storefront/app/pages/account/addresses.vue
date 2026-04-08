<script setup lang="ts">
import type { Address, AddressInput } from '~/composables/useAccount'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'Adresses — Althea Systems' })

const account = useAccountApi()

const addresses = ref<Address[]>([])
const editing = ref<Address | null>(null)
const showForm = ref(false)
const errorMessage = ref<string | null>(null)
const loading = ref(false)

const emptyForm: AddressInput = {
  type: 'billing',
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

await refresh()

function openCreate() {
  editing.value = null
  form.value = { ...emptyForm }
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
  showForm.value = true
}

async function saveAddress() {
  errorMessage.value = null
  loading.value = true
  try {
    if (editing.value) {
      await account.updateAddress(editing.value.id, form.value)
    } else {
      await account.createAddress(form.value)
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
  await account.deleteAddress(id)
  await refresh()
}
</script>

<template>
  <section class="mx-auto w-full max-w-[900px] px-4 py-12 md:px-10 md:py-16">
    <NuxtLink to="/account" class="text-sm text-neutral-500 hover:text-brand-500">
      ← Mon compte
    </NuxtLink>
    <header class="mt-2 flex flex-wrap items-end justify-between gap-4">
      <h1 class="font-display text-h1 font-medium text-brand-text">Carnet d’adresses</h1>
      <button
        type="button"
        class="bg-brand-500 hover:bg-brand-700 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors"
        @click="openCreate"
      >
        Ajouter une adresse
      </button>
    </header>

    <ul v-if="addresses.length" class="mt-8 grid gap-4 md:grid-cols-2">
      <li
        v-for="address in addresses"
        :key="address.id"
        class="rounded-xl border border-neutral-100 bg-white p-5"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="font-display text-base font-medium text-brand-text">{{ address.fullName }}</p>
            <p class="text-caption mt-1 text-neutral-500 uppercase">{{ address.type }}</p>
          </div>
          <span
            v-if="address.isDefault"
            class="bg-brand-500/10 text-brand-500 rounded-full px-2 py-0.5 text-caption"
          >
            Par défaut
          </span>
        </div>
        <p class="mt-3 text-sm text-neutral-700">
          {{ address.street }}<br />
          <span v-if="address.line2">{{ address.line2 }}<br /></span>
          {{ address.postalCode }} {{ address.city }}<br />
          <span v-if="address.region">{{ address.region }}, </span>{{ address.country }}<br />
          <span v-if="address.phone">{{ address.phone }}</span>
        </p>
        <div class="mt-4 flex gap-2 text-sm">
          <button
            type="button"
            class="rounded-md border border-neutral-200 px-3 py-1 text-neutral-700 hover:border-brand-500 hover:text-brand-500"
            @click="openEdit(address)"
          >
            Modifier
          </button>
          <button
            type="button"
            class="rounded-md border border-neutral-200 px-3 py-1 text-neutral-700 hover:border-danger hover:text-danger"
            @click="removeAddress(address.id)"
          >
            Supprimer
          </button>
        </div>
      </li>
    </ul>

    <p v-else class="mt-8 text-sm text-neutral-500">
      Vous n’avez pas encore d’adresse enregistrée.
    </p>

    <Teleport to="body">
      <div
        v-if="showForm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4"
        @click.self="showForm = false"
      >
        <form
          class="max-h-full w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6"
          @submit.prevent="saveAddress"
        >
          <h2 class="font-display text-h3 font-medium text-brand-text">
            {{ editing ? 'Modifier l’adresse' : 'Nouvelle adresse' }}
          </h2>

          <div class="mt-6 space-y-4">
            <label class="block">
              <span class="text-caption text-neutral-500 uppercase">Type</span>
              <select
                v-model="form.type"
                class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="billing">Facturation</option>
                <option value="shipping">Livraison</option>
              </select>
            </label>

            <label class="block">
              <span class="text-caption text-neutral-500 uppercase">Nom complet</span>
              <input
                v-model="form.fullName"
                type="text"
                required
                class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </label>

            <label class="block">
              <span class="text-caption text-neutral-500 uppercase">Adresse</span>
              <input
                v-model="form.street"
                type="text"
                required
                class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </label>

            <label class="block">
              <span class="text-caption text-neutral-500 uppercase">Complément</span>
              <input
                v-model="form.line2"
                type="text"
                class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </label>

            <div class="grid grid-cols-2 gap-4">
              <label class="block">
                <span class="text-caption text-neutral-500 uppercase">Ville</span>
                <input
                  v-model="form.city"
                  type="text"
                  required
                  class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </label>
              <label class="block">
                <span class="text-caption text-neutral-500 uppercase">Région</span>
                <input
                  v-model="form.region"
                  type="text"
                  class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </label>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <label class="block">
                <span class="text-caption text-neutral-500 uppercase">Code postal</span>
                <input
                  v-model="form.postalCode"
                  type="text"
                  required
                  class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </label>
              <label class="block">
                <span class="text-caption text-neutral-500 uppercase">Pays (ISO)</span>
                <input
                  v-model="form.country"
                  type="text"
                  maxlength="2"
                  required
                  class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none uppercase"
                />
              </label>
            </div>

            <label class="block">
              <span class="text-caption text-neutral-500 uppercase">Téléphone</span>
              <input
                v-model="form.phone"
                type="tel"
                class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </label>

            <label class="inline-flex items-center gap-2 text-sm text-neutral-700">
              <input
                v-model="form.isDefault"
                type="checkbox"
                class="accent-brand-500 h-4 w-4 rounded border-neutral-300"
              />
              Adresse par défaut pour ce type
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
