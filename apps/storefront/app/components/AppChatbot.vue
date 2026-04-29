<script setup lang="ts">
interface ChatbotMessage {
  id: number
  role: 'user' | 'bot' | 'agent'
  content: string
  intent: string | null
  createdAt: string
}

interface ChatbotSession {
  id: number
  visitorName: string | null
  visitorEmail: string | null
  subject: string | null
  escalated: boolean
}

interface FaqShortcut {
  intent: string
  label: string
}

const SESSION_KEY = 'althea_chatbot_session'

const api = useApi()
const { user } = useAuth()

const open = ref(false)
const initialising = ref(false)
const sending = ref(false)
const escalating = ref(false)
const session = ref<ChatbotSession | null>(null)
const messages = ref<ChatbotMessage[]>([])
const shortcuts = ref<FaqShortcut[]>([])
const draft = ref('')
const escalateForm = reactive({
  name: user.value?.fullName ?? '',
  email: user.value?.email ?? '',
  subject: ''
})
const showEscalation = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)

async function ensureSession() {
  if (session.value) return
  if (initialising.value) return
  initialising.value = true
  try {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as { session: ChatbotSession, messages: ChatbotMessage[], shortcuts: FaqShortcut[] }
      session.value = parsed.session
      messages.value = parsed.messages
      shortcuts.value = parsed.shortcuts
      return
    }
    const result = await api<{ session: ChatbotSession, messages: ChatbotMessage[], faqShortcuts: FaqShortcut[] }>(
      '/chatbot/sessions',
      {
        method: 'POST',
        body: {
          name: user.value?.fullName ?? undefined,
          email: user.value?.email ?? undefined
        }
      }
    )
    session.value = result.session
    messages.value = result.messages
    shortcuts.value = result.faqShortcuts
    persist()
  } finally {
    initialising.value = false
  }
}

function persist() {
  if (!session.value) return
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ session: session.value, messages: messages.value, shortcuts: shortcuts.value })
  )
}

async function toggle() {
  open.value = !open.value
  if (open.value) {
    await ensureSession()
    await nextTick()
    scrollToBottom()
  }
}

async function send(content: string) {
  if (!session.value || sending.value || !content.trim()) return
  sending.value = true
  try {
    const result = await api<{ messages: ChatbotMessage[], session?: ChatbotSession }>(
      `/chatbot/sessions/${session.value.id}/messages`,
      { method: 'POST', body: { content } }
    )
    messages.value = [...messages.value, ...result.messages]
    if (result.session) session.value = result.session
    persist()
    if (session.value?.escalated && !session.value.visitorEmail) showEscalation.value = true
    await nextTick()
    scrollToBottom()
  } catch (err) {
    console.error(err)
  } finally {
    sending.value = false
  }
}

async function submitDraft() {
  const content = draft.value.trim()
  if (!content) return
  draft.value = ''
  await send(content)
}

async function submitEscalation() {
  if (!session.value || escalating.value) return
  if (!/^.+@.+\..+$/.test(escalateForm.email)) return
  escalating.value = true
  try {
    const result = await api<{ session: ChatbotSession, message: ChatbotMessage }>(
      `/chatbot/sessions/${session.value.id}/escalate`,
      {
        method: 'POST',
        body: {
          name: escalateForm.name || undefined,
          email: escalateForm.email,
          subject: escalateForm.subject || undefined
        }
      }
    )
    session.value = result.session
    messages.value = [...messages.value, result.message]
    persist()
    showEscalation.value = false
    await nextTick()
    scrollToBottom()
  } finally {
    escalating.value = false
  }
}

