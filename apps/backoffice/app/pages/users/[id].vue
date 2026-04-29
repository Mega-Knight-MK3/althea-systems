<script setup lang="ts">
import type { AdminUserDetail } from '~/composables/useApiTypes'

const route = useRoute()
const router = useRouter()
const api = useApi()
const toast = useToast()
const { currency, dateTime } = useFormat()
const id = Number(route.params.id)

const { data, refresh } = await useAsyncData<AdminUserDetail>(`admin-user-${id}`, () =>
  api<AdminUserDetail>(`/admin/users/${id}`)
)

if (!data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Utilisateur introuvable' })
}

async function toggleActive() {
  if (!data.value) return
  const isActive = !data.value.user.isActive
  await api(`/admin/users/${id}`, { method: 'PATCH', body: { isActive } })
  toast.add({ color: 'success', title: isActive ? 'Compte activé.' : 'Compte désactivé.' })
  refresh()
}

async function sendReset() {
  await api(`/admin/users/${id}/reset-password`, { method: 'POST' })
  toast.add({ color: 'success', title: 'Email de réinitialisation envoyé.' })
}

async function destroy() {
  if (!data.value) return
  const message = `Supprimer définitivement ${data.value.user.email} ?\n\nRGPD : toutes les données personnelles seront effacées. Cette action est irréversible.`
  if (!confirm(message)) return
  await api(`/admin/users/${id}`, { method: 'DELETE' })
  toast.add({ color: 'success', title: 'Utilisateur supprimé.' })
  router.push('/users')
}

const statusBadge: Record<string, { color: 'success' | 'warning' | 'error', label: string }> = {
  active: { color: 'success', label: 'Actif' },
  pending: { color: 'warning', label: 'En attente de vérification' },
  inactive: { color: 'error', label: 'Désactivé' }
}
</script>

<template>
  <UDashboardNavbar :title="data?.user.fullName || data?.user.email || 'Utilisateur'">
    <template #left>
      <UButton to="/users" icon="i-lucide-arrow-left" variant="ghost" color="neutral" label="Retour" />
    </template>
    <template #right>
      <div class="flex gap-2">
        <UButton variant="soft" :color="data?.user.isActive ? 'warning' : 'success'" :icon="data?.user.isActive ? 'i-lucide-eye-off' : 'i-lucide-eye'" :label="data?.user.isActive ? 'Désactiver' : 'Activer'" @click="toggleActive" />
        <UButton variant="soft" color="neutral" icon="i-lucide-key-round" label="Réinitialiser MDP" @click="sendReset" />
        <UButton variant="soft" color="error" icon="i-lucide-trash-2" label="Supprimer" :disabled="data?.user.role === 'admin'" @click="destroy" />
      </div>
    </template>
  </UDashboardNavbar>
  <div v-if="data" class="flex flex-col gap-4 sm:gap-6 flex-1 overflow-y-auto p-4 sm:p-6">
    <div class="grid gap-6 lg:grid-cols-3">
      <UCard class="lg:col-span-2">
        <template #header>
          <h2 class="font-semibold">Informations</h2>
        </template>
        <dl class="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <dt class="text-muted">Email</dt>
            <dd>{{ data.user.email }}</dd>
          </div>
          <div>
            <dt class="text-muted">Téléphone</dt>
            <dd>{{ data.user.phone || '—' }}</dd>
          </div>
          <div>
            <dt class="text-muted">Rôle</dt>
            <dd>{{ data.user.role === 'admin' ? 'Administrateur' : 'Client' }}</dd>
          </div>
          <div>
            <dt class="text-muted">Statut</dt>
            <dd>
              <UBadge :color="statusBadge[data.user.accountStatus]?.color ?? 'neutral'" variant="subtle">
                {{ statusBadge[data.user.accountStatus]?.label ?? data.user.accountStatus }}
              </UBadge>
            </dd>
          </div>
          <div>
            <dt class="text-muted">Inscrit le</dt>
            <dd>{{ dateTime(data.user.createdAt) }}</dd>
          </div>
          <div>
            <dt class="text-muted">Email vérifié</dt>
            <dd>{{ data.user.emailVerifiedAt ? dateTime(data.user.emailVerifiedAt) : 'Non' }}</dd>
          </div>
        </dl>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold">Activité commerciale</h2>
        </template>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between"><span class="text-muted">Commandes</span><span class="font-medium">{{ data.orderCount }}</span></div>
          <div class="flex justify-between"><span class="text-muted">Chiffre d'affaires</span><span class="font-medium">{{ currency(data.totalRevenue) }}</span></div>
        </div>
      </UCard>

      <UCard class="lg:col-span-3">
        <template #header>
          <h2 class="font-semibold">Adresses ({{ data.addresses.length }})</h2>
        </template>
        <div v-if="!data.addresses.length" class="text-sm text-muted">Aucune adresse enregistrée.</div>
        <div v-else class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div v-for="address in data.addresses" :key="address.id" class="rounded-lg border border-default p-3 text-sm">
            <div class="flex items-center justify-between mb-1">
              <p class="font-medium">{{ address.fullName || '—' }}</p>
              <UBadge v-if="address.isDefault" color="primary" variant="subtle">Par défaut</UBadge>
            </div>
            <p>{{ address.line1 }}</p>
            <p v-if="address.line2">{{ address.line2 }}</p>
            <p>{{ address.postalCode }} {{ address.city }}</p>
            <p class="text-muted">{{ address.country }}</p>
          </div>
        </div>
      </UCard>

      <UCard class="lg:col-span-3">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold">10 dernières commandes</h2>
            <UButton :to="`/orders?userId=${id}`" variant="link" color="neutral" size="sm" label="Toutes" />
          </div>
        </template>
        <div v-if="!data.orders.length" class="text-sm text-muted">Aucune commande.</div>
        <div v-else class="divide-y divide-default">
          <div v-for="order in data.orders" :key="order.id" class="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0">
            <div>
              <p class="font-medium">#{{ order.id }}</p>
              <p class="text-xs text-muted">{{ dateTime(order.createdAt) }}</p>
            </div>
            <div class="flex items-center gap-3">
              <UBadge variant="subtle">{{ order.status }}</UBadge>
              <span class="font-semibold">{{ currency(Number(order.total)) }}</span>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
