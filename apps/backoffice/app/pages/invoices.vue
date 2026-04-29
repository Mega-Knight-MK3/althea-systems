<script setup lang="ts">
import type { AdminCreditNote, AdminInvoice, Paginated } from '~/composables/useApiTypes'

const config = useRuntimeConfig()
const api = useApi()
const { token } = useAdminAuth()
const toast = useToast()
const { currency, dateTime } = useFormat()

const tab = ref<'invoices' | 'credit-notes'>('invoices')

const { data: invoices, refresh: refreshInvoices, pending: invoicesPending } =
  await useAsyncData<Paginated<AdminInvoice>>(
    'admin-invoices',
    () => api<Paginated<AdminInvoice>>('/admin/invoices', { params: { perPage: 50 } })
  )

const { data: creditNotes, refresh: refreshCreditNotes, pending: creditNotesPending } =
  await useAsyncData<Paginated<AdminCreditNote>>(
    'admin-credit-notes',
    () => api<Paginated<AdminCreditNote>>('/admin/credit-notes', { params: { perPage: 50 } })
  )

const showCreateCredit = ref(false)
const creditForm = reactive({
  invoiceId: null as number | null,
  amount: 0,
  reason: ''
})

async function downloadInvoice(invoice: AdminInvoice) {
  await downloadPdf(`/admin/invoices/${invoice.id}/download`, `${invoice.invoiceNumber}.pdf`)
}

async function downloadCreditNote(cn: AdminCreditNote) {
  await downloadPdf(`/admin/credit-notes/${cn.id}/download`, `${cn.creditNoteNumber}.pdf`)
}

async function downloadPdf(path: string, filename: string) {
  try {
    const res = await fetch(`${config.public.apiBase}${path}`, {
      headers: { Authorization: `Bearer ${token.value?.value ?? ''}` }
    })
    if (!res.ok) throw new Error(String(res.status))
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    toast.add({ color: 'error', title: 'Téléchargement impossible.' })
  }
}

async function resendInvoice(invoice: AdminInvoice) {
  await api(`/admin/invoices/${invoice.id}/resend`, { method: 'POST' })
  toast.add({ color: 'success', title: `Email de la facture ${invoice.invoiceNumber} envoyé.` })
}

async function resendCreditNote(cn: AdminCreditNote) {
  await api(`/admin/credit-notes/${cn.id}/resend`, { method: 'POST' })
  toast.add({ color: 'success', title: `Email de l'avoir ${cn.creditNoteNumber} envoyé.` })
}

function openCreateCredit(invoice: AdminInvoice) {
  creditForm.invoiceId = invoice.id
  creditForm.amount = Number(invoice.total)
  creditForm.reason = ''
  showCreateCredit.value = true
}

async function submitCreditNote() {
  if (!creditForm.invoiceId || creditForm.amount <= 0) return
  try {
    await api('/admin/credit-notes', {
      method: 'POST',
      body: {
        invoiceId: creditForm.invoiceId,
        amount: creditForm.amount,
        reason: creditForm.reason || undefined
      }
    })
    toast.add({ color: 'success', title: 'Avoir créé.' })
    showCreateCredit.value = false
    refreshCreditNotes()
  } catch (err) {
    toast.add({ color: 'error', title: extractMessage(err, 'Création impossible.') })
  }
}

