<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useHead({ title: 'Mon compte — Althea Systems' })

const { user } = useAuth()
const auth = useAuthApi()
const router = useRouter()

const sections = [
  { to: '/account/settings', label: 'Paramètres', description: 'Nom, email, mot de passe.' },
  { to: '/account/addresses', label: 'Adresses', description: 'Carnet d’adresses de facturation et livraison.' },
  { to: '/account/payment-methods', label: 'Moyens de paiement', description: 'Cartes enregistrées via Stripe.' },
  { to: '/account/orders', label: 'Mes commandes', description: 'Historique de vos achats.' },
]

async function onLogout() {
  await auth.logout()
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
      <li v-for="section in sections" :key="section.to">
        <NuxtLink
          :to="section.to"
          class="block rounded-xl border border-neutral-100 bg-white p-6 transition-shadow hover:shadow-md"
        >
          <h2 class="font-display text-h3 font-medium text-brand-text">{{ section.label }}</h2>
          <p class="mt-2 text-sm text-neutral-600">{{ section.description }}</p>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
