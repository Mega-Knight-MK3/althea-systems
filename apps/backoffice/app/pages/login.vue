<script setup lang="ts">
import type { AdminToken, AdminUser } from '~/composables/useAdminAuth'

definePageMeta({ layout: 'auth' })

interface LoginSuccess {
  user: AdminUser
  token: AdminToken
  twoFactorEnabled: boolean
}

interface LoginChallenge {
  requires2fa: true
  challengeToken: string
}

type LoginResponse = LoginSuccess | LoginChallenge

const api = useApi()
const router = useRouter()
const route = useRoute()
const { setSession } = useAdminAuth()
const toast = useToast()

const step = ref<'credentials' | 'totp'>('credentials')
const submitting = ref(false)
const credentials = reactive({ email: '', password: '' })
const challengeToken = ref('')
const code = ref('')

function isChallenge(value: LoginResponse): value is LoginChallenge {
  return 'requires2fa' in value && value.requires2fa === true
}

function applySession(payload: LoginSuccess) {
  setSession(payload.user, payload.token, payload.twoFactorEnabled)
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
  router.replace(redirect)
}

async function submitCredentials() {
  if (submitting.value) return
  submitting.value = true
  try {
    const result = await api<LoginResponse>('/admin/auth/login', {
      method: 'POST',
      body: { email: credentials.email, password: credentials.password }
    })
    if (isChallenge(result)) {
      challengeToken.value = result.challengeToken
      step.value = 'totp'
      return
    }
    applySession(result)
  } catch (err: unknown) {
    toast.add({ color: 'error', title: extractMessage(err, 'Identifiants invalides.') })
  } finally {
    submitting.value = false
  }
}

async function submitTotp() {
  if (submitting.value) return
  submitting.value = true
  try {
    const result = await api<LoginSuccess>('/admin/auth/verify-2fa', {
      method: 'POST',
      body: { challengeToken: challengeToken.value, code: code.value }
    })
    applySession(result)
  } catch (err: unknown) {
    toast.add({ color: 'error', title: extractMessage(err, 'Code invalide.') })
  } finally {
    submitting.value = false
  }
}

function extractMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: { message?: string } }).data
    if (data?.message) return data.message
  }
  return fallback
}
</script>

<template>
  <UCard class="w-full max-w-md">
    <template #header>
      <div class="flex items-center gap-3">
        <UIcon name="i-lucide-shield-check" class="size-7 text-primary" />
        <div>
          <h1 class="text-lg font-semibold">Althea Backoffice</h1>
          <p class="text-sm text-muted">Connexion administrateur</p>
        </div>
      </div>
    </template>

    <UForm
      v-if="step === 'credentials'"
      :state="credentials"
      class="space-y-4"
      @submit.prevent="submitCredentials"
    >
      <UFormField label="Email" name="email" required>
        <UInput
          v-model="credentials.email"
          type="email"
          autocomplete="email"
          autofocus
          class="w-full"
        />
      </UFormField>
      <UFormField label="Mot de passe" name="password" required>
        <UInput
          v-model="credentials.password"
          type="password"
          autocomplete="current-password"
          class="w-full"
        />
      </UFormField>
      <UButton type="submit" block :loading="submitting" label="Continuer" />
    </UForm>

    <UForm
      v-else
      :state="{ code }"
      class="space-y-4"
      @submit.prevent="submitTotp"
    >
      <p class="text-sm text-muted">
        Saisissez le code à 6 chiffres généré par votre application d'authentification, ou un code de récupération.
      </p>
      <UFormField label="Code" name="code" required>
        <UInput
          v-model="code"
          autocomplete="one-time-code"
          inputmode="text"
          autofocus
          class="w-full"
        />
      </UFormField>
      <div class="flex gap-2">
        <UButton
          type="button"
          variant="ghost"
          color="neutral"
          label="Retour"
          @click="step = 'credentials'"
        />
        <UButton type="submit" block :loading="submitting" label="Se connecter" />
      </div>
    </UForm>
  </UCard>
</template>
