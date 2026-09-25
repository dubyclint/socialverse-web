import { onScopeDispose } from 'vue'

export type FeedInteraction = 'view' | 'dwell' | 'like' | 'comment' | 'share' | 'profile_open' | 'hide'
export type FeedItemKind = 'post' | 'user' | 'stream' | 'ad'

interface TrackedItem {
  itemId: string
  itemType: FeedItemKind
  interactionType: FeedInteraction
}

const FLUSH_INTERVAL_MS = 4000
const MAX_BATCH = 50

/**
 * Buffers behaviour signals and posts them in batches. The ranker reads the
 * resulting `user_interactions` rows for author affinity and seen-suppression,
 * so an impression must never cost the scroll a request of its own.
 */
export const useFeedTracking = () => {
  const queue: TrackedItem[] = []
  const seen = new Set<string>()
  let timer: ReturnType<typeof setTimeout> | null = null

  const flush = async () => {
    timer = null
    if (!queue.length) return
    const items = queue.splice(0, MAX_BATCH)
    try {
      await $fetch('/api/feed/track', { method: 'POST', body: { items } })
    } catch {
      // Ranking signals are best-effort; a lost batch must not break the feed.
    }
  }

  const schedule = () => {
    if (timer) return
    timer = setTimeout(flush, FLUSH_INTERVAL_MS)
  }

  const track = (
    itemId: string,
    interactionType: FeedInteraction,
    itemType: FeedItemKind = 'post'
  ) => {
    if (!itemId) return
    queue.push({ itemId, itemType, interactionType })
    if (interactionType === 'view') schedule()
    else void flush()
  }

  /** Impressions are deduplicated for the lifetime of the feed session. */
  const trackImpression = (itemId: string, itemType: FeedItemKind = 'post') => {
    const key = `${itemType}:${itemId}`
    if (seen.has(key)) return
    seen.add(key)
    track(itemId, 'view', itemType)
  }

  onScopeDispose(() => {
    if (timer) clearTimeout(timer)
    void flush()
  })

  return { track, trackImpression, flush }
}
