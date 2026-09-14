import { ref, onUnmounted } from 'vue'
import type { Ref } from 'vue'

const ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
]

const randomPeerId = () => `p_${Math.random().toString(36).slice(2, 10)}`

const signallingUrl = (streamId: string) => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/api/stream/${streamId}/ws`
}

interface SignalMessage {
  type: string
  from?: string
  viewerId?: string
  payload?: {
    kind: 'offer' | 'answer' | 'ice'
    sdp?: RTCSessionDescriptionInit
    candidate?: RTCIceCandidateInit
  }
}

/**
 * Broadcaster side: one peer connection per viewer, tracks pushed directly.
 */
export const useStreamBroadcasterPeers = () => {
  const peerId = randomPeerId()
  const connections = new Map<string, RTCPeerConnection>()
  const viewerIds = ref<string[]>([])
  const connected = ref(false)
  let socket: WebSocket | null = null
  let localStream: MediaStream | null = null

  const send = (message: Record<string, unknown>) => {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message))
  }

  const createConnection = async (viewerId: string) => {
    if (!localStream) return
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    connections.set(viewerId, pc)

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream as MediaStream))

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        send({ type: 'signal', to: viewerId, payload: { kind: 'ice', candidate: event.candidate.toJSON() } })
      }
    }

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    send({ type: 'signal', to: viewerId, payload: { kind: 'offer', sdp: offer } })
  }

  const handle = async (message: SignalMessage) => {
    if (message.type === 'viewer-joined' && message.viewerId) {
      viewerIds.value = [...viewerIds.value, message.viewerId]
      await createConnection(message.viewerId)
      return
    }

    if (message.type === 'viewer-left' && message.viewerId) {
      connections.get(message.viewerId)?.close()
      connections.delete(message.viewerId)
      viewerIds.value = viewerIds.value.filter(id => id !== message.viewerId)
      return
    }

    if (message.type === 'signal' && message.from && message.payload) {
      const pc = connections.get(message.from)
      if (!pc) return
      if (message.payload.kind === 'answer' && message.payload.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(message.payload.sdp))
      } else if (message.payload.kind === 'ice' && message.payload.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(message.payload.candidate))
      }
    }
  }

  const start = (streamId: string, stream: MediaStream) => {
    localStream = stream
    socket = new WebSocket(signallingUrl(streamId))
    socket.onopen = () => {
      connected.value = true
      send({ type: 'join', role: 'broadcaster', peerId })
    }
    socket.onmessage = (event) => {
      void handle(JSON.parse(event.data) as SignalMessage)
    }
    socket.onclose = () => {
      connected.value = false
    }
  }

  const stop = () => {
    connections.forEach(pc => pc.close())
    connections.clear()
    viewerIds.value = []
    socket?.close()
    socket = null
    localStream = null
  }

  onUnmounted(stop)

  return { start, stop, viewerIds, connected }
}

/**
 * Viewer side: answers the broadcaster's offer and exposes the remote stream.
 */
export const useStreamViewerPeer = () => {
  const peerId = randomPeerId()
  const remoteStream: Ref<MediaStream | null> = ref(null)
  const waitingForBroadcaster = ref(true)
  let socket: WebSocket | null = null
  let pc: RTCPeerConnection | null = null

  const send = (message: Record<string, unknown>) => {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message))
  }

  const handle = async (message: SignalMessage) => {
    if (message.type === 'broadcaster-left') {
      waitingForBroadcaster.value = true
      remoteStream.value = null
      pc?.close()
      pc = null
      return
    }

    if (message.type !== 'signal' || !message.from || !message.payload) return
    const broadcasterId = message.from

    if (message.payload.kind === 'offer' && message.payload.sdp) {
      pc?.close()
      pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

      pc.ontrack = (event) => {
        remoteStream.value = event.streams[0] ?? null
        waitingForBroadcaster.value = false
      }
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          send({ type: 'signal', to: broadcasterId, payload: { kind: 'ice', candidate: event.candidate.toJSON() } })
        }
      }

      await pc.setRemoteDescription(new RTCSessionDescription(message.payload.sdp))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      send({ type: 'signal', to: broadcasterId, payload: { kind: 'answer', sdp: answer } })
      return
    }

    if (message.payload.kind === 'ice' && message.payload.candidate && pc) {
      await pc.addIceCandidate(new RTCIceCandidate(message.payload.candidate))
    }
  }

  const join = (streamId: string) => {
    socket = new WebSocket(signallingUrl(streamId))
    socket.onopen = () => send({ type: 'join', role: 'viewer', peerId })
    socket.onmessage = (event) => {
      void handle(JSON.parse(event.data) as SignalMessage)
    }
  }

  const leave = () => {
    pc?.close()
    pc = null
    socket?.close()
    socket = null
    remoteStream.value = null
  }

  onUnmounted(leave)

  return { join, leave, remoteStream, waitingForBroadcaster }
}
