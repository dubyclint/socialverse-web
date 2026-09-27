import { PresenceModel } from '~/server/models/status'
import { getRedis, presenceKey } from '~/server/utils/redis'

/** A presence row counts as online only while it keeps being refreshed. */
const STALE_AFTER_MS = 2 * 60 * 1000

/**
 * Online state for a user. Redis holds the live heartbeat when configured;
 * otherwise the persisted `user_presence` row is used, treating rows that
 * stopped being refreshed as offline.
 */
export async function checkPresence(userId: string): Promise<boolean> {
  if (!userId) return false

  const redis = getRedis()
  if (redis) {
    try {
      const value = await redis.get<string>(presenceKey(userId))
      if (value) return true
    } catch (error) {
      console.error('[presence] redis lookup failed, falling back to database:', error)
    }
  }

  try {
    const presence = await PresenceModel.getPresence(userId)
    if (!presence || presence.status === 'offline') return false

    const updatedAt = presence.updated_at ? new Date(presence.updated_at).getTime() : 0
    return Date.now() - updatedAt < STALE_AFTER_MS
  } catch {
    return false
  }
}

/** Refreshes the heartbeat for a user; called by the presence ping endpoint. */
export async function markPresence(userId: string): Promise<void> {
  const redis = getRedis()
  if (redis) {
    try {
      await redis.set(presenceKey(userId), 'online', { ex: 60 })
    } catch (error) {
      console.error('[presence] redis heartbeat failed:', error)
    }
  }

  await PresenceModel.updatePresence(userId, 'online')
}
