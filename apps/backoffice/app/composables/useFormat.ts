const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2
})

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit'
})

export function useFormat() {
  return {
    currency: (value: number | string) => currencyFormatter.format(Number(value || 0)),
    dateTime: (value: string | Date) => dateFormatter.format(new Date(value))
  }
}
