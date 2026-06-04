<script setup lang="ts">
import type {
  AdminChatbotMessage,
  AdminChatbotSession,
  AdminContactMessage,
  Paginated
} from '~/composables/useApiTypes'

const api = useApi()
const { dateTime } = useFormat()
const toast = useToast()

const tab = ref<'contact' | 'chatbot'>('contact')

const contactStatus = ref<'all' | 'unread' | 'read'>('all')
const contactSearch = ref('')
const debouncedContactSearch = ref('')
let contactDebounce: ReturnType<typeof setTimeout> | undefined
watch(contactSearch, (value) => {
  if (contactDebounce) clearTimeout(contactDebounce)
  contactDebounce = setTimeout(() => { debouncedContactSearch.value = value }, 300)
})

const contactParams = computed(() => {
  const params: Record<string, string> = { status: contactStatus.value }
  if (debouncedContactSearch.value) params.q = debouncedContactSearch.value
  return params
})
const { data: contacts, refresh: refreshContacts } = await useAsyncData<Paginated<AdminContactMessage>>(
  'admin-contacts',
  () => api<Paginated<AdminContactMessage>>('/admin/messages', { params: contactParams.value }),
  { watch: [contactParams] }
)

const chatStatus = ref<'all' | 'escalated' | 'unread'>('all')
const chatSearch = ref('')
const debouncedChatSearch = ref('')
let chatDebounce: ReturnType<typeof setTimeout> | undefined
watch(chatSearch, (value) => {
  if (chatDebounce) clearTimeout(chatDebounce)
  chatDebounce = setTimeout(() => { debouncedChatSearch.value = value }, 300)
})

const chatParams = computed(() => {
  const params: Record<string, string> = { status: chatStatus.value }
  if (debouncedChatSearch.value) params.q = debouncedChatSearch.value
  return params
})
const { data: chats, refresh: refreshChats } = await useAsyncData<Paginated<AdminChatbotSession>>(
  'admin-chats',
  () => api<Paginated<AdminChatbotSession>>('/admin/chatbot/sessions', { params: chatParams.value }),
  { watch: [chatParams] }
)

const selectedContact = ref<AdminContactMessage | null>(null)
const selectedChat = ref<AdminChatbotSession | null>(null)
const chatTranscript = ref<AdminChatbotMessage[]>([])
const replyDraft = ref('')
const replying = ref(false)

const contactOpen = computed({
  get: () => selectedContact.value !== null,
  set: (v: boolean) => { if (!v) selectedContact.value = null }
})
const chatOpen = computed({
  get: () => selectedChat.value !== null,
  set: (v: boolean) => { if (!v) { selectedChat.value = null; chatTranscript.value = [] } }
})

async function openContact(message: AdminContactMessage) {
  const fresh = await api<AdminContactMessage>(`/admin/messages/${message.id}`)
  selectedContact.value = fresh
  refreshContacts()
}

async function openChat(session: AdminChatbotSession) {
  const detail = await api<{ session: AdminChatbotSession, messages: AdminChatbotMessage[] }>(
    `/admin/chatbot/sessions/${session.id}`
  )
  selectedChat.value = detail.session
  chatTranscript.value = detail.messages
  refreshChats()
}

async function toggleContactRead(message: AdminContactMessage) {
  await api(`/admin/messages/${message.id}/read`, { method: 'PATCH', body: { isRead: !message.isRead } })
  refreshContacts()
}

async function sendReply() {
  if (!selectedChat.value || !replyDraft.value.trim()) return
  replying.value = true
  try {
    const result = await api<{ message: AdminChatbotMessage }>(
      `/admin/chatbot/sessions/${selectedChat.value.id}/reply`,
      { method: 'POST', body: { content: replyDraft.value } }
    )
    chatTranscript.value = [...chatTranscript.value, result.message]
    replyDraft.value = ''
    toast.add({ color: 'success', title: 'Réponse envoyée.' })
  } catch (err) {
    toast.add({ color: 'error', title: extractMessage(err, 'Envoi impossible.') })
  } finally {
    replying.value = false
  }
}

const contactStatusItems = [
  { label: 'Toutes', value: 'all' as const },
  { label: 'Non lues', value: 'unread' as const },
  { label: 'Lues', value: 'read' as const }
]

const chatStatusItems = [
  { label: 'Toutes', value: 'all' as const },
  { label: 'Escaladées', value: 'escalated' as const },
  { label: 'Non lues', value: 'unread' as const }
]

