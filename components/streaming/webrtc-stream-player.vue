<!-- components/streaming/WebRTCStreamPlayer.vue -->
<template>
  <div class="webrtc-stream-player">
    <!-- Main Stream Container -->
    <div class="stream-container" :class="{ 'multi-stream': activePeers.length > 1 }">
      <!-- Primary Stream (Main streamer or selected peer) -->
      <div class="primary-stream" :class="{ 'fullscreen': isFullscreen }">
        <video
          ref="primaryVideoRef"
          class="primary-video"
          autoplay
          playsinline
          :muted="isPrimaryMuted"
          @click="toggleFullscreen"
        />
        
        <!-- Stream Overlay -->
        <div class="stream-overlay" :class="{ 'visible': showControls }">
          <!-- Live Indicator -->
          <div class="live-indicator" v-if="isLive">
            <span class="live-dot"></span>
            LIVE
          </div>
          
          <!-- Viewer Count -->
          <div class="viewer-count">
            <Icon name="mdi:eye" />
            {{ formatNumber(viewerCount) }}
          </div>
          
          <!-- Connection Quality -->
          <div class="connection-quality" :class="connectionQuality.status">
            <Icon :name="connectionQuality.icon" />
            <span>{{ connectionQuality.label }}</span>
          </div>
        </div>

        <!-- Stream Controls -->
        <div class="stream-controls" :class="{ 'visible': showControls }">
          <div class="controls-left">
            <button @click="togglePrimaryMute" class="control-btn">
              <Icon :name="isPrimaryMuted ? 'mdi:volume-off' : 'mdi:volume-high'" />
            </button>
            
            <div class="volume-slider" v-if="!isPrimaryMuted">
              <input
                type="range"
                min="0"
                max="100"
                v-model="primaryVolume"
                @input="setPrimaryVolume"
              />
            </div>
          </div>
          
          <div class="controls-center">
            <!-- Quality Selector -->
            <div class="quality-selector" v-if="isStreamer">
              <select v-model="selectedQuality" @change="changeStreamQuality">
                <option v-for="quality in qualityPresets" :key="quality.label" :value="quality">
                  {{ quality.label }}
                </option>
              </select>
            </div>
          </div>
          
          <div class="controls-right">
            <button @click="toggleFullscreen" class="control-btn">
              <Icon :name="isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'" />
            </button>
          </div>
        </div>

        <!-- Loading Overlay -->
        <div v-if="isConnecting" class="loading-overlay">
          <div class="loading-spinner"></div>
          <p>Connecting to stream...</p>
        </div>

        <!-- Error Overlay -->
        <div v-if="connectionErrors.length > 0" class="error-overlay">
          <div class="error-content">
            <Icon name="mdi:alert-circle" size="48" />
            <h3>Connection Error</h3>
            <p>{{ connectionErrors[connectionErrors.length - 1] }}</p>
            <button @click="retryConnection" class="retry-btn">
              <Icon name="mdi:refresh" />
              Retry Connection
            </button>
          </div>
        </div>
      </div>

      <!-- Secondary Streams (Guests and other participants) -->
      <div class="secondary-streams" v-if="activePeers.length > 1">
        <div 
          v-for="peer in secondaryPeers" 
          :key="peer.peerId"
          class="secondary-stream"
          :class="{ 'selected': selectedPeerId === peer.peerId }"
          @click="selectPrimaryPeer(peer.peerId)"
        >
          <video
            :ref="el => setPeerVideoRef(peer.peerId, el)"
            class="secondary-video"
            autoplay
            playsinline
            muted
          />
          
          <!-- Peer Info Overlay -->
          <div class="peer-info">
            <div class="peer-avatar" v-if="peer.avatar">
              <img :src="peer.avatar" :alt="peer.username" />
            </div>
            <div class="peer-details">
              <span class="peer-name">{{ peer.username }}</span>
              <div class="peer-badges">
                <span v-if="peer.isStreamer" class="badge streamer">Streamer</span>
                <span v-if="peer.isGuest" class="badge guest">Guest</span>
              </div>
            </div>
          </div>
          
          <!-- Media State Indicators -->
          <div class="media-indicators">
            <Icon 
              v-if="!peer.mediaCapabilities.audio" 
              name="mdi:microphone-off" 
              class="muted-indicator"
            />
            <Icon 
              v-if="!peer.mediaCapabilities.video" 
              name="mdi:video-off" 
              class="video-off-indicator"
            />
          </div>
          
          <!-- Connection Stats -->
          <div class="connection-stats" v-if="showStats && connectionStats.has(peer.peerId)">
            <div class="stat-item">
              <span class="stat-label">Quality:</span>
              <span class="stat-value">{{ getPeerResolution(peer.peerId) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Bitrate:</span>
              <span class="stat-value">{{ getPeerBitrate(peer.peerId) }} kbps</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stream Statistics Panel -->
    <div class="stats-panel" v-if="showStats && isStreamer">
      <h3>Stream Statistics</h3>
      <div class="stats-grid">
        <div class="stat-card" v-for="peer in activePeers" :key="peer.peerId">
          <div class="stat-header">
            <span class="peer-name">{{ peer.username }}</span>
            <span class="connection-state" :class="peer.connectionState">
              {{ peer.connectionState }}
            </span>
          </div>
          <div class="stat-details" v-if="connectionStats.has(peer.peerId)">
            <div class="stat-row">
              <span>Resolution:</span>
              <span>{{ getPeerResolution(peer.peerId) }}</span>
            </div>
            <div class="stat-row">
              <span>Frame Rate:</span>
              <span>{{ getPeerFrameRate(peer.peerId) }} fps</span>
            </div>
            <div class="stat-row">
              <span>Bitrate:</span>
              <span>{{ getPeerBitrate(peer.peerId) }} kbps</span>
            </div>
            <div class="stat-row">
              <span>Packets Lost:</span>
              <span>{{ getPeerPacketsLost(peer.peerId) }}</span>
            </div>
            <div class="stat-row">
              <span>RTT:</span>
              <span>{{ getPeerRTT(peer.peerId) }} ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Guest Invitation Modal -->
    <div class="guest-invitation-modal" v-if="showGuestInvitation">
      <div class="modal-content">
        <h3>Guest Invitation</h3>
        <p>{{ guestInvitation.inviterUsername }} has invited you to join their stream as a guest.</p>
        <div class="modal-actions">
          <button @click="acceptGuestInvitation" class="accept-btn">
            <Icon name="mdi:check" />
            Accept
          </button>
          <button @click="rejectGuestInvitation" class="reject-btn">
            <Icon name="mdi:close" />
            Decline
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useWebRTC } from '~/composables/use-webrtc'

interface Props {
  streamId: string
  userId: string
  username: string
  avatar?: string
  isStreamer?: boolean
  isGuest?: boolean
  viewerCount?: number
  isLive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isStreamer: false,
  isGuest: false,
  viewerCount: 0,
  isLive: false
})

