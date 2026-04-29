<script setup lang="ts">
const api = useApi()
const toast = useToast()
const { twoFactorEnabled, setTwoFactorEnabled } = useAdminAuth()

interface EnrollmentPayload {
  secret: string
  otpAuthUrl: string
  qrCodeDataUrl: string
}

const enrollment = ref<EnrollmentPayload | null>(null)
const recoveryCodes = ref<string[] | null>(null)
const enrolling = ref(false)
const code = ref('')
const disablePassword = ref('')
const disableCode = ref('')
const disabling = ref(false)

async function startEnrollment() {
  enrolling.value = true
  try {
    enrollment.value = await api<EnrollmentPayload>('/admin/auth/totp/enroll', { method: 'POST' })
    recoveryCodes.value = null
    code.value = ''
  } catch (err) {
    toast.add({ color: 'error', title: extractMessage(err, 'Impossible de démarrer l\'inscription.') })
  } finally {
    enrolling.value = false
  }
}

async function confirmEnrollment() {
  if (!enrollment.value) return
  try {
    const result = await api<{ recoveryCodes: string[] }>('/admin/auth/totp/confirm', {
      method: 'POST',
      body: { code: code.value }
    })
    recoveryCodes.value = result.recoveryCodes
    enrollment.value = null
    setTwoFactorEnabled(true)
    toast.add({ color: 'success', title: '2FA activée. Conservez vos codes de récupération.' })
  } catch (err) {
    toast.add({ color: 'error', title: extractMessage(err, 'Code invalide.') })
  }
}

async function disableTotp() {
  if (disabling.value) return
  disabling.value = true
  try {
    await api('/admin/auth/totp/disable', {
      method: 'POST',
      body: { currentPassword: disablePassword.value, code: disableCode.value }
    })
    setTwoFactorEnabled(false)
    disablePassword.value = ''
    disableCode.value = ''
    toast.add({ color: 'success', title: '2FA désactivée.' })
  } catch (err) {
    toast.add({ color: 'error', title: extractMessage(err, 'Désactivation impossible.') })
  } finally {
    disabling.value = false
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
  <UDashboardNavbar title="Sécurité" />
  <div class="flex flex-col gap-4 sm:gap-6 flex-1 overflow-y-auto p-4 sm:p-6">
    <div class="grid gap-6 max-w-3xl">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="font-semibold">Authentification à deux facteurs</h2>
              <p class="text-sm text-muted">Renforce la connexion administrateur via une application TOTP.</p>
            </div>
            <UBadge :color="twoFactorEnabled ? 'success' : 'warning'" variant="subtle">
              {{ twoFactorEnabled ? 'Activée' : 'À configurer' }}
            </UBadge>
          </div>
        </template>

        <div v-if="!twoFactorEnabled && !enrollment" class="space-y-4">
          <p class="text-sm">
            Activez la 2FA pour sécuriser les actions administrateur. Vous aurez besoin d'une application comme Google Authenticator, 1Password ou Bitwarden.
          </p>
          <UButton :loading="enrolling" label="Configurer la 2FA" @click="startEnrollment" />
        </div>

        <div v-else-if="enrollment" class="space-y-4">
          <p class="text-sm">Scannez ce QR code dans votre application d'authentification puis saisissez le code généré.</p>
          <div class="flex flex-col md:flex-row gap-4 items-start">
            <img :src="enrollment.qrCodeDataUrl" alt="QR code 2FA" class="rounded-lg border border-default p-2 bg-default w-44 h-44" />
            <div class="space-y-2 text-sm">
              <p class="text-muted">Si vous ne pouvez pas scanner :</p>
              <UKbd class="font-mono break-all">{{ enrollment.secret }}</UKbd>
            </div>
          </div>
          <UFormField label="Code de vérification" required>
            <UInput v-model="code" autocomplete="one-time-code" inputmode="numeric" class="w-full max-w-xs" />
          </UFormField>
          <div class="flex gap-2">
            <UButton variant="ghost" color="neutral" label="Annuler" @click="enrollment = null" />
            <UButton label="Activer la 2FA" @click="confirmEnrollment" />
          </div>
        </div>

        <div v-else class="space-y-4">
          <p class="text-sm">La 2FA est active. Pour la désactiver, confirmez votre mot de passe et un code TOTP ou de récupération.</p>
          <UFormField label="Mot de passe" required>
            <UInput v-model="disablePassword" type="password" class="w-full max-w-xs" />
          </UFormField>
          <UFormField label="Code 2FA ou de récupération" required>
            <UInput v-model="disableCode" class="w-full max-w-xs" />
          </UFormField>
          <UButton color="error" :loading="disabling" label="Désactiver la 2FA" @click="disableTotp" />
        </div>
      </UCard>

      <UCard v-if="recoveryCodes">
        <template #header>
          <h2 class="font-semibold">Codes de récupération</h2>
        </template>
        <p class="text-sm text-muted mb-3">
          Conservez ces codes en lieu sûr. Chaque code ne peut être utilisé qu'une seule fois.
        </p>
        <ul class="grid grid-cols-2 gap-2 font-mono text-sm">
          <li v-for="rc in recoveryCodes" :key="rc" class="px-3 py-2 rounded-md bg-elevated">
            {{ rc }}
          </li>
        </ul>
      </UCard>
    </div>
  </div>
</template>
