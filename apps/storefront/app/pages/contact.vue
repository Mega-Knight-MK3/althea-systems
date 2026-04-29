<script setup lang="ts">
const api = useApi()
const toast = useToast()
const { user } = useAuth()

const state = reactive({
  name: user.value?.fullName ?? '',
  email: user.value?.email ?? '',
  subject: '',
  message: ''
})
const errors = ref<Record<string, string>>({})
const submitting = ref(false)
const submitted = ref(false)

useSeoMeta({
  title: 'Contact — Althea Systems',
  description: 'Une question, une commande spécifique ? Notre équipe vous répond rapidement.'
})

function validate() {
  const next: Record<string, string> = {}
  if (state.name.trim().length < 2) next.name = 'Votre nom est requis.'
  if (!/^.+@.+\..+$/.test(state.email)) next.email = 'Adresse email invalide.'
  if (state.subject.trim().length < 2) next.subject = 'Sujet requis.'
  if (state.message.trim().length < 10) next.message = 'Message trop court (10 caractères minimum).'
  errors.value = next
  return Object.keys(next).length === 0
}

async function submit() {
  if (submitting.value) return
  if (!validate()) return
  submitting.value = true
  try {
    await api('/contact', {
      method: 'POST',
      body: {
        name: state.name,
        email: state.email,
        subject: state.subject,
        message: state.message
      }
    })
    submitted.value = true
    toast.success('Message envoyé. Notre équipe vous répondra rapidement.')
    state.subject = ''
    state.message = ''
  } catch (err) {
    toast.error(extractMessage(err, "Impossible d'envoyer le message."))
  } finally {
    submitting.value = false
  }
}

function extractMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: { message?: string, errors?: Array<{ message: string }> } }).data
    if (data?.errors?.[0]?.message) return data.errors[0].message
    if (data?.message) return data.message
  }
  return fallback
}
</script>

<template>
  <main class="mx-auto max-w-3xl px-4 py-10 md:px-10 md:py-16">
    <header class="mb-8 text-center">
      <p class="text-sm uppercase tracking-widest text-brand-500">Nous contacter</p>
      <h1 class="mt-2 font-display text-3xl text-brand-text md:text-4xl">Une question, un besoin spécifique ?</h1>
      <p class="mt-3 text-neutral-600">
        Notre équipe vous répond généralement sous 24 heures ouvrées. Pour les urgences SAV,
        précisez-le dans le sujet.
      </p>
    </header>

    <form
      v-if="!submitted"
      class="space-y-5 rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm md:p-8"
      @submit.prevent="submit"
    >
      <div class="grid gap-5 md:grid-cols-2">
        <label class="block text-sm font-medium">
          Nom
          <input
            v-model="state.name"
            type="text"
            required
            autocomplete="name"
            class="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 outline-none focus:border-brand-400"
          />
          <AppFormError v-if="errors.name" :message="errors.name" />
        </label>
        <label class="block text-sm font-medium">
          Email
          <input
            v-model="state.email"
            type="email"
            required
            autocomplete="email"
            class="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 outline-none focus:border-brand-400"
          />
          <AppFormError v-if="errors.email" :message="errors.email" />
        </label>
      </div>
      <label class="block text-sm font-medium">
        Sujet
        <input
          v-model="state.subject"
          type="text"
          required
          class="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 outline-none focus:border-brand-400"
        />
        <AppFormError v-if="errors.subject" :message="errors.subject" />
      </label>
      <label class="block text-sm font-medium">
        Message
        <textarea
          v-model="state.message"
          rows="6"
          required
          class="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 outline-none focus:border-brand-400"
        />
        <AppFormError v-if="errors.message" :message="errors.message" />
      </label>
      <div class="flex justify-end">
        <button
          type="submit"
          :disabled="submitting"
          class="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ submitting ? 'Envoi...' : 'Envoyer le message' }}
        </button>
      </div>
    </form>

    <div
      v-else
      class="rounded-2xl border border-brand-200 bg-brand-50 p-8 text-center"
    >
      <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-white">
        <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m5 13 4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <h2 class="font-display text-xl text-brand-text">Message bien reçu</h2>
      <p class="mt-2 text-sm text-neutral-700">
        Merci {{ state.name }}. Notre équipe vous recontacte sous peu à <strong>{{ state.email }}</strong>.
      </p>
      <button
        type="button"
        class="mt-5 rounded-lg border border-brand-300 px-5 py-2 text-sm font-semibold text-brand-text transition-colors hover:bg-brand-100"
        @click="submitted = false"
      >
        Envoyer un autre message
      </button>
    </div>
  </main>
</template>