// WebRTC composable
const {
  initializeWebRTC,
  connectSignaling,
  disconnect,
  isSignalingConnected,
  connectionErrors,
  localStream,
  isStreaming,
  isScreenSharing,
  startLocalStream,
  startScreenShare,
  stopScreenShare,
  isAudioEnabled,
  isVideoEnabled,
  toggleAudio,
  toggleVideo,
  currentQuality,
  qualityPresets,
  changeQuality,
  peers,
  activePeers,
  streamers,
  guests,
  viewers,
  connectionStats,
  inviteGuest,
  acceptGuestInvite,
  rejectGuestInvite,
  localPeerId
} = useWebRTC(props.streamId)

// Component state
const primaryVideoRef = ref<HTMLVideoElement>()
const peerVideoRefs = ref<Map<string, HTMLVideoElement>>(new Map())
const isFullscreen = ref(false)
const showControls = ref(true)
const showStats = ref(false)
const isConnecting = ref(false)
const selectedPeerId = ref<string>('')
const isPrimaryMuted = ref(false)
const primaryVolume = ref(100)
const selectedQuality = ref()

// Guest invitation state
const showGuestInvitation = ref(false)
const guestInvitation = ref<any>({})

// Computed properties
const secondaryPeers = computed(() => 
  activePeers.value.filter(peer => peer.peerId !== selectedPeerId.value)
)

const connectionQuality = computed(() => {
  const errors = connectionErrors.value.length
  const connectedCount = activePeers.value.length
  
  if (errors > 0) return { status: 'poor', icon: 'mdi:signal-cellular-1', label: 'Poor' }
  if (connectedCount === 0) return { status: 'disconnected', icon: 'mdi:signal-cellular-off', label: 'Disconnected' }
  if (connectedCount >= 3) return { status: 'excellent', icon: 'mdi:signal-cellular-3', label: 'Excellent' }
  return { status: 'good', icon: 'mdi:signal-cellular-2', label: 'Good' }
})

// Methods
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

const setPeerVideoRef = (peerId: string, el: HTMLVideoElement | null) => {
  if (el) {
    peerVideoRefs.value.set(peerId, el)
  }
}

const selectPrimaryPeer = (peerId: string) => {
  selectedPeerId.value = peerId
  updatePrimaryVideo()
}

