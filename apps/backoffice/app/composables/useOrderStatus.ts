import type { OrderStatus } from '~/composables/useApiTypes'

const STATUS_META: Record<OrderStatus, { label: string, color: 'warning' | 'primary' | 'success' | 'error' | 'neutral' }> = {
  pending: { label: 'En attente', color: 'warning' },
  paid: { label: 'Payée', color: 'primary' },
  processing: { label: 'En préparation', color: 'primary' },
  shipped: { label: 'Expédiée', color: 'primary' },
  delivered: { label: 'Livrée', color: 'success' },
  cancelled: { label: 'Annulée', color: 'error' },
  refunded: { label: 'Remboursée', color: 'neutral' }
}

export function useOrderStatus() {
  return {
    statuses: Object.keys(STATUS_META) as OrderStatus[],
    label: (status: string) => STATUS_META[status as OrderStatus]?.label ?? status,
    color: (status: string) => STATUS_META[status as OrderStatus]?.color ?? 'neutral'
  }
}
