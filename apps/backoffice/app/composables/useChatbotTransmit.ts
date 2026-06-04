import { ref } from 'vue'
import { io, Socket } from 'socket.io-client'

interface ChatbotMessage {
  id: number
  sessionId: number
  role: 'user' | 'bot' | 'agent'
  content: string
  createdAt: string
}

interface ChatbotSession {
  sessionId: number
  visitorName: string | null
  visitorEmail: string | null
  subject: string | null
  escalatedAt: string
}

export function useChatbotTransmit() {
  const config = useRuntimeConfig()
  const { token } = useAdminAuth()
  const socket = ref<Socket | null>(null)

  function subscribeToOperatorChannel(callbacks: {
    onEscalation: (session: ChatbotSession) => void
  }) {
    const socketUrl = config.public.apiBase.replace(/^http/, 'ws')

    socket.value = io(socketUrl, {
      auth: {
        token: token.value?.value
      },
      transports: ['websocket', 'polling']
    })

    socket.value.on('connect', () => {
      console.log('Operator socket connected')
      socket.value?.emit('join', 'operators')
    })

    socket.value.on('session:escalated', (session: ChatbotSession) => {
      callbacks.onEscalation(session)
    })

    socket.value.on('error', (error: any) => {
      console.error('Operator channel connection error:', error)
    })
  }

  function subscribeToSession(sessionId: number, onMessage: (msg: ChatbotMessage) => void) {
    if (socket.value) {
      socket.value.emit('join', `session:${sessionId}`)

      socket.value.on('message:new', (message: ChatbotMessage) => {
        onMessage(message)
      })
    }
  }

  function unsubscribeAll() {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
    }
  }

  return { subscribeToOperatorChannel, subscribeToSession, unsubscribeAll }
}
