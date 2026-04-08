<script setup lang="ts">
definePageMeta({ middleware: 'guest' })
useHead({ title: 'Créer un compte — Althea Systems' })

const fullName = ref('')
const email = ref('')
const password = ref('')
const success = ref(false)
const errorMessage = ref<string | null>(null)
const loading = ref(false)

const auth = useAuthApi()

async function onSubmit() {
  errorMessage.value = null
  loading.value = true
  try {
    await auth.register({ fullName: fullName.value, email: email.value, password: password.value })
    success.value = true
  } catch (err) {
    errorMessage.value = extractFirstError(err) ?? 'Une erreur est survenue.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="mx-auto w-full max-w-md px-4 py-12 md:py-16">
    <h1 class="font-display text-h1 font-medium text-brand-text">Créer un compte</h1>
    <p class="mt-3 text-sm text-neutral-600">
      Renseignez vos informations pour accéder au catalogue Althea Systems.
    </p>

    <div
      v-if="success"
      class="bg-success/10 text-success mt-8 rounded-md px-4 py-3 text-sm"
    >
      Votre compte est créé. Confirmez votre adresse email via le lien que nous venons de vous
      envoyer.
    </div>

    <form v-else class="mt-8 space-y-5" @submit.prevent="onSubmit">
      <label class="block">
        <span class="text-caption text-neutral-500 uppercase">Nom complet</span>
        <input
          v-model="fullName"
          type="text"
          autocomplete="name"
          required
          class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>

      <label class="block">
        <span class="text-caption text-neutral-500 uppercase">Adresse email</span>
        <input
          v-model="email"
          type="email"
          autocomplete="email"
          required
          class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>

      <label class="block">
        <span class="text-caption text-neutral-500 uppercase">Mot de passe</span>
        <input
          v-model="password"
          type="password"
          autocomplete="new-password"
          minlength="8"
          required
          class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <span class="mt-1 block text-caption text-neutral-500">
          8 caractères minimum.
        </span>
      </label>

      <AppFormError :message="errorMessage" />

      <button
        type="submit"
        class="bg-brand-500 hover:bg-brand-700 inline-flex w-full items-center justify-center rounded-md px-4 py-3 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-neutral-300"
        :disabled="loading"
      >
        {{ loading ? 'Création…' : 'Créer mon compte' }}
      </button>

      <p class="text-center text-sm text-neutral-600">
        Déjà un compte ?
        <NuxtLink to="/login" class="text-brand-500 hover:text-brand-700">Se connecter</NuxtLink>
      </p>
    </form>
  </section>
</template>