const updatePrimaryVideo = async () => {
  await nextTick()
  
  let targetStream: MediaStream | null = null
  
  if (selectedPeerId.value) {
    const selectedPeer = peers.get(selectedPeerId.value)
    targetStream = selectedPeer?.stream || null
  } else if (props.isStreamer && localStream.value) {
    targetStream = localStream.value
  } else if (streamers.value.length > 0) {
    targetStream = streamers.value[0].stream || null
    selectedPeerId.value = streamers.value[0].peerId
  }
  
  if (primaryVideoRef.value && targetStream) {
    primaryVideoRef.value.srcObject = targetStream
  }
}

const updateSecondaryVideos = async () => {
  await nextTick()
  
  for (const peer of secondaryPeers.value) {
    const videoElement = peerVideoRefs.value.get(peer.peerId)
    if (videoElement && peer.stream) {
      videoElement.srcObject = peer.stream
    }
  }
}

const togglePrimaryMute = () => {
  isPrimaryMuted.value = !isPrimaryMuted.value
  if (primaryVideoRef.value) {
    primaryVideoRef.value.muted = isPrimaryMuted.value
  }
}

const setPrimaryVolume = () => {
  if (primaryVideoRef.value) {
    primaryVideoRef.value.volume = primaryVolume.value / 100
  }
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    primaryVideoRef.value?.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

const changeStreamQuality = async () => {
  if (selectedQuality.value) {
    await changeQuality(selectedQuality.value)
  }
}

const retryConnection = async () => {
  connectionErrors.value = []
  isConnecting.value = true
  
  try {
    await connectSignaling(
      props.userId,
      props.username,
      props.avatar,
      props.isStreamer,
      props.isGuest
    )
  } catch (error) {
    console.error('Retry connection failed:', error)
  } finally {
    isConnecting.value = false
  }
}

// Statistics helpers
const getPeerResolution = (peerId: string): string => {
  const stats = connectionStats.get(peerId)
  if (stats && stats.resolution.width > 0) {
    return `${stats.resolution.width}x${stats.resolution.height}`
  }
  return 'Unknown'
}

const getPeerFrameRate = (peerId: string): number => {
  const stats = connectionStats.get(peerId)
  return stats?.frameRate || 0
}

const getPeerBitrate = (peerId: string): number => {
  const stats = connectionStats.get(peerId)
  return Math.round(stats?.bitrate || 0)
}

const getPeerPacketsLost = (peerId: string): number => {
  const stats = connectionStats.get(peerId)
  return stats?.packetsLost || 0
}

const getPeerRTT = (peerId: string): number => {
  const stats = connectionStats.get(peerId)
  return Math.round((stats?.roundTripTime || 0) * 1000)
}

// Guest invitation handlers
const acceptGuestInvitation = async () => {
  await acceptGuestInvite(guestInvitation.value.inviterUserId)
  showGuestInvitation.value = false
  
  // Start local stream for guest
  try {
    await startLocalStream()
  } catch (error) {
    console.error('Failed to start guest stream:', error)
  }
}

const rejectGuestInvitation = async () => {
  await rejectGuestInvite(guestInvitation.value.inviterUserId)
  showGuestInvitation.value = false
}

// Event listeners
const handleGuestInvitation = (event: CustomEvent) => {
  if (event.detail.targetUserId === props.userId) {
    guestInvitation.value = event.detail
    showGuestInvitation.value = true
  }
}

const handleControlsVisibility = () => {
  showControls.value = true
  setTimeout(() => {
    showControls.value = false
  }, 3000)
}

// Watchers
watch(activePeers, () => {
  updatePrimaryVideo()
  updateSecondaryVideos()
}, { deep: true })

watch(localStream, () => {
  if (props.isStreamer) {
    updatePrimaryVideo()
  }
})

watch(currentQuality, (newQuality) => {
  if (newQuality) {
    selectedQuality.value = newQuality
  }
})

// Lifecycle
onMounted(async () => {
  try {
    isConnecting.value = true
    
    // Initialize WebRTC
    await initializeWebRTC({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    })
    
    // Connect to signaling server
    await connectSignaling(
      props.userId,
      props.username,
      props.avatar,
      props.isStreamer,
      props.isGuest
    )
    
    // Start local stream if streamer
    if (props.isStreamer) {
      await startLocalStream()
    }
    
    // Set initial quality
    selectedQuality.value = currentQuality.value
    
  } catch (error) {
    console.error('Failed to initialize WebRTC stream:', error)
  } finally {
    isConnecting.value = false
  }
  
  // Add event listeners
  window.addEventListener('guest-invitation-received', handleGuestInvitation)
  document.addEventListener('mousemove', handleControlsVisibility)
  document.addEventListener('keydown', handleControlsVisibility)
  
  // Handle fullscreen changes
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})

onUnmounted(() => {
  disconnect()
  
  // Remove event listeners
  window.removeEventListener('guest-invitation-received', handleGuestInvitation)
  document.removeEventListener('mousemove', handleControlsVisibility)
  document.removeEventListener('keydown', handleControlsVisibility)
})
</script>

<style scoped>
.webrtc-stream-player {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
}

.stream-container {
  display: flex;
  width: 100%;
  height: 100%;
}

.stream-container.multi-stream {
  flex-direction: row;
}

.primary-stream {
  position: relative;
  flex: 1;
  background: #000;
}

.primary-stream.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
}

