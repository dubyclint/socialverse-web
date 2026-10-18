import { useState } from '#imports'

const REFRESH_MS = 45_000
let pending = new Set<string>()
let flushTimer: ReturnType<typeof setTimeout> | null = null
const lastFetched = new Map<string, number>()

/**
 * Shared online-state cache. Components ask for ids; requests made in the same
 * tick are batched into one call to /api/presence/batch and refreshed while in use.
 */
export const useOnlineStatus = () => {
  const online = useState<Record<string, boolean>>('presence-online', () => ({}))

  const flush = async () => {
    flushTimer = null
    const ids = [...pending].slice(0, 100)
    pending = new Set([...pending].slice(100))
    if (!ids.length) return
    const now = Date.now()
    for (const id of ids) lastFetched.set(id, now)
    try {
      const res = await $fetch<{ online: Record<string, boolean> }>('/api/presence/batch', { method: 'POST', body: { ids } })
      online.value = { ...online.value, ...res.online }
    } catch {
      for (const id of ids) lastFetched.delete(id)
    }
    if (pending.size) flushTimer = setTimeout(flush, 0)
  }

  const watchUser = (id: string | null | undefined) => {
    if (!id || import.meta.server) return
    const fetchedAt = lastFetched.get(id) ?? 0
    if (Date.now() - fetchedAt < REFRESH_MS) return
    pending.add(id)
    if (!flushTimer) flushTimer = setTimeout(flush, 50)
  }

  const isOnline = (id: string | null | undefined) => Boolean(id && online.value[id])

  return { online, watchUser, isOnline }
}