const orderStatusBadge: Record<string, { color: 'success' | 'warning' | 'error' | 'primary' | 'neutral', label: string }> = {
  paid: { color: 'success', label: 'Payée' },
  pending: { color: 'warning', label: 'En attente' },
  cancelled: { color: 'error', label: 'Annulée' },
  refunded: { color: 'neutral', label: 'Remboursée' }
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
  <UDashboardNavbar title="Factures & avoirs" />
  <UDashboardPanelContent class="p-4 sm:p-6">
    <UCard>
      <template #header>
        <UTabs
          v-model="tab"
          :items="[
            { label: `Factures (${invoices?.meta?.total ?? 0})`, value: 'invoices' },
            { label: `Avoirs (${creditNotes?.meta?.total ?? 0})`, value: 'credit-notes' }
          ]"
        />
      </template>

      <div v-if="tab === 'invoices'">
        <div v-if="!invoices?.data?.length" class="py-12 text-center text-sm text-muted">Aucune facture.</div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="text-left text-muted uppercase text-xs">
              <tr>
                <th class="px-3 py-2">N°</th>
                <th class="px-3 py-2">Date</th>
                <th class="px-3 py-2">Client</th>
                <th class="px-3 py-2">Commande</th>
                <th class="px-3 py-2">Statut</th>
                <th class="px-3 py-2 text-right">Montant TTC</th>
                <th class="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr v-for="invoice in invoices.data" :key="invoice.id">
                <td class="px-3 py-3 font-medium">{{ invoice.invoiceNumber }}</td>
                <td class="px-3 py-3 text-muted text-xs">{{ dateTime(invoice.issuedAt) }}</td>
                <td class="px-3 py-3">
                  <div class="font-medium">{{ invoice.customer }}</div>
                  <div v-if="invoice.customerEmail" class="text-xs text-muted">{{ invoice.customerEmail }}</div>
                </td>
                <td class="px-3 py-3">
                  <NuxtLink :to="`/orders/${invoice.orderId}`" class="text-primary hover:underline">#{{ invoice.orderId }}</NuxtLink>
                </td>
                <td class="px-3 py-3">
                  <UBadge v-if="invoice.orderStatus" :color="orderStatusBadge[invoice.orderStatus]?.color ?? 'neutral'" variant="subtle">
                    {{ orderStatusBadge[invoice.orderStatus]?.label ?? invoice.orderStatus }}
                  </UBadge>
                </td>
                <td class="px-3 py-3 text-right font-semibold">{{ currency(Number(invoice.total)) }}</td>
                <td class="px-3 py-3 text-right">
                  <div class="flex justify-end gap-1">
                    <UButton icon="i-lucide-download" variant="ghost" color="neutral" size="sm" aria-label="Télécharger" :disabled="!invoice.pdfPath" @click="downloadInvoice(invoice)" />
                    <UButton icon="i-lucide-mail" variant="ghost" color="neutral" size="sm" aria-label="Renvoyer par email" @click="resendInvoice(invoice)" />
                    <UButton icon="i-lucide-rotate-ccw" variant="ghost" color="warning" size="sm" aria-label="Créer un avoir" @click="openCreateCredit(invoice)" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <template v-if="invoicesPending">
          <USkeleton class="h-16 mt-3" />
        </template>
      </div>

      <div v-else>
        <div v-if="!creditNotes?.data?.length" class="py-12 text-center text-sm text-muted">Aucun avoir.</div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="text-left text-muted uppercase text-xs">
              <tr>
                <th class="px-3 py-2">N°</th>
                <th class="px-3 py-2">Facture liée</th>
                <th class="px-3 py-2">Date</th>
                <th class="px-3 py-2">Client</th>
                <th class="px-3 py-2">Motif</th>
                <th class="px-3 py-2 text-right">Montant</th>
                <th class="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr v-for="cn in creditNotes.data" :key="cn.id">
                <td class="px-3 py-3 font-medium">{{ cn.creditNoteNumber }}</td>
                <td class="px-3 py-3">{{ cn.invoiceNumber || '—' }}</td>
                <td class="px-3 py-3 text-muted text-xs">{{ dateTime(cn.issuedAt) }}</td>
                <td class="px-3 py-3">{{ cn.customer }}</td>
                <td class="px-3 py-3 text-xs text-muted max-w-xs">
                  <span class="line-clamp-1">{{ cn.reason || '—' }}</span>
                </td>
                <td class="px-3 py-3 text-right font-semibold text-error">- {{ currency(Number(cn.amount)) }}</td>
                <td class="px-3 py-3 text-right">
                  <div class="flex justify-end gap-1">
                    <UButton icon="i-lucide-download" variant="ghost" color="neutral" size="sm" aria-label="Télécharger" :disabled="!cn.pdfPath" @click="downloadCreditNote(cn)" />
                    <UButton icon="i-lucide-mail" variant="ghost" color="neutral" size="sm" aria-label="Renvoyer par email" @click="resendCreditNote(cn)" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <template v-if="creditNotesPending">
          <USkeleton class="h-16 mt-3" />
        </template>
      </div>
    </UCard>

    <UModal v-model:open="showCreateCredit">
      <template #content>
        <UCard>
          <template #header>
            <h2 class="font-semibold">Créer un avoir</h2>
          </template>
          <div class="space-y-3">
            <UFormField label="Montant" required>
              <UInput v-model.number="creditForm.amount" type="number" step="0.01" min="0.01" class="w-full" />
            </UFormField>
            <UFormField label="Motif">
              <UTextarea v-model="creditForm.reason" :rows="3" class="w-full" placeholder="Retour produit, geste commercial…" />
            </UFormField>
          </div>
          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton variant="ghost" color="neutral" label="Annuler" @click="showCreateCredit = false" />
              <UButton color="primary" label="Créer l'avoir" @click="submitCreditNote" />
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </UDashboardPanelContent>
</template>
