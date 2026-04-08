<script setup lang="ts">
import type { AddressInput } from '~/composables/useAccount'
import { COUNTRIES } from '~~/app/data/countries'

const props = defineProps<{
  modelValue: AddressInput
  loading?: boolean
  errorMessage?: string | null
  submitLabel?: string
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: AddressInput): void
  (e: 'submit'): void
  (e: 'cancel'): void
}>()

function set<K extends keyof AddressInput>(key: K, value: AddressInput[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

const firstField = ref<HTMLInputElement | null>(null)
onMounted(() => {
  firstField.value?.focus()
})
</script>

<template>
  <form class="space-y-5" @submit.prevent="emit('submit')">
    <div>
      <span class="text-caption text-neutral-500 uppercase tracking-wide">Type d’adresse</span>
      <div class="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          class="rounded-md border px-3 py-2 text-sm font-medium transition-colors"
          :class="
            modelValue.type === 'shipping'
              ? 'border-brand-500 bg-brand-50 text-brand-text'
              : 'border-neutral-200 text-neutral-600 hover:border-brand-300'
          "
          @click="set('type', 'shipping')"
        >
          Livraison
        </button>
        <button
          type="button"
          class="rounded-md border px-3 py-2 text-sm font-medium transition-colors"
          :class="
            modelValue.type === 'billing'
              ? 'border-brand-500 bg-brand-50 text-brand-text'
              : 'border-neutral-200 text-neutral-600 hover:border-brand-300'
          "
          @click="set('type', 'billing')"
        >
          Facturation
        </button>
      </div>
    </div>

    <label class="block">
      <span class="text-caption text-neutral-500 uppercase tracking-wide">Nom complet</span>
      <input
        ref="firstField"
        :value="modelValue.fullName"
        type="text"
        autocomplete="name"
        required
        class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        @input="set('fullName', ($event.target as HTMLInputElement).value)"
      />
    </label>

    <label class="block">
      <span class="text-caption text-neutral-500 uppercase tracking-wide">Adresse</span>
      <input
        :value="modelValue.street"
        type="text"
        autocomplete="address-line1"
        required
        placeholder="Numéro et rue"
        class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        @input="set('street', ($event.target as HTMLInputElement).value)"
      />
    </label>

    <label class="block">
      <span class="text-caption text-neutral-500 uppercase tracking-wide">Complément</span>
      <input
        :value="modelValue.line2 ?? ''"
        type="text"
        autocomplete="address-line2"
        placeholder="Bâtiment, étage, code (optionnel)"
        class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        @input="set('line2', ($event.target as HTMLInputElement).value)"
      />
    </label>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-[140px_1fr]">
      <label class="block">
        <span class="text-caption text-neutral-500 uppercase tracking-wide">Code postal</span>
        <input
          :value="modelValue.postalCode"
          type="text"
          autocomplete="postal-code"
          required
          class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          @input="set('postalCode', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label class="block">
        <span class="text-caption text-neutral-500 uppercase tracking-wide">Ville</span>
        <input
          :value="modelValue.city"
          type="text"
          autocomplete="address-level2"
          required
          class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          @input="set('city', ($event.target as HTMLInputElement).value)"
        />
      </label>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <label class="block">
        <span class="text-caption text-neutral-500 uppercase tracking-wide">Région (optionnel)</span>
        <input
          :value="modelValue.region ?? ''"
          type="text"
          autocomplete="address-level1"
          class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          @input="set('region', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label class="block">
        <span class="text-caption text-neutral-500 uppercase tracking-wide">Pays</span>
        <select
          :value="modelValue.country"
          required
          class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          @change="set('country', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="country in COUNTRIES" :key="country.code" :value="country.code">
            {{ country.name }}
          </option>
        </select>
      </label>
    </div>

    <label class="block">
      <span class="text-caption text-neutral-500 uppercase tracking-wide">Téléphone (optionnel)</span>
      <input
        :value="modelValue.phone ?? ''"
        type="tel"
        autocomplete="tel"
        class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        @input="set('phone', ($event.target as HTMLInputElement).value)"
      />
    </label>

    <label class="inline-flex items-center gap-2 text-sm text-neutral-700">
      <input
        :checked="modelValue.isDefault ?? false"
        type="checkbox"
        class="accent-brand-500 h-4 w-4 rounded border-neutral-300"
        @change="set('isDefault', ($event.target as HTMLInputElement).checked)"
      />
      Adresse par défaut pour ce type
    </label>

    <AppFormError :message="errorMessage" />

    <div class="flex items-center justify-end gap-2">
      <button
        type="button"
        class="rounded-md border border-neutral-200 px-4 py-2 text-sm text-neutral-700 hover:border-brand-300"
        @click="emit('cancel')"
      >
        Annuler
      </button>
      <button
        type="submit"
        class="bg-brand-500 hover:bg-brand-700 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-neutral-300"
        :disabled="loading"
      >
        {{ loading ? 'Enregistrement…' : (submitLabel ?? 'Enregistrer') }}
      </button>
    </div>
  </form>
</template>
