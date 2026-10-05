import { ref } from 'vue'

/**
 * Offline-first post engagement: counts are mirrored on the device so they
 * never drop to zero on a bad connection, actions apply optimistically, and
 * anything that can't reach the server is queued and replayed on reconnect.
 * Every queued action is idempotent server-side (desired like state, client
 * comment ids), so replays never double-count.
 */

export interface PostMetrics {
  likes: number
  comments: number
  shares: number
  liked: boolean
  at: number
}

export interface QueuedComment {
  clientId: string
  content: string
  parentId: string | null
  createdAt: string
}

type EngagementAction =
  | { kind: 'like', postId: string, liked: boolean }
  | { kind: 'share', postId: string, shareId: string }
  | ({ kind: 'comment', postId: string } & QueuedComment)

type QueuedAction = EngagementAction & { attempts: number }

export type PerformResult<T> =
  | { status: 'synced', data: T }
  | { status: 'queued' }
  | { status: 'failed', message: string }

const QUEUE_KEY = 'viorp:engagement-queue:v1'
const METRICS_KEY = 'viorp:post-metrics:v1'
const MAX_METRICS = 500
const SYNC_TAG = 'engagement-sync'

const readJson = <T>(key: string, fallback: T): T => {
  if (!import.meta.client) return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const writeJson = (key: string, value: unknown) => {
  if (!import.meta.client) return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or unavailable: the in-memory state still works.
  }
}

const queue = ref<QueuedAction[]>(readJson<QueuedAction[]>(QUEUE_KEY, []))
const metrics = new Map<string, PostMetrics>(Object.entries(readJson<Record<string, PostMetrics>>(METRICS_KEY, {})))
let flushing: Promise<void> | null = null
let listenersBound = false

const persistQueue = () => writeJson(QUEUE_KEY, queue.value)

const persistMetrics = () => {
  if (metrics.size > MAX_METRICS) {
    const oldest = [...metrics.entries()].sort((a, b) => a[1].at - b[1].at).slice(0, metrics.size - MAX_METRICS)
    oldest.forEach(([postId]) => metrics.delete(postId))
  }
  writeJson(METRICS_KEY, Object.fromEntries(metrics))
}

const statusOf = (err: unknown): number | undefined => {
  const value = err as { statusCode?: number, status?: number, response?: { status?: number } } | null
  return value?.statusCode ?? value?.status ?? value?.response?.status
}

/** Offline, timeouts, rate limits and server errors are worth retrying; 4xx are not. */
const isRetryable = (err: unknown) => {
  const status = statusOf(err)
  return !status || status >= 500 || status === 408 || status === 429
}

const messageOf = (err: unknown) => {
  const value = err as { data?: { statusMessage?: string, message?: string }, statusMessage?: string, message?: string } | null
  return value?.data?.statusMessage || value?.data?.message || value?.statusMessage || value?.message || 'Request failed'
}

const send = (action: EngagementAction) => {
  if (action.kind === 'like') {
    return $fetch<{ success: boolean, data: { liked: boolean, likesCount: number } }>(
      `/api/posts/${action.postId}/like`,
      { method: 'POST', body: { liked: action.liked } }
    )
  }
  if (action.kind === 'share') {
    return $fetch<{ success: boolean, data: { shareUrl: string, sharesCount: number } }>(
      `/api/posts/${action.postId}/share`,
      { method: 'POST', body: { platform: 'copy' } }
    )
  }
  return $fetch<{ success: boolean, data: unknown, commentsCount: number }>(
    `/api/posts/${action.postId}/comments`,
    { method: 'POST', body: { content: action.content, parentId: action.parentId ?? undefined, clientId: action.clientId } }
  )
}

const requestBackgroundSync = async () => {
  if (!import.meta.client || !('serviceWorker' in navigator)) return
  try {
    const registration = await navigator.serviceWorker.ready
    const sync = (registration as ServiceWorkerRegistration & { sync?: { register: (tag: string) => Promise<void> } }).sync
    await sync?.register(SYNC_TAG)
  } catch {
    // Background Sync is unsupported (iOS, Firefox): online/visibility listeners cover it.
  }
}

const enqueue = (action: EngagementAction) => {
  // Only the latest desired like state matters.
  const rest = action.kind === 'like'
    ? queue.value.filter(item => !(item.kind === 'like' && item.postId === action.postId))
    : queue.value
  queue.value = [...rest, { ...action, attempts: 0 }]
  persistQueue()
  void requestBackgroundSync()
}

const flush = (): Promise<void> => {
  if (flushing || !queue.value.length) return flushing ?? Promise.resolve()
  if (import.meta.client && navigator.onLine === false) return Promise.resolve()

  flushing = (async () => {
    try {
      while (queue.value.length) {
        const [next] = queue.value
        if (!next) break
        try {
          await send(next)
        } catch (err) {
          if (isRetryable(err)) {
            next.attempts += 1
            persistQueue()
            return
          }
          // Rejected for good (post deleted, signed out, invalid): drop it.
        }
        queue.value = queue.value.slice(1)
        persistQueue()
      }
    } finally {
      flushing = null
    }
  })()
  return flushing
}

const bindListeners = () => {
  if (listenersBound || !import.meta.client) return
  listenersBound = true
  window.addEventListener('online', () => void flush())
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void flush()
  })
  navigator.serviceWorker?.addEventListener('message', (event: MessageEvent<{ type?: string }>) => {
    if (event.data?.type === SYNC_TAG) void flush()
  })
  setInterval(() => void flush(), 30_000)
  void flush()
}

export const useEngagementSync = () => {
  bindListeners()

  const readMetrics = (postId: string) => metrics.get(postId) ?? null

  const saveMetrics = (postId: string, value: Omit<PostMetrics, 'at'>) => {
    metrics.set(postId, { ...value, at: Date.now() })
    persistMetrics()
  }

  /** Actions for this post that haven't reached the server yet. */
  const pendingFor = (postId: string) => {
    const items = queue.value.filter(item => item.postId === postId)
    const like = items.find((item): item is QueuedAction & { kind: 'like' } => item.kind === 'like')
    return {
      liked: like?.liked,
      shares: items.filter(item => item.kind === 'share').length,
      comments: items.filter((item): item is QueuedAction & { kind: 'comment' } => item.kind === 'comment')
    }
  }

  /** Sends now; on a retryable failure the action is queued instead of lost. */
  const perform = async <T>(action: EngagementAction): Promise<PerformResult<T>> => {
    if (import.meta.client && navigator.onLine === false) {
      enqueue(action)
      return { status: 'queued' }
    }
    try {
      const data = (await send(action)) as T
      void flush()
      return { status: 'synced', data }
    } catch (err) {
      if (isRetryable(err)) {
        enqueue(action)
        return { status: 'queued' }
      }
      return { status: 'failed', message: messageOf(err) }
    }
  }

  return { queue, readMetrics, saveMetrics, pendingFor, perform, flush }
}
