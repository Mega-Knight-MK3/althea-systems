<script setup lang="ts">
import { countryName } from '~~/app/data/countries'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'Mon compte — Althea Systems' })

const { user } = useAuth()
const auth = useAuthApi()
const account = useAccountApi()
const checkoutApi = useCheckoutApi()
const router = useRouter()
const toast = useToast()

const [addressesResult, paymentsResult, ordersResult] = await Promise.all([
  account.listAddresses().catch(() => []),
  account.listPaymentMethods().catch(() => []),
  checkoutApi.listOrders().catch(() => []),
])

const defaultShipping = computed(
  () => addressesResult.find((a) => a.type === 'shipping' && a.isDefault) ?? addressesResult.find((a) => a.type === 'shipping')
)
const defaultBilling = computed(
  () => addressesResult.find((a) => a.type === 'billing' && a.isDefault) ?? addressesResult.find((a) => a.type === 'billing')
)
const defaultCard = computed(
  () => paymentsResult.find((p) => p.isDefault) ?? paymentsResult[0] ?? null
)
const lastOrder = computed(() => ordersResult[0] ?? null)
const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString('fr-FR') : '—'

async function onLogout() {
  await auth.logout()
  toast.success('Vous êtes déconnecté.')
  await router.replace('/')
}
</script>

<template>
  <section class="mx-auto w-full max-w-[1200px] px-4 py-12 md:px-10 md:py-16">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-caption text-brand-500 tracking-widest uppercase">Mon compte</p>
        <h1 class="font-display text-h1 mt-2 font-medium text-brand-text">
          Bonjour {{ user?.fullName ?? user?.email }}
        </h1>
      </div>
      <button
        type="button"
        class="rounded-md border border-neutral-200 px-4 py-2 text-sm text-neutral-700 transition-colors hover:border-brand-500 hover:text-brand-500"
        @click="onLogout"
      >
        Se déconnecter
      </button>
    </header>

    <ul class="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
      <li>
        <NuxtLink
          to="/account/settings"
          class="block h-full rounded-xl border border-neutral-100 bg-white p-6 transition-shadow hover:shadow-md"
        >
          <div class="flex items-start justify-between">
            <h2 class="font-display text-h3 font-medium text-brand-text">Paramètres</h2>
            <span class="text-brand-500">→</span>
          </div>
          <p class="mt-2 text-sm text-neutral-600">{{ user?.email }}</p>
          <p v-if="user?.phone" class="mt-1 text-sm text-neutral-500">{{ user.phone }}</p>
          <p v-else class="mt-1 text-caption text-neutral-400">Téléphone non renseigné</p>
        </NuxtLink>
      </li>

      <li>
        <NuxtLink
          to="/account/addresses"
          class="block h-full rounded-xl border border-neutral-100 bg-white p-6 transition-shadow hover:shadow-md"
        >
          <div class="flex items-start justify-between">
            <h2 class="font-display text-h3 font-medium text-brand-text">Adresses</h2>
            <span class="text-brand-500">→</span>
          </div>
          <div v-if="defaultShipping" class="mt-2 text-sm text-neutral-600">
            <p>{{ defaultShipping.fullName }}</p>
            <p>{{ defaultShipping.street }}</p>
            <p>{{ defaultShipping.postalCode }} {{ defaultShipping.city }}, {{ countryName(defaultShipping.country) }}</p>
          </div>
          <p v-else class="text-caption mt-2 text-neutral-400">
            Aucune adresse de livraison · cliquez pour en ajouter une
          </p>
        </NuxtLink>
      </li>

      <li>
        <NuxtLink
          to="/account/payment-methods"
          class="block h-full rounded-xl border border-neutral-100 bg-white p-6 transition-shadow hover:shadow-md"
        >
          <div class="flex items-start justify-between">
            <h2 class="font-display text-h3 font-medium text-brand-text">Moyens de paiement</h2>
            <span class="text-brand-500">→</span>
          </div>
          <p v-if="defaultCard" class="mt-2 text-sm text-neutral-600 capitalize">
            {{ defaultCard.brand }} •••• {{ defaultCard.lastFour }}
            <span v-if="defaultCard.expMonth && defaultCard.expYear" class="text-neutral-400">
              · {{ String(defaultCard.expMonth).padStart(2, '0') }}/{{ defaultCard.expYear }}
            </span>
          </p>
          <p v-else class="text-caption mt-2 text-neutral-400">
            Aucune carte enregistrée · cliquez pour en ajouter une
          </p>
        </NuxtLink>
      </li>

      <li>
        <NuxtLink
          to="/account/orders"
          class="block h-full rounded-xl border border-neutral-100 bg-white p-6 transition-shadow hover:shadow-md"
        >
          <div class="flex items-start justify-between">
            <h2 class="font-display text-h3 font-medium text-brand-text">Mes commandes</h2>
            <span class="text-brand-500">→</span>
          </div>
          <p class="mt-2 text-sm text-neutral-600">
            {{ ordersResult.length }} commande{{ ordersResult.length > 1 ? 's' : '' }} passée{{ ordersResult.length > 1 ? 's' : '' }}
          </p>
          <p v-if="lastOrder" class="text-caption mt-1 text-neutral-500">
            Dernière : {{ formatDate(lastOrder.placedAt ?? lastOrder.createdAt) }}
          </p>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
