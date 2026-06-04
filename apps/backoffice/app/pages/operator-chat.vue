<template>
  <div class="flex h-screen">
    <aside class="w-80 border-r bg-white">
      <div class="border-b p-4">
        <h2 class="text-lg font-semibold">Active Chats</h2>
        <UBadge v-if="unreadCount > 0" color="primary" class="mt-2">{{ unreadCount }} new</UBadge>
      </div>
      <div class="overflow-y-auto" style="height: calc(100vh - 80px)">
        <ul>
          <li
            v-for="session in sessions"
            :key="session.id"
            @click="openSession(session)"
            class="cursor-pointer border-b p-4 hover:bg-gray-50"
            :class="{ 'bg-blue-50': selectedSession?.id === session.id }"
          >
            <p class="font-medium">{{ session.identity }}</p>
            <p class="text-sm text-gray-600">{{ session.subject || 'Conversation chatbot' }}</p>
            <div class="mt-2 flex gap-2">
              <UBadge v-if="session.escalated" color="warning" size="xs">Escalated</UBadge>
              <UBadge v-if="session.operatorId" color="green" size="xs">Taken</UBadge>
              <UBadge v-if="!session.isRead" color="primary" size="xs">Unread</UBadge>
            </div>
          </li>
        </ul>
        <div v-if="sessions.length === 0" class="p-4 text-center text-gray-500">
          No active chats
        </div>
      </div>
    </aside>

    <main v-if="selectedSession" class="flex flex-1 flex-col bg-gray-50">
      <header class="border-b bg-white p-4">
        <h3 class="text-lg font-semibold">{{ selectedSession.identity }}</h3>
        <p class="text-sm text-gray-600">{{ selectedSession.visitorEmail }}</p>
        <div class="mt-3 flex gap-2">
          <UButton
            v-if="!selectedSession.operatorId || selectedSession.operatorId !== user?.id"
            @click="takeover"
            :loading="takingOver"
            color="primary"
          >
            Take Over
          </UButton>
          <UButton
            v-if="selectedSession.operatorId === user?.id"
            @click="handback"
            :loading="handingBack"
            color="gray"
          >
            Hand Back to Bot
          </UButton>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto p-4">
        <div v-for="msg in transcript" :key="msg.id" class="mb-4 flex" :class="msg.role === 'user' ? 'justify-end' : 'justify-start'">
          <div class="max-w-xs">
            <div class="mb-1 flex items-center gap-2 text-xs text-gray-500">
              <UBadge :color="msg.role === 'user' ? 'blue' : msg.role === 'agent' ? 'green' : 'gray'" size="xs">
                {{ msg.role === 'user' ? 'Customer' : msg.role === 'agent' ? 'Agent' : 'Bot' }}
              </UBadge>
              <span>{{ formatDateTime(msg.createdAt) }}</span>
            </div>
            <div
              class="rounded-lg p-3"
              :class="{
                'bg-blue-500 text-white': msg.role === 'user',
                'bg-green-100 text-green-900': msg.role === 'agent',
                'bg-white text-gray-900': msg.role === 'bot'
              }"
            >
              {{ msg.content }}
            </div>
          </div>
        </div>
      </div>

      <form @submit.prevent="sendMessage" class="border-t bg-white p-4">
        <div class="flex gap-2">
          <UInput
            v-model="draft"
            placeholder="Type your message..."
            class="flex-1"
            :disabled="sending || !selectedSession.operatorId || selectedSession.operatorId !== user?.id"
          />
          <UButton
            type="submit"
            :loading="sending"
            :disabled="!draft.trim() || !selectedSession.operatorId || selectedSession.operatorId !== user?.id"
          >
            Send
          </UButton>
        </div>
      </form>
    </main>

    <div v-else class="flex flex-1 items-center justify-center text-gray-500">
      Select a chat to start
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['admin-auth']
})

const api = useApi()
const { user } = useAdminAuth()
const transmit = useChatbotTransmit()
const toast = useToast()

const sessions = ref<any[]>([])
const selectedSession = ref<any | null>(null)
const transcript = ref<any[]>([])
const draft = ref('')
const unreadCount = ref(0)
const sending = ref(false)
const takingOver = ref(false)
const handingBack = ref(false)

async function fetchSessions() {
  try {
    const response = await api<any>('/admin/chatbot/sessions', {
      params: { status: 'escalated', perPage: 100 }
    })
    sessions.value = response.data.map((s: any) => ({
      ...s,
      identity: s.visitorName || s.visitorEmail || s.user?.email || 'Anonymous'
    }))
    unreadCount.value = sessions.value.filter(s => !s.isRead).length
  } catch (error) {
    console.error('Failed to fetch sessions:', error)
  }
}

async function openSession(session: any) {
  selectedSession.value = session
  try {
    const response = await api<any>(`/admin/chatbot/sessions/${session.id}`)
    transcript.value = response.messages

    transmit.subscribeToSession(session.id, (message) => {
      transcript.value.push(message)
    })
  } catch (error) {
    console.error('Failed to load session:', error)
    toast.add({ color: 'error', title: 'Failed to load chat' })
  }
}

async function takeover() {
  if (!selectedSession.value) return
  takingOver.value = true
  try {
    const response = await api<any>(`/admin/chatbot/sessions/${selectedSession.value.id}/takeover`, {
      method: 'POST'
    })
    selectedSession.value = { ...selectedSession.value, ...response.session }
    toast.add({ color: 'success', title: 'Session taken over' })
  } catch (error: any) {
    toast.add({ color: 'error', title: error.data?.message || 'Failed to take over session' })
  } finally {
    takingOver.value = false
  }
}

async function handback() {
  if (!selectedSession.value) return
  handingBack.value = true
  try {
    const response = await api<any>(`/admin/chatbot/sessions/${selectedSession.value.id}/handback`, {
      method: 'POST'
    })
    selectedSession.value = { ...selectedSession.value, ...response.session }
    toast.add({ color: 'success', title: 'Handed back to bot' })
  } catch (error) {
    toast.add({ color: 'error', title: 'Failed to hand back session' })
  } finally {
    handingBack.value = false
  }
}

async function sendMessage() {
  if (!selectedSession.value || !draft.value.trim()) return
  sending.value = true
  try {
    const response = await api<any>(`/admin/chatbot/sessions/${selectedSession.value.id}/reply`, {
      method: 'POST',
      body: { content: draft.value }
    })
    transcript.value.push(response.message)
    draft.value = ''
    toast.add({ color: 'success', title: 'Message sent' })
  } catch (error) {
    toast.add({ color: 'error', title: 'Failed to send message' })
  } finally {
    sending.value = false
  }
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(async () => {
  await fetchSessions()

  transmit.subscribeToOperatorChannel({
    onEscalation: (session) => {
      sessions.value.unshift({
        ...session,
        identity: session.visitorName || session.visitorEmail || 'Anonymous'
      })
      unreadCount.value++
      toast.add({ color: 'primary', title: 'New escalated chat!' })
    }
  })
})

onUnmounted(() => {
  transmit.unsubscribeAll()
})
</script>