function scrollToBottom() {
  const el = messagesContainer.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

function reset() {
  sessionStorage.removeItem(SESSION_KEY)
  session.value = null
  messages.value = []
  shortcuts.value = []
  showEscalation.value = false
  ensureSession()
}

const SHORTCUT_QUERIES: Record<string, string> = {
  'address-change': 'Comment changer mon adresse de livraison ?',
  'payment-methods': 'Quels moyens de paiement acceptez-vous ?',
  'shipping-delay': 'Quels sont les délais de livraison ?',
  'return-policy': 'Comment retourner un produit ?',
  'invoice': 'Où trouver mes factures ?',
  'account': 'Comment créer un compte ?'
}

function quickAsk(intent: string) {
  const q = SHORTCUT_QUERIES[intent] ?? intent
  send(q)
}
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 md:bottom-6 md:right-6">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-2 opacity-0"
    >
      <section
        v-if="open"
        class="flex w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-xl"
        style="height: min(540px, calc(100vh - 6rem))"
      >
        <header class="flex items-center justify-between gap-3 border-b border-neutral-100 bg-brand-text px-4 py-3 text-white">
          <div>
            <p class="text-sm font-semibold">Assistant Althea</p>
            <p class="text-xs opacity-80">{{ session?.escalated ? 'Conseiller mobilisé' : 'Réponses instantanées' }}</p>
          </div>
          <div class="flex items-center gap-1">
            <button
              v-if="session"
              type="button"
              class="rounded-md p-1 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Réinitialiser"
              @click="reset"
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 4v5h5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button
              type="button"
              class="rounded-md p-1 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Fermer"
              @click="open = false"
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M6 18 18 6" stroke-linecap="round"/></svg>
            </button>
          </div>
        </header>

        <div ref="messagesContainer" class="flex-1 overflow-y-auto bg-brand-50/40 px-4 py-3">
          <div v-for="msg in messages" :key="msg.id" class="mb-3 flex" :class="msg.role === 'user' ? 'justify-end' : 'justify-start'">
            <div
              class="max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm shadow-sm"
              :class="msg.role === 'user' ? 'bg-brand-500 text-white' : msg.role === 'agent' ? 'bg-amber-100 text-amber-900' : 'bg-white text-neutral-800'"
            >
              {{ msg.content }}
            </div>
          </div>

          <div v-if="!session?.escalated && shortcuts.length" class="mt-2 flex flex-wrap gap-2">
            <button
              v-for="s in shortcuts"
              :key="s.intent"
              type="button"
              class="rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-medium text-brand-text transition-colors hover:bg-brand-100"
              @click="quickAsk(s.intent)"
            >
              {{ s.label }}
            </button>
          </div>
        </div>

        <div v-if="showEscalation" class="border-t border-neutral-100 bg-brand-50 px-4 py-3">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-text">Transmettre à un conseiller</p>
          <div class="space-y-2">
            <input
              v-model="escalateForm.name"
              type="text"
              placeholder="Nom (optionnel)"
              class="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm outline-none focus:border-brand-400"
            />
            <input
              v-model="escalateForm.email"
              type="email"
              placeholder="Email (requis)"
              required
              class="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm outline-none focus:border-brand-400"
            />
            <input
              v-model="escalateForm.subject"
              type="text"
              placeholder="Sujet (optionnel)"
              class="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm outline-none focus:border-brand-400"
            />
            <button
              type="button"
              :disabled="escalating"
              class="w-full rounded-md bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
              @click="submitEscalation"
            >
              {{ escalating ? 'Envoi...' : 'Envoyer au conseiller' }}
            </button>
          </div>
        </div>

        <form class="flex items-center gap-2 border-t border-neutral-100 bg-white px-3 py-2" @submit.prevent="submitDraft">
          <input
            v-model="draft"
            type="text"
            :disabled="sending || initialising"
            placeholder="Posez votre question..."
            class="flex-1 rounded-md border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
          <button
            type="submit"
            :disabled="sending || !draft.trim()"
            class="rounded-md bg-brand-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
            aria-label="Envoyer"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12 20 4l-7 16-2-7-7-1Z" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </form>
      </section>
    </Transition>

    <button
      type="button"
      class="flex items-center gap-2 rounded-full bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-brand-600"
      :aria-expanded="open"
      @click="toggle"
    >
      <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 11a8.5 8.5 0 0 1-12.5 7.5L3 21l1.6-4.5A8.5 8.5 0 1 1 21 11Z" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="hidden sm:inline">{{ open ? 'Réduire' : 'Contactez-nous' }}</span>
    </button>
  </div>
</template>
