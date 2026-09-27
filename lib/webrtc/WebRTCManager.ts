// ============================================================================
// FILE: /lib/webrtc/WebRTCManager.ts
// Description: Browser-native WebRTC peer connection manager used by
// composables/use-webrtc.ts. Wraps RTCPeerConnection + getUserMedia/
// getDisplayMedia with a small event-callback surface tailored to the
// composable's expectations (permissive-first: typed with `any` at the
// edges where upstream signaling payloads are not yet strongly typed).
// ============================================================================

export type StreamQuality = 'low' | 'medium' | 'high' | 'auto'

export interface WebRTCConfig {
  iceServers?: RTCIceServer[]
  maxBitrate?: number
  [key: string]: any
}

export interface PeerConnection {
  id: string
  userId?: string
  username?: string
  isStreamer?: boolean
  isGuest?: boolean
  connection: RTCPeerConnection
  stream?: MediaStream
  [key: string]: any
}

type PeerConnectCallback = (peer: PeerConnection) => void
type PeerDisconnectCallback = (peerId: string) => void
type StreamReceiveCallback = (peerId: string, stream: MediaStream) => void
type StatsReceiveCallback = (peerId: string, stats: RTCStatsReport) => void

const QUALITY_PRESETS: Record<Exclude<StreamQuality, 'auto'>, { width: number; height: number; frameRate: number; bitrate: number }> = {
  low: { width: 640, height: 360, frameRate: 24, bitrate: 300_000 },
  medium: { width: 1280, height: 720, frameRate: 30, bitrate: 1_200_000 },
  high: { width: 1920, height: 1080, frameRate: 30, bitrate: 3_000_000 }
}

export class WebRTCManager {
  private config: WebRTCConfig
  private peers = new Map<string, PeerConnection>()
  private localStream: MediaStream | null = null
  private currentQuality: StreamQuality = 'medium'
  private statsIntervals = new Map<string, ReturnType<typeof setInterval>>()

  private peerConnectCb: PeerConnectCallback = () => {}
  private peerDisconnectCb: PeerDisconnectCallback = () => {}
  private streamReceiveCb: StreamReceiveCallback = () => {}
  private statsReceiveCb: StatsReceiveCallback = () => {}

