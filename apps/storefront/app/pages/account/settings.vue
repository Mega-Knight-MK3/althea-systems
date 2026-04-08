<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useHead({ title: 'Paramètres — Althea Systems' })

const account = useAccountApi()
const { user, setUser } = useAuth()

const fullName = ref(user.value?.fullName ?? '')
const phone = ref(user.value?.phone ?? '')
const profileMessage = ref<string | null>(null)
const profileError = ref<string | null>(null)
const profileLoading = ref(false)

async function saveProfile() {
  profileError.value = null
  profileMessage.value = null
  profileLoading.value = true
  try {
    const response = await account.updateProfile({
      fullName: fullName.value || null,
      phone: phone.value || null,
    })
    setUser(response.user)
    profileMessage.value = 'Profil mis à jour.'
  } catch (err) {
    profileError.value = extractFirstError(err) ?? 'Une erreur est survenue.'
  } finally {
    profileLoading.value = false
  }
}

const newEmail = ref('')
const emailPassword = ref('')
const emailMessage = ref<string | null>(null)
const emailError = ref<string | null>(null)
const emailLoading = ref(false)

async function saveEmail() {
  emailError.value = null
  emailMessage.value = null
  emailLoading.value = true
  try {
    const response = await account.changeEmail({
      email: newEmail.value,
      currentPassword: emailPassword.value,
    })
    emailMessage.value = response.message
    newEmail.value = ''
    emailPassword.value = ''
  } catch (err) {
    emailError.value = extractFirstError(err) ?? 'Une erreur est survenue.'
  } finally {
    emailLoading.value = false
  }
}

const currentPassword = ref('')
const newPassword = ref('')
const passwordMessage = ref<string | null>(null)
const passwordError = ref<string | null>(null)
const passwordLoading = ref(false)

async function savePassword() {
  passwordError.value = null
  passwordMessage.value = null
  passwordLoading.value = true
  try {
    const response = await account.changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    })
    passwordMessage.value = response.message
    currentPassword.value = ''
    newPassword.value = ''
  } catch (err) {
    passwordError.value = extractFirstError(err) ?? 'Une erreur est survenue.'
  } finally {
    passwordLoading.value = false
  }
}

const auth = useAuthApi()
const router = useRouter()

async function deactivate() {
  if (!confirm('Confirmer la désactivation de votre compte ?')) return
  await account.deactivate()
  await auth.logout()
  await router.replace('/')
}
</script>

<template>
  <section class="mx-auto w-full max-w-[800px] px-4 py-12 md:px-10 md:py-16">
    <NuxtLink to="/account" class="text-sm text-neutral-500 hover:text-brand-500">
      ← Mon compte
    </NuxtLink>
    <h1 class="font-display text-h1 mt-2 font-medium text-brand-text">Paramètres</h1>

    <div class="mt-10 space-y-12">
      <form class="space-y-4 rounded-xl border border-neutral-100 bg-white p-6" @submit.prevent="saveProfile">
        <h2 class="font-display text-h3 font-medium text-brand-text">Informations personnelles</h2>

        <label class="block">
          <span class="text-caption text-neutral-500 uppercase">Nom complet</span>
          <input
            v-model="fullName"
            type="text"
            class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>

        <label class="block">
          <span class="text-caption text-neutral-500 uppercase">Téléphone</span>
          <input
            v-model="phone"
            type="tel"
            class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>

        <p v-if="profileMessage" class="bg-success/10 text-success rounded-md px-3 py-2 text-sm">
          {{ profileMessage }}
        </p>
        <AppFormError :message="profileError" />

        <button
          type="submit"
          class="bg-brand-500 hover:bg-brand-700 inline-flex rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:bg-neutral-300"
          :disabled="profileLoading"
        >
          {{ profileLoading ? 'Mise à jour…' : 'Enregistrer' }}
        </button>
      </form>

      <form class="space-y-4 rounded-xl border border-neutral-100 bg-white p-6" @submit.prevent="saveEmail">
        <h2 class="font-display text-h3 font-medium text-brand-text">Adresse email</h2>
        <p class="text-sm text-neutral-600">Adresse actuelle : {{ user?.email }}</p>

        <label class="block">
          <span class="text-caption text-neutral-500 uppercase">Nouvelle adresse</span>
          <input
            v-model="newEmail"
            type="email"
            required
            class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>

        <label class="block">
          <span class="text-caption text-neutral-500 uppercase">Mot de passe actuel</span>
          <input
            v-model="emailPassword"
            type="password"
            required
            class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>

        <p v-if="emailMessage" class="bg-success/10 text-success rounded-md px-3 py-2 text-sm">
          {{ emailMessage }}
        </p>
        <AppFormError :message="emailError" />

        <button
          type="submit"
          class="bg-brand-500 hover:bg-brand-700 inline-flex rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:bg-neutral-300"
          :disabled="emailLoading"
        >
          {{ emailLoading ? 'Envoi…' : 'Envoyer la confirmation' }}
        </button>
      </form>

      <form class="space-y-4 rounded-xl border border-neutral-100 bg-white p-6" @submit.prevent="savePassword">
        <h2 class="font-display text-h3 font-medium text-brand-text">Mot de passe</h2>

        <label class="block">
          <span class="text-caption text-neutral-500 uppercase">Mot de passe actuel</span>
          <input
            v-model="currentPassword"
            type="password"
            required
            class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>

        <label class="block">
          <span class="text-caption text-neutral-500 uppercase">Nouveau mot de passe</span>
          <input
            v-model="newPassword"
            type="password"
            minlength="8"
            required
            class="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>

        <p v-if="passwordMessage" class="bg-success/10 text-success rounded-md px-3 py-2 text-sm">
          {{ passwordMessage }}
        </p>
        <AppFormError :message="passwordError" />

        <button
          type="submit"
          class="bg-brand-500 hover:bg-brand-700 inline-flex rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:bg-neutral-300"
          :disabled="passwordLoading"
        >
          {{ passwordLoading ? 'Mise à jour…' : 'Mettre à jour' }}
        </button>
      </form>

      <div class="rounded-xl border border-danger/20 bg-danger/5 p-6">
        <h2 class="font-display text-h3 text-danger font-medium">Désactivation du compte</h2>
        <p class="mt-2 text-sm text-neutral-700">
          Désactiver votre compte vous déconnecte immédiatement et bloque toute connexion future.
        </p>
        <button
          type="button"
          class="bg-danger mt-4 inline-flex rounded-md px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-danger/90"
          @click="deactivate"
        >
          Désactiver mon compte
        </button>
      </div>
    </div>
  </section>
</template>
