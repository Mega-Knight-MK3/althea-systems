<script setup lang="ts">
definePageMeta({ middleware: 'guest' })
useHead({ title: 'Réinitialiser le mot de passe — Althea Systems' })

const route = useRoute()
const router = useRouter()
const auth = useAuthApi()

const token = computed(() => String(route.query.token ?? ''))
const password = ref('')
const confirmation = ref('')
const errorMessage = ref<string | null>(null)
const loading = ref(false)

async function onSubmit() {
  errorMessage.value = null
  if (password.value !== confirmation.value) {
    errorMessage.value = 'Les deux mots de passe ne correspondent pas.'
    return
  }
  loading.value = true
  try {
    await auth.resetPassword(token.value, password.value)
    await router.replace('/login')
  } catch (err) {
    errorMessage.value = extractFirstError(err) ?? 'Lien invalide ou expiré.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="mx-auto w-full max-w-md px-4 py-12 md:py-16">
    <h1 class="font-display text-h1 font-medium text-brand-text">Nouveau mot de passe</h1>
    <p v-if="!token" class="mt-3 text-sm text-danger">
      Lien invalide. Demandez un nouveau mail de réinitialisation depuis la page mot de passe oublié.
    </p>

    <form v-else class="mt-8 space-y-5" @submit.prevent="onSubmit">
      <label class="block">
        <span class="text-caption text-neutral-500 uppercase">Nouveau mot de passe</span>
        <input
          v-model="password"
          type="password"
          autocomplete="new-password"
          minlength="8"
          required
          class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>

      <label class="block">
        <span class="text-caption text-neutral-500 uppercase">Confirmation</span>
        <input
          v-model="confirmation"
          type="password"
          autocomplete="new-password"
          minlength="8"
          required
          class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>

      <AppFormError :message="errorMessage" />

      <button
        type="submit"
        class="bg-brand-500 hover:bg-brand-700 inline-flex w-full items-center justify-center rounded-md px-4 py-3 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-neutral-300"
        :disabled="loading"
      >
        {{ loading ? 'Mise à jour…' : 'Mettre à jour le mot de passe' }}
      </button>
    </form>
  </section>
</template>
