<script setup lang="ts">
import type { AdminOrderDetail, OrderStatus } from '~/composables/useApiTypes'

const route = useRoute()
const api = useApi()
const toast = useToast()
const { currency, dateTime } = useFormat()
const { statuses, label, color } = useOrderStatus()
const id = Number(route.params.id)

const { data, refresh } = await useAsyncData<AdminOrderDetail>(`admin-order-${id}`, () =>
  api<AdminOrderDetail>(`/admin/orders/${id}`)
)

if (!data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Commande introuvable' })
}

const newStatus = ref<OrderStatus>('pending')
const note = ref('')
const submitting = ref(false)

watch(data, (v) => { if (v) newStatus.value = v.order.status }, { immediate: true })

async function changeStatus() {
  if (!newStatus.value || newStatus.value === data.value?.order.status) return
  submitting.value = true
  try {
    await api(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: { status: newStatus.value, note: note.value || undefined }
    })
    toast.add({ color: 'success', title: 'Statut mis à jour.' })
    note.value = ''
    refresh()
  } catch (err) {
    toast.add({ color: 'error', title: extractMessage(err, 'Erreur lors de la mise à jour.') })
  } finally {
    submitting.value = false
  }
}

const statusItems = computed(() => statuses.map((s) => ({ label: label(s), value: s })))

function extractMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: { message?: string } }).data
    if (data?.message) return data.message
  }
  return fallback
}
</script>

<template>
  <UDashboardNavbar :title="`Commande #${id}`">
    <template #left>
      <UButton to="/orders" icon="i-lucide-arrow-left" variant="ghost" color="neutral" label="Retour" />
    </template>
  </UDashboardNavbar>
  <div v-if="data" class="flex flex-col gap-4 sm:gap-6 flex-1 overflow-y-auto p-4 sm:p-6">
    <div class="grid gap-6 lg:grid-cols-3">
      <UCard class="lg:col-span-2">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold">Articles</h2>
            <UBadge :color="color(data.order.status)" variant="subtle">{{ label(data.order.status) }}</UBadge>
          </div>
        </template>
        <table class="min-w-full text-sm">
          <thead class="text-left text-muted uppercase text-xs">
            <tr>
              <th class="py-2">Produit</th>
              <th class="py-2 text-right">Qté</th>
              <th class="py-2 text-right">PU</th>
              <th class="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-for="item in data.order.items" :key="item.id">
              <td class="py-2">{{ item.productName }}</td>
              <td class="py-2 text-right">{{ item.quantity }}</td>
              <td class="py-2 text-right">{{ currency(Number(item.unitPrice)) }}</td>
              <td class="py-2 text-right font-medium">{{ currency(Number(item.total)) }}</td>
            </tr>
          </tbody>
          <tfoot class="border-t border-default text-sm">
            <tr>
              <td colspan="3" class="py-2 text-right text-muted">Sous-total</td>
              <td class="py-2 text-right">{{ currency(Number(data.order.subtotal)) }}</td>
            </tr>
            <tr>
              <td colspan="3" class="py-2 text-right text-muted">TVA</td>
              <td class="py-2 text-right">{{ currency(Number(data.order.tax)) }}</td>
            </tr>
            <tr v-if="data.order.shippingCost">
              <td colspan="3" class="py-2 text-right text-muted">Livraison</td>
              <td class="py-2 text-right">{{ currency(Number(data.order.shippingCost)) }}</td>
            </tr>
            <tr>
              <td colspan="3" class="py-2 text-right font-semibold">Total TTC</td>
              <td class="py-2 text-right font-semibold">{{ currency(Number(data.order.total)) }}</td>
            </tr>
          </tfoot>
        </table>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold">Client & paiement</h2>
        </template>
        <div class="space-y-3 text-sm">
          <div>
            <p class="text-muted text-xs">Client</p>
            <p class="font-medium">{{ data.order.user?.fullName || '—' }}</p>
            <p class="text-muted">{{ data.order.user?.email }}</p>
          </div>
          <div v-if="data.order.paymentMethod">
            <p class="text-muted text-xs">Moyen de paiement</p>
            <p>{{ data.order.paymentMethod.brand }} •••• {{ data.order.paymentMethod.lastFour }}</p>
          </div>
          <div v-if="data.order.stripePaymentIntentId">
            <p class="text-muted text-xs">Stripe Payment Intent</p>
            <code class="text-xs">{{ data.order.stripePaymentIntentId }}</code>
          </div>
          <div v-if="data.order.invoice">
            <p class="text-muted text-xs">Facture</p>
            <p class="font-medium">{{ data.order.invoice.invoiceNumber }}</p>
          </div>
        </div>
      </UCard>

      <UCard class="lg:col-span-2">
        <template #header>
          <h2 class="font-semibold">Adresses</h2>
        </template>
        <div class="grid gap-4 md:grid-cols-2 text-sm">
          <div>
            <p class="text-muted text-xs mb-1">Facturation</p>
            <template v-if="data.order.billingAddress">
              <p>{{ data.order.billingAddress.line1 }}</p>
              <p v-if="data.order.billingAddress.line2">{{ data.order.billingAddress.line2 }}</p>
              <p>{{ data.order.billingAddress.postalCode }} {{ data.order.billingAddress.city }}</p>
              <p class="text-muted">{{ data.order.billingAddress.country }}</p>
            </template>
            <p v-else class="text-muted">—</p>
          </div>
          <div>
            <p class="text-muted text-xs mb-1">Livraison</p>
            <template v-if="data.order.shippingAddress">
              <p>{{ data.order.shippingAddress.line1 }}</p>
              <p v-if="data.order.shippingAddress.line2">{{ data.order.shippingAddress.line2 }}</p>
              <p>{{ data.order.shippingAddress.postalCode }} {{ data.order.shippingAddress.city }}</p>
              <p class="text-muted">{{ data.order.shippingAddress.country }}</p>
            </template>
            <p v-else class="text-muted">—</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold">Changer le statut</h2>
        </template>
        <div class="space-y-3">
          <USelect v-model="newStatus" :items="statusItems" class="w-full" />
          <UTextarea v-model="note" :rows="2" placeholder="Commentaire (optionnel)" class="w-full" />
          <UButton block :loading="submitting" :disabled="newStatus === data.order.status" label="Mettre à jour" @click="changeStatus" />
        </div>
      </UCard>

      <UCard class="lg:col-span-3">
        <template #header>
          <h2 class="font-semibold">Historique des statuts</h2>
        </template>
        <ol v-if="data.history.length" class="space-y-3">
          <li v-for="entry in data.history" :key="entry.id" class="flex items-start gap-3 text-sm">
            <UIcon name="i-lucide-circle-dot" class="size-4 mt-0.5" :class="`text-${color(entry.toStatus) === 'neutral' ? 'gray-500' : color(entry.toStatus)}-500`" />
            <div>
              <p>
                <span v-if="entry.fromStatus" class="text-muted">{{ label(entry.fromStatus) }} →</span>
                <span class="font-medium">{{ label(entry.toStatus) }}</span>
              </p>
              <p class="text-xs text-muted">
                {{ dateTime(entry.createdAt) }}
                <span v-if="entry.changedBy"> · par {{ entry.changedBy.fullName || entry.changedBy.email }}</span>
              </p>
              <p v-if="entry.note" class="text-sm mt-1">{{ entry.note }}</p>
            </div>
          </li>
        </ol>
        <p v-else class="text-sm text-muted">Aucun changement de statut enregistré pour l'instant.</p>
      </UCard>
    </div>
  </div>
</template>