const roleColor: Record<string, 'primary' | 'success' | 'warning' | 'neutral'> = {
  user: 'primary',
  bot: 'neutral',
  agent: 'success'
}

const roleLabel: Record<string, string> = {
  user: 'Visiteur',
  bot: 'Bot',
  agent: 'Conseiller'
}

async function takeoverFromMessages() {
  if (!selectedChat.value) return
  try {
    const response = await api<{ session: AdminChatbotSession }>(
      `/admin/chatbot/sessions/${selectedChat.value.id}/takeover`,
      { method: 'POST' }
    )
    selectedChat.value = response.session
    toast.add({ color: 'success', title: 'Session prise en charge' })
    refreshChats()
  } catch (err) {
    toast.add({ color: 'error', title: extractMessage(err, 'Impossible de prendre en charge') })
  }
}

async function handbackFromMessages() {
  if (!selectedChat.value) return
  try {
    const response = await api<{ session: AdminChatbotSession }>(
      `/admin/chatbot/sessions/${selectedChat.value.id}/handback`,
      { method: 'POST' }
    )
    selectedChat.value = response.session
    toast.add({ color: 'success', title: 'Rendu au bot' })
    refreshChats()
  } catch (err) {
    toast.add({ color: 'error', title: extractMessage(err, 'Impossible de rendre au bot') })
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
  <UDashboardNavbar title="Messages" />
  <div class="flex flex-col gap-4 sm:gap-6 flex-1 overflow-y-auto p-4 sm:p-6">
    <UCard>
      <template #header>
        <UTabs
          v-model="tab"
          :items="[
            { label: `Formulaire (${contacts?.meta?.total ?? 0})`, value: 'contact' },
            { label: `Chatbot (${chats?.meta?.total ?? 0})`, value: 'chatbot' }
          ]"
        />
      </template>

      <div v-if="tab === 'contact'">
        <div class="mb-4 flex flex-wrap items-center gap-3">
          <UInput v-model="contactSearch" icon="i-lucide-search" placeholder="Email, sujet, contenu..." class="w-72" />
          <USelect v-model="contactStatus" :items="contactStatusItems" class="w-40" />
        </div>
        <div v-if="!contacts?.data?.length" class="py-12 text-center text-sm text-muted">Aucun message.</div>
        <ul v-else class="divide-y divide-default">
          <li
            v-for="msg in contacts.data"
            :key="msg.id"
            class="flex cursor-pointer items-start gap-3 py-3 first:pt-0 last:pb-0 hover:bg-elevated/50 -mx-2 px-2 rounded-md"
            @click="openContact(msg)"
          >
            <UIcon :name="msg.isRead ? 'i-lucide-mail-open' : 'i-lucide-mail'" class="size-4 mt-1" :class="msg.isRead ? 'text-muted' : 'text-primary'" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-3">
                <p class="font-medium" :class="msg.isRead ? '' : 'text-primary'">{{ msg.subject }}</p>
                <span class="text-xs text-muted shrink-0">{{ dateTime(msg.createdAt) }}</span>
              </div>
              <p class="text-sm text-muted">{{ msg.name }} · {{ msg.email }}</p>
              <p class="text-sm line-clamp-1">{{ msg.message }}</p>
            </div>
          </li>
        </ul>
      </div>

      <div v-else>
        <div class="mb-4 flex flex-wrap items-center gap-3">
          <UInput v-model="chatSearch" icon="i-lucide-search" placeholder="Email, nom, sujet..." class="w-72" />
          <USelect v-model="chatStatus" :items="chatStatusItems" class="w-48" />
        </div>
        <div v-if="!chats?.data?.length" class="py-12 text-center text-sm text-muted">Aucune conversation.</div>
        <ul v-else class="divide-y divide-default">
          <li
            v-for="session in chats.data"
            :key="session.id"
            class="flex cursor-pointer items-start gap-3 py-3 first:pt-0 last:pb-0 hover:bg-elevated/50 -mx-2 px-2 rounded-md"
            @click="openChat(session)"
          >
            <UIcon name="i-lucide-message-square" class="size-4 mt-1" :class="session.isRead ? 'text-muted' : 'text-primary'" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-3">
                <p class="font-medium">{{ session.identity }}</p>
                <span class="text-xs text-muted shrink-0">{{ dateTime(session.createdAt) }}</span>
              </div>
              <p class="text-sm text-muted">{{ session.subject || 'Conversation chatbot' }}</p>
              <div class="mt-1 flex items-center gap-2">
                <UBadge v-if="session.escalated" color="warning" variant="subtle">Escaladée</UBadge>
                <UBadge v-if="!session.isRead" color="primary" variant="subtle">Non lu</UBadge>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </UCard>

    <USlideover v-model:open="contactOpen" :ui="{ content: 'w-full md:max-w-xl' }">
      <template #content>
        <div class="flex h-full flex-col">
          <div class="border-b border-default p-4">
            <h2 class="font-semibold text-lg">{{ selectedContact?.subject }}</h2>
            <p class="text-sm text-muted">{{ selectedContact?.name }} · {{ selectedContact?.email }}</p>
            <p class="text-xs text-muted">{{ selectedContact ? dateTime(selectedContact.createdAt) : '' }}</p>
          </div>
          <div class="flex-1 overflow-y-auto p-4 whitespace-pre-line text-sm">
            {{ selectedContact?.message }}
          </div>
          <div class="border-t border-default p-4 flex justify-between items-center">
            <UButton
              :icon="selectedContact?.isRead ? 'i-lucide-mail' : 'i-lucide-mail-open'"
              variant="ghost"
              color="neutral"
              :label="selectedContact?.isRead ? 'Marquer non lu' : 'Marquer lu'"
              :disabled="!selectedContact"
              @click="selectedContact && toggleContactRead(selectedContact)"
            />
            <UButton
              v-if="selectedContact"
              :to="`mailto:${selectedContact.email}?subject=Re: ${encodeURIComponent(selectedContact.subject)}`"
              icon="i-lucide-reply"
              color="primary"
              label="Répondre par email"
            />
          </div>
        </div>
      </template>
    </USlideover>

    <USlideover v-model:open="chatOpen" :ui="{ content: 'w-full md:max-w-2xl' }">
      <template #content>
        <div class="flex h-full flex-col">
          <div class="border-b border-default p-4">
            <h2 class="font-semibold text-lg">{{ selectedChat?.identity || selectedChat?.visitorEmail || 'Conversation' }}</h2>
            <p class="text-sm text-muted">
              {{ selectedChat?.subject || 'Conversation chatbot' }} ·
              {{ selectedChat ? dateTime(selectedChat.createdAt) : '' }}
            </p>
            <div class="mt-2 flex items-center gap-2">
              <UBadge v-if="selectedChat?.escalated" color="warning" variant="subtle">Escaladée</UBadge>
              <UBadge v-if="selectedChat?.visitorEmail" color="primary" variant="subtle">{{ selectedChat.visitorEmail }}</UBadge>
            </div>
            <div class="mt-3 flex gap-2">
              <UButton
                v-if="selectedChat && !selectedChat.operatorId"
                @click="takeoverFromMessages"
                size="sm"
                color="primary"
              >
                Prendre en charge
              </UButton>
              <UButton
                v-if="selectedChat?.operatorId"
                @click="handbackFromMessages"
                size="sm"
                color="gray"
              >
                Rendre au bot
              </UButton>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            <div
              v-for="msg in chatTranscript"
              :key="msg.id"
              class="flex"
              :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
            >
              <div class="max-w-[85%]">
                <p class="text-xs text-muted mb-1" :class="msg.role === 'user' ? 'text-right' : ''">
                  <UBadge :color="roleColor[msg.role] ?? 'neutral'" variant="subtle" size="sm">{{ roleLabel[msg.role] ?? msg.role }}</UBadge>
                  <span class="ml-2">{{ dateTime(msg.createdAt) }}</span>
                </p>
                <div
                  class="whitespace-pre-line rounded-2xl px-3 py-2 text-sm shadow-sm"
                  :class="msg.role === 'user' ? 'bg-primary text-inverted' : msg.role === 'agent' ? 'bg-warning/10' : 'bg-elevated'"
                >
                  {{ msg.content }}
                </div>
              </div>
            </div>
          </div>
          <div class="border-t border-default p-4">
            <UTextarea v-model="replyDraft" :rows="3" placeholder="Réponse du conseiller..." class="w-full" />
            <div class="mt-2 flex justify-end gap-2">
              <UButton :loading="replying" :disabled="!replyDraft.trim()" icon="i-lucide-send" label="Répondre" @click="sendReply" />
            </div>
          </div>
        </div>
      </template>
    </USlideover>
  </div>
</template>
