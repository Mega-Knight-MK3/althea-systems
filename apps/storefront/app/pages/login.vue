<script setup lang="ts">
definePageMeta({ middleware: 'guest' })
useHead({ title: 'Connexion — Althea Systems' })

const route = useRoute()
const router = useRouter()
const auth = useAuthApi()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const errorMessage = ref<string | null>(null)
const loading = ref(false)

async function onSubmit() {
  errorMessage.value = null
  loading.value = true
  try {
    await auth.login({ email: email.value, password: password.value, rememberMe: rememberMe.value })
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/account'
    await router.replace(redirect)
  } catch (err) {
    errorMessage.value = extractFirstError(err) ?? 'Identifiants invalides.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="mx-auto w-full max-w-md px-4 py-12 md:py-16">
    <h1 class="font-display text-h1 font-medium text-brand-text">Connexion</h1>
    <p class="mt-3 text-sm text-neutral-600">
      Accédez à votre espace Althea Systems pour gérer vos commandes.
    </p>

    <form class="mt-8 space-y-5" @submit.prevent="onSubmit">
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
          autocomplete="current-password"
          required
          class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>

      <div class="flex items-center justify-between text-sm">
        <label class="inline-flex items-center gap-2 text-neutral-700">
          <input
            v-model="rememberMe"
            type="checkbox"
            class="accent-brand-500 h-4 w-4 rounded border-neutral-300"
          />
          Se souvenir de moi
        </label>
        <NuxtLink to="/forgot-password" class="text-brand-500 hover:text-brand-700">
          Mot de passe oublié ?
        </NuxtLink>
      </div>

      <AppFormError :message="errorMessage" />

      <button
        type="submit"
        class="bg-brand-500 hover:bg-brand-700 inline-flex w-full items-center justify-center rounded-md px-4 py-3 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-neutral-300"
        :disabled="loading"
      >
        {{ loading ? 'Connexion…' : 'Se connecter' }}
      </button>

      <p class="text-center text-sm text-neutral-600">
        Pas encore de compte ?
        <NuxtLink to="/register" class="text-brand-500 hover:text-brand-700">Créer un compte</NuxtLink>
      </p>
    </form>
  </section>
</template>