  constructor(config: WebRTCConfig = {}) {
    this.config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ],
      ...config
    }
  }

  // ---------------------------------------------------------------------
  // Quality
  // ---------------------------------------------------------------------
  getQualityPresets(): StreamQuality[] {
    return ['low', 'medium', 'high']
  }

  getCurrentQuality(): StreamQuality {
    return this.currentQuality
  }

  async changeQuality(quality: StreamQuality): Promise<void> {
    this.currentQuality = quality
    const preset = quality === 'auto' ? QUALITY_PRESETS.medium : QUALITY_PRESETS[quality]
    if (!preset || !this.localStream) return

    const videoTrack = this.localStream.getVideoTracks()[0]
    if (videoTrack) {
      await videoTrack.applyConstraints({
        width: preset.width,
        height: preset.height,
        frameRate: preset.frameRate
      }).catch(() => {
        // applyConstraints can fail on some devices/browsers; non-fatal
      })
    }

    for (const peer of this.peers.values()) {
      const sender = peer.connection.getSenders().find(s => s.track?.kind === 'video')
      if (sender) {
        const params = sender.getParameters()
        params.encodings = params.encodings?.length ? params.encodings : [{}]
        if (params.encodings[0]) {
          params.encodings[0].maxBitrate = preset.bitrate
        }
        await sender.setParameters(params).catch(() => {})
      }
    }
  }

  // ---------------------------------------------------------------------
  // Event registration
  // ---------------------------------------------------------------------
  onPeerConnect(cb: PeerConnectCallback): void {
    this.peerConnectCb = cb
  }

  onPeerDisconnect(cb: PeerDisconnectCallback): void {
    this.peerDisconnectCb = cb
  }

  onStreamReceive(cb: StreamReceiveCallback): void {
    this.streamReceiveCb = cb
  }

  onStatsReceive(cb: StatsReceiveCallback): void {
    this.statsReceiveCb = cb
  }

  // ---------------------------------------------------------------------
  // Local media
  // ---------------------------------------------------------------------
  async startLocalStream(constraints?: MediaStreamConstraints): Promise<MediaStream> {
    const stream = await navigator.mediaDevices.getUserMedia(
      constraints || { video: true, audio: true }
    )
    this.localStream = stream

    // Attach to any peers already connected
    for (const peer of this.peers.values()) {
      stream.getTracks().forEach(track => peer.connection.addTrack(track, stream))
    }

    return stream
  }

  async startScreenShare(): Promise<MediaStream> {
    const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: false })

    for (const peer of this.peers.values()) {
      const sender = peer.connection.getSenders().find(s => s.track?.kind === 'video')
      const screenTrack = stream.getVideoTracks()[0]
      if (sender && screenTrack) {
        await sender.replaceTrack(screenTrack)
      }
    }

    return stream
  }

  async toggleAudio(enabled?: boolean): Promise<boolean> {
    const track = this.localStream?.getAudioTracks()[0]
    if (!track) return false
    track.enabled = enabled ?? !track.enabled
    return track.enabled
  }

  async toggleVideo(enabled?: boolean): Promise<boolean> {
    const track = this.localStream?.getVideoTracks()[0]
    if (!track) return false
    track.enabled = enabled ?? !track.enabled
    return track.enabled
  }

  // ---------------------------------------------------------------------
  // Peer lifecycle
  // ---------------------------------------------------------------------
  async createPeerConnection(
    peerId: string,
    userId?: string,
    username?: string,
    isStreamer?: boolean,
    isGuest?: boolean
  ): Promise<PeerConnection> {
    const connection = new RTCPeerConnection({ iceServers: this.config.iceServers })

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => connection.addTrack(track, this.localStream!))
    }

    const peer: PeerConnection = { id: peerId, userId, username, isStreamer, isGuest, connection }
    this.peers.set(peerId, peer)

    connection.ontrack = (event) => {
      const [stream] = event.streams
      if (stream) {
        peer.stream = stream
        this.streamReceiveCb(peerId, stream)
      }
    }

    connection.onconnectionstatechange = () => {
      if (connection.connectionState === 'connected') {
        this.peerConnectCb(peer)
      } else if (['disconnected', 'failed', 'closed'].includes(connection.connectionState)) {
        this.peerDisconnectCb(peerId)
        this.stopStatsPolling(peerId)
      }
    }

    this.startStatsPolling(peerId, connection)

    return peer
  }

  async createOffer(peerId: string): Promise<RTCSessionDescriptionInit | null> {
    const peer = this.peers.get(peerId)
    if (!peer) return null
    const offer = await peer.connection.createOffer()
    await peer.connection.setLocalDescription(offer)
    return offer
  }

  async createAnswer(peerId: string): Promise<RTCSessionDescriptionInit | null> {
    const peer = this.peers.get(peerId)
    if (!peer) return null
    const answer = await peer.connection.createAnswer()
    await peer.connection.setLocalDescription(answer)
    return answer
  }

  async handleOffer(peerId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    const peer = this.peers.get(peerId)
    if (!peer) return
    await peer.connection.setRemoteDescription(new RTCSessionDescription(offer))
  }

  async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peer = this.peers.get(peerId)
    if (!peer) return
    await peer.connection.setRemoteDescription(new RTCSessionDescription(answer))
  }

  async handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peer = this.peers.get(peerId)
    if (!peer || !candidate) return
    await peer.connection.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {
      // Ignore late/duplicate candidates
    })
  }

  removePeer(peerId: string): void {
    const peer = this.peers.get(peerId)
    if (peer) {
      peer.connection.close()
      this.peers.delete(peerId)
      this.stopStatsPolling(peerId)
    }
  }

  destroy(): void {
    for (const peerId of Array.from(this.peers.keys())) {
      this.removePeer(peerId)
    }
    this.localStream?.getTracks().forEach(track => track.stop())
    this.localStream = null
  }

  // ---------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------
  private startStatsPolling(peerId: string, connection: RTCPeerConnection): void {
    const interval = setInterval(async () => {
      try {
        const stats = await connection.getStats()
        this.statsReceiveCb(peerId, stats)
      } catch {
        // Connection may already be closed; ignore
      }
    }, 3000)
    this.statsIntervals.set(peerId, interval)
  }

  private stopStatsPolling(peerId: string): void {
    const interval = this.statsIntervals.get(peerId)
    if (interval) {
      clearInterval(interval)
      this.statsIntervals.delete(peerId)
    }
  }
}
