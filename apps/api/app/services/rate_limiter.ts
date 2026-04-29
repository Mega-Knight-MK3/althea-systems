interface Bucket {
  hits: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export interface RateLimitOptions {
  max: number
  windowMs: number
}

export interface RateLimitOutcome {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

export function consume(key: string, options: RateLimitOptions): RateLimitOutcome {
  const now = Date.now()
  const existing = buckets.get(key)
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { hits: 1, resetAt: now + options.windowMs })
    return { allowed: true, remaining: options.max - 1, retryAfterSeconds: 0 }
  }

  if (existing.hits >= options.max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    }
  }

  existing.hits += 1
  return {
    allowed: true,
    remaining: options.max - existing.hits,
    retryAfterSeconds: 0,
  }
}

export function reset(key: string) {
  buckets.delete(key)
}

export function clearAll() {
  buckets.clear()
}
