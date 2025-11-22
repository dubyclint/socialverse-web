// composables/useWebRTC.ts
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { WebRTCManager, type WebRTCConfig, type StreamQuality, type PeerConnection } from '~/lib/webrtc/WebRTCManager'

interface WebRTCPeer {
  peerId: string
  userId: string
  username: string
  avatar?: string
  isStreamer: boolean
  isGuest: boolean
  stream?: MediaStream
  mediaCapabilities: {
    video: boolean
    audio: boolean
    screen: boolean
  }
  connectionState: RTCPeerConnectionState
  stats?: RTCStatsReport
}

interface WebRTCStats {
  bitrate: number
  packetsLost: number
  roundTripTime: number
  jitter: number
  resolution: { width: number; height: number }
  frameRate: number
}

export const useWebRTC = (streamId: string) => {
  // WebRTC Manager instance
  let webrtcManager: WebRTCManager | null = null
  
  // WebSocket connection for signaling
  const signalingWs = ref<WebSocket | null>(null)
  const isSignalingConnected = ref(false)

  // Local stream state
  const localStream = ref<MediaStream | null>(null)
  const isStreaming = ref(false)
  const isScreenSharing = ref(false)
  const localPeerId = ref<string>('')

  // Media controls
  const isAudioEnabled = ref(true)
  const isVideoEnabled = ref(true)
  const currentQuality = ref<StreamQuality>()

  // Peers management
  const peers = reactive<Map<string, WebRTCPeer>>(new Map())
  const connectionErrors = ref<string[]>([])

  // Statistics
  const connectionStats = reactive<Map<string, WebRTCStats>>(new Map())

  // Quality presets
  const qualityPresets = ref<StreamQuality[]>([])

  // Computed properties
  const connectedPeers = computed(() => Array.from(peers.values()))
  const activePeers = computed(() => 
    connectedPeers.value.filter(peer => peer.connectionState === 'connected')
  )
  const streamers = computed(() => 
    connectedPeers.value.filter(peer => peer.isStreamer)
  )
  const guests = computed(() => 
    connectedPeers.value.filter(peer => peer.isGuest)
  )
  const viewers = computed(() => 
    connectedPeers.value.filter(peer => !peer.isStreamer && !peer.isGuest)
  )

  // Initialize WebRTC
  const initializeWebRTC = async (config: Partial<WebRTCConfig> = {}) => {
    try {
      const defaultConfig: WebRTCConfig = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ],
        maxBitrate: 4000,
        ...config
      }

      webrtcManager = new WebRTCManager(defaultConfig)
      qualityPresets.value = webrtcManager.getQualityPresets()
      currentQuality.value = webrtcManager.getCurrentQuality()

      // Set up event handlers
      webrtcManager.onPeerConnect((peer) => {
        updatePeerInfo(peer)
      })

      webrtcManager.onPeerDisconnect((peerId) => {
        peers.delete(peerId)
        connectionStats.delete(peerId)
      })

      webrtcManager.onStreamReceive((peerId, stream) => {
        const peer = peers.get(peerId)
        if (peer) {
          peer.stream = stream
        }
      })

      webrtcManager.onStatsReceive((peerId, stats) => {
        updateConnectionStats(peerId, stats)
      })

      console.log('WebRTC initialized successfully')
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error)
      connectionErrors.value.push(`Initialization failed: ${error.message}`)
    }
  }

  // Connect to signaling server
  const connectSignaling = async (userId: string, username: string, avatar?: string, isStreamer = false, isGuest = false) => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/api/ws/webrtc-signaling`
      
      signalingWs.value = new WebSocket(wsUrl)

      signalingWs.value.onopen = () => {
        console.log('WebRTC signaling connected')
        isSignalingConnected.value = true
        
        // Join WebRTC stream
        sendSignalingMessage('join-webrtc-stream', {
          streamId,
          userId,
          username,
          avatar,
          isStreamer,
          isGuest,
          mediaCapabilities: {
            video: isVideoEnabled.value,
            audio: isAudioEnabled.value,
            screen: isScreenSharing.value
          }
        })
      }

      signalingWs.value.onmessage = (event) => {
        handleSignalingMessage(JSON.parse(event.data))
      }

      signalingWs.value.onclose = () => {
        console.log('WebRTC signaling disconnected')
        isSignalingConnected.value = false
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (!isSignalingConnected.value) {
            connectSignaling(userId, username, avatar, isStreamer, isGuest)
          }
        }, 3000)
      }

      signalingWs.value.onerror = (error) => {
        console.error('WebRTC signaling error:', error)
        connectionErrors.value.push('Signaling connection failed')
      }

    } catch (error) {
      console.error('Failed to connect to signaling server:', error)
      connectionErrors.value.push(`Signaling failed: ${error.message}`)
    }
  }

  // Start local stream
  const startLocalStream = async (constraints?: MediaStreamConstraints) => {
    if (!webrtcManager) {
      throw new Error('WebRTC not initialized')
    }

    try {
      localStream.value = await webrtcManager.startLocalStream(constraints)
      isStreaming.value = true
      
      // Update media state
      const videoTrack = localStream.value.getVideoTracks()[0]
      const audioTrack = localStream.value.getAudioTracks()[0]
      
      isVideoEnabled.value = videoTrack?.enabled || false
      isAudioEnabled.value = audioTrack?.enabled || false

      // Notify signaling server of media state
      sendSignalingMessage('media-state-change', {
        mediaType: 'video',
        enabled: isVideoEnabled.value
      })
      
      sendSignalingMessage('media-state-change', {
        mediaType: 'audio',
        enabled: isAudioEnabled.value
      })

      return localStream.value
    } catch (error) {
      console.error('Failed to start local stream:', error)
      connectionErrors.value.push(`Camera/microphone access failed: ${error.message}`)
      throw error
    }
  }

  // Start screen sharing
  const startScreenShare = async () => {
    if (!webrtcManager) {
      throw new Error('WebRTC not initialized')
    }

    try {
      const screenStream = await webrtcManager.startScreenShare()
      isScreenSharing.value = true
      
      // Notify signaling server
      sendSignalingMessage('media-state-change', {
        mediaType: 'screen',
        enabled: true
      })

      return screenStream
    } catch (error) {
      console.error('Failed to start screen share:', error)
      connectionErrors.value.push(`Screen sharing failed: ${error.message}`)
      throw error
    }
  }

  // Stop screen sharing
  const stopScreenShare = async () => {
    if (!webrtcManager) return

    isScreenSharing.value = false
    
    // Notify signaling server
    sendSignalingMessage('media-state-change', {
      mediaType: 'screen',
      enabled: false
    })
  }

  // Toggle audio
  const toggleAudio = async (enabled?: boolean) => {
    if (!webrtcManager) return false

    const audioEnabled = await webrtcManager.toggleAudio(enabled)
    isAudioEnabled.value = audioEnabled

    // Notify signaling server
    sendSignalingMessage('media-state-change', {
      mediaType: 'audio',
      enabled: audioEnabled
    })

    return audioEnabled
  }

  // Toggle video
  const toggleVideo = async (enabled?: boolean) => {
    if (!webrtcManager) return false

    const videoEnabled = await webrtcManager.toggleVideo(enabled)
    isVideoEnabled.value = videoEnabled

    // Notify signaling server
    sendSignalingMessage('media-state-change', {
      mediaType: 'video',
      enabled: videoEnabled
    })

    return videoEnabled
  }

  // Change stream quality
  const changeQuality = async (quality: StreamQuality) => {
    if (!webrtcManager) return

    try {
      await webrtcManager.changeQuality(quality)
      currentQuality.value = quality

      // Notify signaling server
      sendSignalingMessage('quality-change', { quality })
    } catch (error) {
      console.error('Failed to change quality:', error)
      connectionErrors.value.push(`Quality change failed: ${error.message}`)
    }
  }

  // Invite guest to stream
  const inviteGuest = async (userId: string) => {
    sendSignalingMessage('invite-guest', {
      userId,
      streamId
    })
  }

  // Accept guest invitation
  const acceptGuestInvite = async (inviterUserId: string) => {
    sendSignalingMessage('accept-guest-invite', {
      streamId,
      inviterUserId
    })
  }

  // Reject guest invitation
  const rejectGuestInvite = async (inviterUserId: string) => {
    sendSignalingMessage('reject-guest-invite', {
      streamId,
      inviterUserId
    })
  }

  // Signaling message handling
  const sendSignalingMessage = (type: string, payload: any) => {
    if (signalingWs.value && signalingWs.value.readyState === WebSocket.OPEN) {
      signalingWs.value.send(JSON.stringify({ type, payload }))
    }
  }

  const handleSignalingMessage = async (data: any) => {
    const { type, data: messageData } = data

    if (!webrtcManager) return

    try {
      switch (type) {
        case 'signaling-connected':
          console.log('Connected to WebRTC signaling server')
          break

        case 'webrtc-joined':
          localPeerId.value = messageData.peerId
          console.log('Joined WebRTC stream with peer ID:', messageData.peerId)
          break

        case 'existing-peers':
          // Handle existing peers in the stream
          for (const peerData of messageData.peers) {
            await createPeerConnection(peerData)
          }
          break

        case 'peer-joined':
          // New peer joined the stream
          await createPeerConnection(messageData)
          break

        case 'peer-left':
          // Peer left the stream
          if (webrtcManager) {
            webrtcManager.removePeer(messageData.peerId)
          }
          peers.delete(messageData.peerId)
          break

        case 'webrtc-offer-received':
          // Received WebRTC offer
          await handleOffer(messageData)
          break

        case 'webrtc-answer-received':
          // Received WebRTC answer
          await handleAnswer(messageData)
          break

        case 'webrtc-ice-candidate-received':
          // Received ICE candidate
          await handleIceCandidate(messageData)
          break

        case 'peer-media-state-changed':
          // Peer changed media state
          updatePeerMediaState(messageData)
          break

        case 'peer-quality-changed':
          // Peer changed quality
          updatePeerQuality(messageData)
          break

        case 'guest-invitation':
          // Received guest invitation
          handleGuestInvitation(messageData)
          break

        case 'guest-invite-accepted':
          // Guest accepted invitation
          handleGuestInviteAccepted(messageData)
          break

        case 'guest-invite-rejected':
          // Guest rejected invitation
          handleGuestInviteRejected(messageData)
          break

        case 'signaling-error':
          console.error('Signaling error:', messageData.message)
          connectionErrors.value.push(messageData.message)
          break

        default:
          console.log('Unknown signaling message type:', type)
      }
    } catch (error) {
      console.error('Error handling signaling message:', error)
      connectionErrors.value.push(`Signaling error: ${error.message}`)
    }
  }

  // Create peer connection
  const createPeerConnection = async (peerData: any) => {
    if (!webrtcManager) return

    try {
      const peer = await webrtcManager.createPeerConnection(
        peerData.peerId,
        peerData.userId,
        peerData.username,
        peerData.isStreamer,
        peerData.isGuest
      )

      // Add to peers map
      peers.set(peerData.peerId, {
        peerId: peerData.peerId,
        userId: peerData.userId,
        username: peerData.username,
        avatar: peerData.avatar,
        isStreamer: peerData.isStreamer,
        isGuest: peerData.isGuest,
        mediaCapabilities: peerData.mediaCapabilities,
        connectionState: 'new'
      })

      // Create and send offer if we're the initiator
      if (localPeerId.value < peerData.peerId) {
        const offer = await webrtcManager.createOffer(peerData.peerId)
        sendSignalingMessage('webrtc-offer', {
          toPeerId: peerData.peerId,
          offer
        })
      }
    } catch (error) {
      console.error('Failed to create peer connection:', error)
      connectionErrors.value.push(`Peer connection failed: ${error.message}`)
    }
  }

  // Handle WebRTC offer
  const handleOffer = async (data: any) => {
    if (!webrtcManager) return

    try {
      await webrtcManager.handleOffer(data.fromPeerId, data.offer)
      const answer = await webrtcManager.createAnswer(data.fromPeerId)
      
      sendSignalingMessage('webrtc-answer', {
        toPeerId: data.fromPeerId,
        answer
      })
    } catch (error) {
      console.error('Failed to handle offer:', error)
      connectionErrors.value.push(`Offer handling failed: ${error.message}`)
    }
  }

  // Handle WebRTC answer
  const handleAnswer = async (data: any) => {
    if (!webrtcManager) return

    try {
      await webrtcManager.handleAnswer(data.fromPeerId, data.answer)
    } catch (error) {
      console.error('Failed to handle answer:', error)
      connectionErrors.value.push(`Answer handling failed: ${error.message}`)
    }
  }

  // Handle ICE candidate
  const handleIceCandidate = async (data: any) => {
    if (!webrtcManager) return

    try {
      await webrtcManager.handleIceCandidate(data.fromPeerId, data.candidate)
    } catch (error) {
      console.error('Failed to handle ICE candidate:', error)
    }
  }

  // Update peer information
  const updatePeerInfo = (peer: PeerConnection) => {
    const existingPeer = peers.get(peer.id)
    if (existingPeer) {
      existingPeer.connectionState = peer.connection.connectionState
      existingPeer.stream = peer.stream
    }
  }

  // Update peer media state
  const updatePeerMediaState = (data: any) => {
    const peer = peers.get(data.peerId)
    if (peer) {
      peer.mediaCapabilities = data.mediaCapabilities
    }
  }

  // Update peer quality
  const updatePeerQuality = (data: any) => {
    const peer = peers.get(data.peerId)
    if (peer) {
      // Update peer quality information
      console.log(`Peer ${data.peerId} changed quality to:`, data.quality)
    }
  }

  // Update connection statistics
  const updateConnectionStats = (peerId: string, stats: RTCStatsReport) => {
    const peer = peers.get(peerId)
    if (peer) {
      peer.stats = stats
      
      // Extract useful statistics
      const statsData: WebRTCStats = {
        bitrate: 0,
        packetsLost: 0,
        roundTripTime: 0,
        jitter: 0,
        resolution: { width: 0, height: 0 },
        frameRate: 0
      }

      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
          statsData.bitrate = report.bytesReceived * 8 / 1000 // Convert to kbps
          statsData.packetsLost = report.packetsLost || 0
          statsData.jitter = report.jitter || 0
        }
        
        if (report.type === 'track' && report.kind === 'video') {
          statsData.resolution.width = report.frameWidth || 0
          statsData.resolution.height = report.frameHeight || 0
          statsData.frameRate = report.framesPerSecond || 0
        }

        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          statsData.roundTripTime = report.currentRoundTripTime || 0
        }
      })

      connectionStats.set(peerId, statsData)
    }
  }

  // Guest invitation handlers
  const handleGuestInvitation = (data: any) => {
    // Emit event for UI to handle
    const event = new CustomEvent('guest-invitation-received', {
      detail: data
    })
    window.dispatchEvent(event)
  }

  const handleGuestInviteAccepted = (data: any) => {
    // Emit event for UI to handle
    const event = new CustomEvent('guest-invite-accepted', {
      detail: data
    })
    window.dispatchEvent(event)
  }

  const handleGuestInviteRejected = (data: any) => {
    // Emit event for UI to handle
    const event = new CustomEvent('guest-invite-rejected', {
      detail: data
    })
    window.dispatchEvent(event)
  }

  // Cleanup
  const disconnect = () => {
    if (webrtcManager) {
      webrtcManager.destroy()
      webrtcManager = null
    }

    if (signalingWs.value) {
      signalingWs.value.close()
      signalingWs.value = null
    }

    localStream.value = null
    isStreaming.value = false
    isSignalingConnected.value = false
    peers.clear()
    connectionStats.clear()
    connectionErrors.value = []
  }

  // Lifecycle
  onUnmounted(() => {
    disconnect()
  })

  return {
    // Initialization
    initializeWebRTC,
    connectSignaling,
    disconnect,

    // Connection state
    isSignalingConnected,
    connectionErrors,

    // Local stream
    localStream,
    isStreaming,
    isScreenSharing,
    startLocalStream,
    startScreenShare,
    stopScreenShare,

    // Media controls
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,

    // Quality management
    currentQuality,
    qualityPresets,
    changeQuality,

    // Peers
    peers,
    connectedPeers,
    activePeers,
    streamers,
    guests,
    viewers,

    // Statistics
    connectionStats,

    // Guest management
    inviteGuest,
    acceptGuestInvite,
    rejectGuestInvite,

    // Utility
    localPeerId
  }
}
