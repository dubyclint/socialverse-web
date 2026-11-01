import { defineWebSocketHandler } from 'h3'
import {
  broadcastToStream, dropRoomIfEmpty, ensureLikesLoaded, liveUserCard, roomOf, existingRoom,
  scheduleViewerUpdate, startLikeFlusher, verifyLiveToken, type LivePeer
} from '~/server/utils/stream-hub'

/**
 * Live room socket. Joining needs a signed token from /api/stream/:id/transport,
 * so only the stream owner can take the broadcaster seat. Carries WebRTC mesh
 * signalling plus presence and likes; chat/gifts/moderation are pushed by the API.
 */
interface WsPeer { id: string, send: (data: string) => void, request?: { url?: string }, url?: string }

const peerRooms = new Map<string, { streamId: string, peerId: string }>()

const streamIdOf = (peer: WsPeer): string | null => {
  const raw = peer.url || peer.request?.url || ''
  return raw.match(/\/api\/stream\/([^/?]+)\/ws/)?.[1] ?? null
}

const leave = (key: string) => {
  const entry = peerRooms.get(key)
  if (!entry) return
  peerRooms.delete(key)
  const room = existingRoom(entry.streamId)
  if (!room) return
  if (room.broadcaster?.key === key) {
    room.broadcaster = null
    room.viewers.forEach(v => v.send({ type: 'broadcaster-left' }))
  } else if (room.viewers.get(entry.peerId)?.key === key) {
    room.viewers.delete(entry.peerId)
    room.broadcaster?.send({ type: 'viewer-left', viewerId: entry.peerId })
    scheduleViewerUpdate(room)
  }
  dropRoomIfEmpty(room)
}

export default defineWebSocketHandler({
  async message(rawPeer, message) {
    const peer = rawPeer as unknown as WsPeer
    const streamId = streamIdOf(peer)
    if (!streamId) return
    let data: { type?: string, token?: string, peerId?: string, to?: string, payload?: unknown, n?: number }
    try { data = JSON.parse(message.text()) } catch { return }
    const send = (payload: unknown) => { try { peer.send(JSON.stringify(payload)) } catch { /* closed */ } }

    if (data.type === 'join') {
      const auth = verifyLiveToken(data.token, streamId)
      const peerId = typeof data.peerId === 'string' ? data.peerId.slice(0, 40) : ''
      if (!auth || !peerId) return send({ type: 'error', message: 'Not allowed to join this live' })
      startLikeFlusher()
      const room = roomOf(streamId)
      await ensureLikesLoaded(room)
      const card = await liveUserCard(auth.userId)
      const entry: LivePeer = { key: peer.id, peerId, userId: auth.userId, role: auth.role, name: card.name || 'Viewer', avatar: card.avatar_url ?? null, send, likeWindowStart: 0, likeWindowCount: 0 }
      peerRooms.set(peer.id, { streamId, peerId })
      if (auth.role === 'broadcaster') {
        if (room.broadcaster && room.broadcaster.key !== peer.id) room.broadcaster.send({ type: 'replaced' })
        room.broadcaster = entry
        room.viewers.forEach(v => v.send({ type: 'broadcaster-ready' }))
        send({ type: 'joined', role: 'broadcaster', viewers: Array.from(room.viewers.keys()), likes: room.likes })
      } else {
        room.viewers.set(peerId, entry)
        room.broadcaster?.send({ type: 'viewer-joined', viewerId: peerId })
        send({ type: 'joined', role: 'viewer', broadcasterOnline: Boolean(room.broadcaster), likes: room.likes })
      }
      scheduleViewerUpdate(room)
      return
    }

    const entry = peerRooms.get(peer.id)
    if (!entry || entry.streamId !== streamId) return
    const room = roomOf(streamId)

    if (data.type === 'signal' && data.to) {
      const target = room.broadcaster?.peerId === data.to ? room.broadcaster : room.viewers.get(data.to)
      // Viewers may only signal the broadcaster; the broadcaster may signal any viewer.
      const fromBroadcaster = room.broadcaster?.key === peer.id
      if (target && (fromBroadcaster || target === room.broadcaster)) target.send({ type: 'signal', from: entry.peerId, payload: data.payload })
      return
    }

    if (data.type === 'like') {
      const self = room.broadcaster?.key === peer.id ? room.broadcaster : room.viewers.get(entry.peerId)
      if (!self) return
      const now = Date.now()
      if (now - self.likeWindowStart > 1000) { self.likeWindowStart = now; self.likeWindowCount = 0 }
      const n = Math.min(10, Math.max(1, Math.floor(Number(data.n) || 1)))
      if (self.likeWindowCount + n > 20) return
      self.likeWindowCount += n
      room.likes += n
      room.pendingLikes += n
      return
    }

    if (data.type === 'ping') send({ type: 'pong' })
  },
  close(peer) { leave(peer.id) },
  error(peer) { leave(peer.id) }
})

export { broadcastToStream }
