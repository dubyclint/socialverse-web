import { Redis } from '@upstash/redis'
import { useRuntimeConfig } from '#imports'

let client: Redis | null = null
let resolved = false

/**
 * Upstash Redis over REST. Returns null when no credentials are configured so
 * callers fall back to Postgres — Supabase remains the source of truth and
 * Redis only holds short-lived derived state (presence, cached reads).
 */
export function getRedis(): Redis | null {
  if (resolved) return client

  resolved = true
  const config = useRuntimeConfig()
  const url = config.upstashRedisRestUrl
  const token = config.upstashRedisRestToken
  if (!url || !token) return null

  client = new Redis({ url, token })
  return client
}

export const PRESENCE_TTL_SECONDS = 60

export function presenceKey(userId: string) {
  return `viorp:presence:${userId}`
}
