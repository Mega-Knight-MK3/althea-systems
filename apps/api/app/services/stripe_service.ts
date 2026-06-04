import Stripe from 'stripe'
import env from '#start/env'

let client: Stripe | null = null

/**
 * Zero-decimal currencies that don't use cents/minor units
 * See: https://docs.stripe.com/currencies#zero-decimal
 */
const ZERO_DECIMAL_CURRENCIES = new Set([
  'bif',
  'clp',
  'djf',
  'gnf',
  'jpy',
  'kmf',
  'krw',
  'mga',
  'pyg',
  'rwf',
  'ugx',
  'vnd',
  'vuv',
  'xaf',
  'xof',
  'xpf',
])

export function stripeClient(): Stripe {
  const key = env.get('STRIPE_SECRET_KEY')
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  if (!client) {
    client = new Stripe(key, {
      apiVersion: '2024-12-18',
      typescript: true,
    })
  }
  return client
}

export function stripeCurrency(): string {
  return env.get('STRIPE_CURRENCY', 'eur')
}

/**
 * Converts amount to Stripe's minor units (cents for most currencies)
 * Handles zero-decimal currencies correctly (JPY, KRW, etc.)
 */
export function toMinorUnits(amount: number): number {
  const currency = stripeCurrency().toLowerCase()
  if (ZERO_DECIMAL_CURRENCIES.has(currency)) {
    return Math.round(amount)
  }
  return Math.round(amount * 100)
}

/**
 * Converts from Stripe minor units back to major units
 */
export function fromMinorUnits(amount: number): number {
  const currency = stripeCurrency().toLowerCase()
  if (ZERO_DECIMAL_CURRENCIES.has(currency)) {
    return amount
  }
  return amount / 100
}
