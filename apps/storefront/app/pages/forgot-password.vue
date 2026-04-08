<script setup lang="ts">
definePageMeta({ middleware: 'guest' })
useHead({ title: 'Mot de passe oublié — Althea Systems' })

const auth = useAuthApi()
const email = ref('')
const message = ref<string | null>(null)
const errorMessage = ref<string | null>(null)
const loading = ref(false)

async function onSubmit() {
  errorMessage.value = null
  message.value = null
  loading.value = true
  try {
    const response = await auth.requestPasswordReset(email.value)
    message.value = response.message
  } catch (err) {
    errorMessage.value = extractFirstError(err) ?? 'Une erreur est survenue.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="mx-auto w-full max-w-md px-4 py-12 md:py-16">
    <h1 class="font-display text-h1 font-medium text-brand-text">Mot de passe oublié</h1>
    <p class="mt-3 text-sm text-neutral-600">
      Saisissez votre adresse email pour recevoir un lien de réinitialisation.
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

      <div v-if="message" class="bg-success/10 text-success rounded-md px-4 py-2 text-sm">
        {{ message }}
      </div>
      <AppFormError :message="errorMessage" />

      <button
        type="submit"
        class="bg-brand-500 hover:bg-brand-700 inline-flex w-full items-center justify-center rounded-md px-4 py-3 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-neutral-300"
        :disabled="loading"
      >
        {{ loading ? 'Envoi…' : 'Envoyer le lien' }}
      </button>
    </form>
  </section>
</template>
