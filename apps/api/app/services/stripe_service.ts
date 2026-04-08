import Stripe from 'stripe'
import env from '#start/env'

let client: Stripe | null = null

export function stripeClient(): Stripe {
  const key = env.get('STRIPE_SECRET_KEY')
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  if (!client) {
    client = new Stripe(key)
  }
  return client
}

export function stripeCurrency(): string {
  return env.get('STRIPE_CURRENCY', 'eur')
}

export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100)
}
