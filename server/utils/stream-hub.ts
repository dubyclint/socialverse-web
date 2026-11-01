import { createHmac, timingSafeEqual } from 'node:crypto'
import { getServiceClient } from '~/server/utils/supabase-admin'

/**
 * In-process live room hub: WebRTC signalling, viewer presence, likes and
 * server-originated events (chat, gifts, moderation, end) for each stream.
 */
export type LiveRole = 'broadcaster' | 'viewer'

export interface LivePeer {
  key: string
  peerId: string
  userId: string
  role: LiveRole
  name: string
  avatar: string | null
  send: (payload: unknown) => void
  likeWindowStart: number
  likeWindowCount: number
}

export interface LiveRoom {
  streamId: string
  broadcaster: LivePeer | null
  viewers: Map<string, LivePeer>
  likes: number
  likesLoaded: boolean
  pendingLikes: number
  viewerTimer: ReturnType<typeof setTimeout> | null
}

const rooms = new Map<string, LiveRoom>()

const secret = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NUXT_SESSION_PASSWORD || 'viorp-live'

export const signLiveToken = (streamId: string, userId: string, role: LiveRole, ttlSeconds = 6 * 3600) => {
  const body = Buffer.from(JSON.stringify({ s: streamId, u: userId, r: role, e: Math.floor(Date.now() / 1000) + ttlSeconds })).toString('base64url')
  const sig = createHmac('sha256', secret()).update(body).digest('base64url')
  return `${body}.${sig}`
}

export const verifyLiveToken = (token: unknown, streamId: string): { userId: string, role: LiveRole } | null => {
  if (typeof token !== 'string') return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = createHmac('sha256', secret()).update(body).digest()
  const given = Buffer.from(sig, 'base64url')
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString()) as { s: string, u: string, r: LiveRole, e: number }
    if (p.s !== streamId || p.e < Date.now() / 1000) return null
    return { userId: p.u, role: p.r === 'broadcaster' ? 'broadcaster' : 'viewer' }
  } catch { return null }
}

export const roomOf = (streamId: string): LiveRoom => {
  let room = rooms.get(streamId)
  if (!room) {
    room = { streamId, broadcaster: null, viewers: new Map(), likes: 0, likesLoaded: false, pendingLikes: 0, viewerTimer: null }
    rooms.set(streamId, room)
  }
  return room
}

export const existingRoom = (streamId: string) => rooms.get(streamId) ?? null

export const dropRoomIfEmpty = (room: LiveRoom) => {
  if (!room.broadcaster && room.viewers.size === 0 && !room.pendingLikes) rooms.delete(room.streamId)
}

export const broadcastToStream = (streamId: string, payload: unknown) => {
  const room = rooms.get(streamId)
  if (!room) return
  room.broadcaster?.send(payload)
  room.viewers.forEach(v => v.send(payload))
}

export const viewerSummary = (room: LiveRoom) => {
  const unique = new Map<string, LivePeer>()
  room.viewers.forEach(v => { if (v.userId !== room.broadcaster?.userId && !unique.has(v.userId)) unique.set(v.userId, v) })
  return {
    count: unique.size,
    top: Array.from(unique.values()).slice(0, 20).map(v => ({ id: v.userId, name: v.name, avatar: v.avatar }))
  }
}

/** Debounced presence broadcast + persisted viewer/peak counts. */
export const scheduleViewerUpdate = (room: LiveRoom) => {
  if (room.viewerTimer) return
  room.viewerTimer = setTimeout(async () => {
    room.viewerTimer = null
    const summary = viewerSummary(room)
    broadcastToStream(room.streamId, { type: 'viewers', ...summary })
    try {
      const db = getServiceClient()
      const { data } = await db.from('streams').select('peak_viewer_count, broadcast_status').eq('id', room.streamId).maybeSingle()
      if (data?.broadcast_status === 'LIVE') {
        await db.from('streams').update({ current_viewer_count: summary.count, peak_viewer_count: Math.max(summary.count, data.peak_viewer_count ?? 0) }).eq('id', room.streamId)
      }
    } catch (err) { console.error('[live] viewer count persist failed', err) }
  }, 1200)
}

export const ensureLikesLoaded = async (room: LiveRoom) => {
  if (room.likesLoaded) return
  room.likesLoaded = true
  const { data } = await getServiceClient().from('streams').select('like_count' as never).eq('id', room.streamId).maybeSingle()
  room.likes = Number((data as { like_count?: number } | null)?.like_count ?? 0) + room.likes
}

let flushTimer: ReturnType<typeof setInterval> | null = null
/** Likes are aggregated and flushed every 2s so tap storms don't flood the DB or sockets. */
export const startLikeFlusher = () => {
  if (flushTimer) return
  flushTimer = setInterval(() => {
    rooms.forEach((room) => {
      if (!room.pendingLikes) return
      const delta = room.pendingLikes
      room.pendingLikes = 0
      broadcastToStream(room.streamId, { type: 'likes', total: room.likes, delta })
      void getServiceClient().from('streams').update({ like_count: room.likes } as never).eq('id', room.streamId)
        .then(({ error }) => { if (error) console.error('[live] like persist failed', error.message) })
      dropRoomIfEmpty(room)
    })
  }, 2000)
}

export const liveUserCard = async (userId: string) => {
  const { data } = await getServiceClient().from('user').select('user_id, username, display_name, avatar_url, is_verified, verified_type').eq('user_id', userId).maybeSingle()
  return data
    ? { id: data.user_id, name: data.display_name || data.username, username: data.username, avatar_url: data.avatar_url, is_verified: data.is_verified, verified_type: data.verified_type }
    : { id: userId, name: 'Viewer', username: null, avatar_url: null, is_verified: false, verified_type: null }
}
