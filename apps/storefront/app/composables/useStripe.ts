import { loadStripe, type Stripe } from '@stripe/stripe-js'

let cached: Promise<Stripe | null> | null = null

export function useStripe() {
  const config = useRuntimeConfig()
  const key = config.public.stripePublishableKey

  if (!cached && key) {
    cached = loadStripe(key)
  }

  return {
    publishableKey: key,
    getStripe: () => (cached ?? Promise.resolve(null)),
  }
}
