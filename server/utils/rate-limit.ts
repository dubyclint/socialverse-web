import { createError, getRequestIP, type H3Event } from 'h3'

export interface RateLimitRule {
  /** Requests allowed inside the window, per identity. */
  limit: number
  windowMs: number
  /** Applies the rule to the caller's IP as well as their user id. */
  perIp?: boolean
}

interface Counter {
  count: number
  resetAt: number
}

/**
 * Fixed-window counters. Process-local today; the interface is deliberately the
 * one Redis/Redlock would implement, so swapping the store is a single change
 * here rather than at every call site.
 */
export interface RateLimitStore {
  hit(key: string, windowMs: number): Promise<Counter>
}

class MemoryStore implements RateLimitStore {
  private readonly counters = new Map<string, Counter>()

  async hit(key: string, windowMs: number): Promise<Counter> {
    const now = Date.now()
    const existing = this.counters.get(key)

    if (!existing || now >= existing.resetAt) {
      const fresh = { count: 1, resetAt: now + windowMs }
      this.counters.set(key, fresh)
      if (this.counters.size > 10000) this.sweep(now)
      return fresh
    }

    existing.count += 1
    return existing
  }

  private sweep(now: number): void {
    for (const [key, counter] of this.counters) {
      if (now >= counter.resetAt) this.counters.delete(key)
    }
  }
}

let store: RateLimitStore = new MemoryStore()

export function setRateLimitStore(next: RateLimitStore): void {
  store = next
}

/**
 * Enforces a rule against the authenticated user and, when `perIp` is set, the
 * source address too — so an abusive client cannot spread load across accounts.
 */
export async function enforceRateLimit(
  event: H3Event,
  scope: string,
  rule: RateLimitRule,
  userId?: string
): Promise<void> {
  const identities: string[] = []
  if (userId) identities.push(`user:${userId}`)
  if (rule.perIp !== false) {
    const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
    identities.push(`ip:${ip}`)
  }

  for (const identity of identities) {
    const counter = await store.hit(`${scope}:${identity}`, rule.windowMs)
    if (counter.count > rule.limit) {
      const retryAfter = Math.ceil((counter.resetAt - Date.now()) / 1000)
      setResponseHeader(event, 'Retry-After', Math.max(retryAfter, 1))
      throw createError({ statusCode: 429, statusMessage: 'Too many requests. Please slow down.' })
    }
  }
}
