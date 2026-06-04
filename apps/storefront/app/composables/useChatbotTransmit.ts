import { ref } from 'vue'
import { io, Socket } from 'socket.io-client'

interface ChatbotMessage {
  id: number
  sessionId: number
  role: 'user' | 'bot' | 'agent'
  content: string
  createdAt: string
}

interface TakeoverData {
  operatorName: string
  operatorId: number
}

interface ChatbotCallbacks {
  onMessage: (message: ChatbotMessage) => void
  onTakeover: (data: TakeoverData) => void
  onHandback: () => void
}

export function useChatbotTransmit() {
  const config = useRuntimeConfig()
  const { token } = useAuth()
  const socket = ref<Socket | null>(null)

  function subscribe(sessionId: number, callbacks: ChatbotCallbacks) {
    const socketUrl = config.public.apiBase.replace(/^http/, 'ws')

    socket.value = io(socketUrl, {
      auth: {
        token: token.value?.value
      },
      transports: ['websocket', 'polling']
    })

    socket.value.on('connect', () => {
      console.log('Socket connected')
      socket.value?.emit('join', `session:${sessionId}`)
    })

    socket.value.on('message:new', (message: ChatbotMessage) => {
      callbacks.onMessage(message)
    })

    socket.value.on('takeover:started', (data: TakeoverData) => {
      callbacks.onTakeover(data)
    })

    socket.value.on('takeover:ended', () => {
      callbacks.onHandback()
    })

    socket.value.on('error', (error: any) => {
      console.error('Socket connection error:', error)
    })
  }

  function unsubscribe() {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
    }
  }

  return { subscribe, unsubscribe }
}