.primary-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.stream-overlay {
  position: absolute;
  top: 1rem;
  left: 1rem;
  right: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.stream-overlay.visible {
  opacity: 1;
  pointer-events: auto;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(220, 38, 38, 0.9);
  color: white;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

.live-dot {
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.viewer-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 20px;
  font-size: 0.875rem;
}

.connection-quality {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.connection-quality.excellent {
  background: rgba(34, 197, 94, 0.9);
  color: white;
}

.connection-quality.good {
  background: rgba(59, 130, 246, 0.9);
  color: white;
}

.connection-quality.poor {
  background: rgba(239, 68, 68, 0.9);
  color: white;
}

.connection-quality.disconnected {
  background: rgba(107, 114, 128, 0.9);
  color: white;
}

.stream-controls {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  right: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.stream-controls.visible {
  opacity: 1;
  pointer-events: auto;
}

.controls-left,
.controls-center,
.controls-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s;
}

.control-btn:hover {
  background: rgba(0, 0, 0, 0.9);
}

.volume-slider {
  width: 80px;
}

.volume-slider input {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.quality-selector select {
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  cursor: pointer;
}

.secondary-streams {
  display: flex;
  flex-direction: column;
  width: 200px;
  background: #1f2937;
  overflow-y: auto;
}

.secondary-stream {
  position: relative;
  height: 150px;
  border-bottom: 1px solid #374151;
  cursor: pointer;
  transition: background 0.2s;
}

.secondary-stream:hover {
  background: #374151;
}

.secondary-stream.selected {
  background: #3b82f6;
}

.secondary-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.peer-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0.5rem;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
}

.peer-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.peer-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.peer-name {
  font-size: 0.75rem;
  font-weight: 500;
  display: block;
  margin-bottom: 0.25rem;
}

.peer-badges {
  display: flex;
  gap: 0.25rem;
}

.badge {
  padding: 0.125rem 0.375rem;
  font-size: 0.625rem;
  border-radius: 10px;
  font-weight: 500;
}

.badge.streamer {
  background: #dc2626;
  color: white;
}

.badge.guest {
  background: #7c3aed;
  color: white;
}

.media-indicators {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.25rem;
}

.muted-indicator,
.video-off-indicator {
  padding: 0.25rem;
  background: rgba(0, 0, 0, 0.7);
  color: #ef4444;
  border-radius: 4px;
  font-size: 0.75rem;
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  color: white;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-content {
  text-align: center;
}

.error-content h3 {
  margin: 1rem 0 0.5rem;
  font-size: 1.25rem;
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 1rem;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #2563eb;
}

.stats-panel {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 300px;
  max-height: 400px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  border-radius: 8px;
  padding: 1rem;
  overflow-y: auto;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 0.75rem;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.connection-state {
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 500;
}

.connection-state.connected {
  background: #059669;
  color: white;
}

.connection-state.connecting {
  background: #d97706;
  color: white;
}

.connection-state.disconnected {
  background: #dc2626;
  color: white;
}

.stat-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.guest-invitation-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  z-index: 10000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 400px;
  text-align: center;
}

.modal-content h3 {
  margin-bottom: 1rem;
  color: #1f2937;
}

.modal-content p {
  margin-bottom: 2rem;
  color: #6b7280;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.accept-btn,
.reject-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.accept-btn {
  background: #059669;
  color: white;
}

.accept-btn:hover {
  background: #047857;
}

.reject-btn {
  background: #dc2626;
  color: white;
}

.reject-btn:hover {
  background: #b91c1c;
}

@media (max-width: 768px) {
  .stream-container.multi-stream {
    flex-direction: column;
  }
  
  .secondary-streams {
    width: 100%;
    height: 120px;
    flex-direction: row;
    overflow-x: auto;
  }
  
  .secondary-stream {
    min-width: 160px;
    height: 100%;
  }
  
  .stats-panel {
    position: relative;
    width: 100%;
    margin-top: 1rem;
  }
}
</style>
