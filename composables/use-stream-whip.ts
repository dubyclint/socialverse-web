import { ref } from 'vue'

const ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
]

export interface StreamTransport {
  mode: 'mesh' | 'whip'
  ingestUrl?: string
  playbackUrl?: string
  token?: string
}

export const fetchStreamTransport = async (streamId: string): Promise<StreamTransport> => {
  const response = await $fetch<{ data: StreamTransport }>(`/api/stream/${streamId}/transport`)
  return response.data
}

const waitForIceGathering = (pc: RTCPeerConnection) =>
  new Promise<void>((resolve) => {
    if (pc.iceGatheringState === 'complete') return resolve()
    const check = () => {
      if (pc.iceGatheringState === 'complete') {
        pc.removeEventListener('icegatheringstatechange', check)
        resolve()
      }
    }
    pc.addEventListener('icegatheringstatechange', check)
    setTimeout(resolve, 3000)
  })

const exchangeSdp = async (pc: RTCPeerConnection, url: string, token?: string) => {
  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  await waitForIceGathering(pc)

  const headers: Record<string, string> = { 'Content-Type': 'application/sdp' }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: pc.localDescription?.sdp ?? ''
  })

  if (!response.ok) throw new Error(`Media server rejected the session (${response.status})`)

  await pc.setRemoteDescription({ type: 'answer', sdp: await response.text() })
}

/**
 * WHIP ingest and WHEP playback: the browser holds a single connection to the
 * media server, which fans the stream out to its own audience, so viewer count
 * is bounded by the provider rather than by the broadcaster's uplink.
 */
export const useWhipPublisher = () => {
  const publishing = ref(false)
  const error = ref<string | null>(null)
  let pc: RTCPeerConnection | null = null

  const publish = async (transport: StreamTransport, media: MediaStream) => {
    if (!transport.ingestUrl) throw new Error('No ingest URL configured for this stream')
    pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    media.getTracks().forEach(track => pc?.addTrack(track, media))

    try {
      await exchangeSdp(pc, transport.ingestUrl, transport.token)
      publishing.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Publish failed'
      stop()
      throw err
    }
  }

  const stop = () => {
    pc?.close()
    pc = null
    publishing.value = false
  }

  return { publish, stop, publishing, error }
}

export const useWhepViewer = () => {
  const remoteStream = ref<MediaStream | null>(null)
  const error = ref<string | null>(null)
  let pc: RTCPeerConnection | null = null

  const play = async (transport: StreamTransport) => {
    if (!transport.playbackUrl) throw new Error('No playback URL configured for this stream')
    pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    pc.addTransceiver('video', { direction: 'recvonly' })
    pc.addTransceiver('audio', { direction: 'recvonly' })

    const media = new MediaStream()
    remoteStream.value = media
    pc.ontrack = (event) => {
      media.addTrack(event.track)
    }

    try {
      await exchangeSdp(pc, transport.playbackUrl, transport.token)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Playback failed'
      stop()
      throw err
    }
  }

  const stop = () => {
    pc?.close()
    pc = null
    remoteStream.value = null
  }

  return { play, stop, remoteStream, error }
}
