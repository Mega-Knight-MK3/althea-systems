export type ToastTone = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  tone: ToastTone
  message: string
}

const TOAST_TIMEOUT_MS = 4000
let nextId = 0

export function useToast() {
  const toasts = useState<Toast[]>('toasts', () => [])

  function push(tone: ToastTone, message: string) {
    if (!message) return
    const id = ++nextId
    toasts.value = [...toasts.value, { id, tone, message }]
    if (import.meta.client) {
      setTimeout(() => dismiss(id), TOAST_TIMEOUT_MS)
    }
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  return {
    toasts,
    success: (message: string) => push('success', message),
    error: (message: string) => push('error', message),
    info: (message: string) => push('info', message),
    dismiss,
  }
}
