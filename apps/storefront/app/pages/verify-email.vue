<script setup lang="ts">
useHead({ title: 'Confirmation email — Althea Systems' })

const route = useRoute()
const auth = useAuthApi()

const status = ref<'pending' | 'success' | 'error'>('pending')
const errorMessage = ref<string | null>(null)

const token = computed(() => String(route.query.token ?? ''))

onMounted(async () => {
  if (!token.value) {
    status.value = 'error'
    errorMessage.value = 'Lien de confirmation invalide.'
    return
  }
  try {
    await auth.verifyEmail(token.value)
    status.value = 'success'
  } catch (err) {
    status.value = 'error'
    errorMessage.value = extractFirstError(err) ?? 'Lien de confirmation invalide ou expiré.'
  }
})
</script>

<template>
  <section class="mx-auto w-full max-w-md px-4 py-16 text-center">
    <h1 class="font-display text-h1 font-medium text-brand-text">Confirmation de votre email</h1>

    <p v-if="status === 'pending'" class="mt-6 text-sm text-neutral-600">Vérification en cours…</p>

    <div v-else-if="status === 'success'" class="mt-8 space-y-4">
      <p class="bg-success/10 text-success rounded-md px-4 py-3 text-sm">
        Votre adresse email est confirmée. Vous pouvez maintenant accéder à votre espace.
      </p>
      <NuxtLink
        to="/login"
        class="bg-brand-500 hover:bg-brand-700 inline-flex rounded-md px-5 py-3 text-sm font-medium text-white transition-colors"
      >
        Se connecter
      </NuxtLink>
    </div>

    <div v-else class="mt-8 space-y-4">
      <p class="bg-danger/10 text-danger rounded-md px-4 py-3 text-sm">
        {{ errorMessage }}
      </p>
      <NuxtLink
        to="/login"
        class="text-sm text-brand-500 hover:text-brand-700"
      >
        Retour à la connexion
      </NuxtLink>
    </div>
  </section>
</template>
