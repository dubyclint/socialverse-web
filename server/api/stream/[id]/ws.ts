import { defineWebSocketHandler } from 'h3'

/**
 * WebRTC signalling hub for a stream: the broadcaster publishes to each viewer
 * directly (mesh), this relay only carries offers, answers and ICE candidates.
 */
type Role = 'broadcaster' | 'viewer'

interface StreamPeer {
  id: string
  role: Role
  send: (payload: unknown) => void
}

interface StreamRoom {
  broadcaster: StreamPeer | null
  viewers: Map<string, StreamPeer>
}

interface Peer {
  id: string
  send: (data: string) => void
  request?: { url?: string }
  url?: string
}

const rooms = new Map<string, StreamRoom>()
const peerRooms = new Map<string, { streamId: string, peerId: string }>()

const roomOf = (streamId: string): StreamRoom => {
  let room = rooms.get(streamId)
  if (!room) {
    room = { broadcaster: null, viewers: new Map() }
    rooms.set(streamId, room)
  }
  return room
}

const streamIdOf = (peer: Peer): string | null => {
  const raw = peer.url || peer.request?.url || ''
  const match = raw.match(/\/api\/stream\/([^/]+)\/ws/)
  return match?.[1] ?? null
}

const leave = (peerKey: string) => {
  const entry = peerRooms.get(peerKey)
  if (!entry) return
  peerRooms.delete(peerKey)

  const room = rooms.get(entry.streamId)
  if (!room) return

  if (room.broadcaster?.id === entry.peerId) {
    room.broadcaster = null
    room.viewers.forEach(viewer => viewer.send({ type: 'broadcaster-left' }))
  } else if (room.viewers.delete(entry.peerId)) {
    room.broadcaster?.send({ type: 'viewer-left', viewerId: entry.peerId })
  }

  if (!room.broadcaster && room.viewers.size === 0) rooms.delete(entry.streamId)
}

export default defineWebSocketHandler({
  message(peer, message) {
    const streamId = streamIdOf(peer as unknown as Peer)
    if (!streamId) return

    let data: { type?: string, role?: Role, peerId?: string, to?: string, payload?: unknown }
    try {
      data = JSON.parse(message.text())
    } catch {
      return
    }

    const room = roomOf(streamId)
    const send = (payload: unknown) => peer.send(JSON.stringify(payload))

    if (data.type === 'join' && data.peerId) {
      const entry: StreamPeer = { id: data.peerId, role: data.role === 'broadcaster' ? 'broadcaster' : 'viewer', send }
      peerRooms.set(peer.id, { streamId, peerId: data.peerId })

      if (entry.role === 'broadcaster') {
        room.broadcaster = entry
        room.viewers.forEach(viewer => viewer.send({ type: 'broadcaster-ready' }))
        send({ type: 'joined', role: 'broadcaster', viewers: Array.from(room.viewers.keys()) })
        return
      }

      room.viewers.set(entry.id, entry)
      room.broadcaster?.send({ type: 'viewer-joined', viewerId: entry.id })
      send({ type: 'joined', role: 'viewer', broadcasterOnline: Boolean(room.broadcaster) })
      return
    }

    if (data.type === 'signal' && data.to) {
      const target = room.broadcaster?.id === data.to ? room.broadcaster : room.viewers.get(data.to)
      const from = peerRooms.get(peer.id)?.peerId
      if (target && from) target.send({ type: 'signal', from, payload: data.payload })
    }
  },

  close(peer) {
    leave(peer.id)
  },

  error(peer) {
    leave(peer.id)
  }
})
