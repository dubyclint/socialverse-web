<!-- components/streaming/StreamControls.vue -->
<template>
  <div class="stream-controls-container">
    <!-- Stream Status -->
    <div class="stream-status" :class="statusClass">
      <div class="status-indicator">
        <span class="status-dot" :class="statusClass"></span>
        <span class="status-text">{{ statusText }}</span>
      </div>
      <div class="stream-info" v-if="stream">
        <span class="viewer-count">
          <Icon name="mdi:eye" />
          {{ formatNumber(stream.viewerCount || 0) }}
        </span>
        <span class="duration" v-if="stream.status === 'live'">
          <Icon name="mdi:clock" />
          {{ formatDuration(streamDuration) }}
        </span>
      </div>
    </div>

    <!-- Main Controls -->
    <div class="main-controls">
      <!-- Start/Stop Stream -->
      <div class="control-group">
        <button 
          v-if="stream?.status !== 'live'"
          @click="startStream"
          :disabled="isLoading || !canStartStream"
          class="control-btn primary start-btn"
        >
          🔴 Start Stream
        </button>
        <button 
          v-else
          @click="endStream"
          :disabled="isLoading"
          class="control-btn danger end-btn"
        >
          ⏹️ End Stream
        </button>
      </div>

      <!-- Pause/Resume -->
      <button 
        v-if="isStreaming"
        @click="pauseStream"
        class="control-btn secondary"
      >
        ⏸️ Pause
      </button>

      <!-- Camera Toggle -->
      <button 
        @click="toggleCamera"
        :class="{ active: isCameraOn }"
        class="control-btn"
      >
        {{ isCameraOn ? '📹' : '📹❌' }} Camera
      </button>

      <!-- Microphone Toggle -->
      <button 
        @click="toggleMicrophone"
        :class="{ active: isMicrophoneOn }"
        class="control-btn"
      >
        {{ isMicrophoneOn ? '🎤' : '🎤❌' }} Mic
      </button>

      <!-- Screen Share -->
      <button 
        @click="toggleScreenShare"
        :class="{ active: isScreenSharing }"
        class="control-btn"
      >
        {{ isScreenSharing ? '🖥️' : '🖥️❌' }} Screen
      </button>

      <!-- Settings -->
      <button 
        @click="openStreamSettings"
        class="control-btn"
      >
        ⚙️ Settings
      </button>

      <!-- Analytics -->
      <button 
        @click="openAnalytics"
        class="control-btn"
      >
        📊 Analytics
      </button>
    </div>

    <!-- Stream Preview -->
    <div v-if="showPreview" class="stream-preview">
      <div class="preview-header">
        <span>📹 Preview</span>
        <div class="preview-controls">
          <button @click="togglePreview" class="preview-btn">✕</button>
        </div>
      </div>
      <div class="preview-video-container">
        <video 
          ref="previewVideo"
          class="preview-video"
          autoplay
          muted
          playsinline
        ></video>
        <div class="preview-overlay">
          <div class="preview-info">
            <span class="quality-indicator">{{ currentQuality }}</span>
            <span class="bitrate-indicator">{{ currentBitrate }}kbps</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="quick-stats">
      <div class="stat-item">
        <div class="stat-info">
          <div class="stat-label">Resolution</div>
          <div class="stat-value">{{ settings.resolution }}</div>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-info">
          <div class="stat-label">Frame Rate</div>
          <div class="stat-value">{{ settings.frameRate }}fps</div>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-info">
          <div class="stat-label">Bitrate</div>
          <div class="stat-value">{{ settings.bitrate }}kbps</div>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-info">
          <div class="stat-label">Audio</div>
          <div class="stat-value">{{ settings.audioBitrate }}kbps</div>
        </div>
      </div>
    </div>

    <!-- Settings Modal -->
    <div v-if="showSettings" class="settings-modal" @click.self="closeSettings">
      <div class="settings-content">
        <div class="settings-header">
          <h3>Stream Settings</h3>
          <button @click="closeSettings" class="close-btn">✕</button>
        </div>

        <div class="settings-body">
          <!-- Video Settings -->
          <div class="settings-section">
            <h4>Video Settings</h4>
            <div class="setting-item">
              <label>Resolution</label>
              <select v-model="settings.resolution" @change="updateVideoSettings">
                <option value="1920x1080">1920x1080 (1080p)</option>
                <option value="1280x720">1280x720 (720p)</option>
                <option value="854x480">854x480 (480p)</option>
              </select>
            </div>
            <div class="setting-item">
              <label>Frame Rate</label>
              <input v-model.number="settings.frameRate" type="range" min="15" max="60" step="5">
              <span>{{ settings.frameRate }}fps</span>
            </div>
            <div class="setting-item">
              <label>Bitrate</label>
              <input v-model.number="settings.bitrate" type="range" min="500" max="8000" step="100">
              <span>{{ settings.bitrate }}kbps</span>
            </div>
          </div>

          <!-- Audio Settings -->
          <div class="settings-section">
            <h4>Audio Settings</h4>
            <div class="setting-item">
              <label>Audio Source</label>
              <select v-model="settings.audioSource">
                <option value="default">Default</option>
                <option v-for="device in audioDevices" :key="device.deviceId" :value="device.deviceId">
                  {{ device.label }}
                </option>
              </select>
            </div>
            <div class="setting-item">
              <label>Audio Bitrate</label>
              <input v-model.number="settings.audioBitrate" type="range" min="32" max="320" step="32">
              <span>{{ settings.audioBitrate }}kbps</span>
            </div>
          </div>

          <!-- Feature Settings -->
          <div class="settings-section">
            <h4>Features</h4>
            <div class="setting-item">
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.chatEnabled">
                <span>Enable Chat</span>
              </label>
            </div>
            <div class="setting-item">
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.pewGiftsEnabled">
                <span>Enable PEW Gifts</span>
              </label>
            </div>
            <div class="setting-item">
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.recordStream">
                <span>Record Stream</span>
              </label>
            </div>
          </div>
          
          <div class="settings-footer">
            <button @click="saveSettings" class="save-btn">Save Settings</button>
            <button @click="closeSettings" class="cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>{{ loadingMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useStreaming } from '~/composables/use-streaming'

interface Props {
  streamId?: string
  stream?: any
}

const props = defineProps<Props>()
const emit = defineEmits(['stream-started', 'stream-ended', 'settings-updated'])

// Composables
const { 
  startStreamBroadcast, 
  endStreamBroadcast, 
  pauseStreamBroadcast,
  updateStreamSettings 
} = useStreaming()

// Refs
const previewVideo = ref<HTMLVideoElement>()
const isLoading = ref(false)
const loadingMessage = ref('')
const showPreview = ref(true)
const showSettings = ref(false)
const streamDuration = ref(0)

// Media states
const isCameraOn = ref(true)
const isMicrophoneOn = ref(true)
const isScreenSharing = ref(false)
const currentQuality = ref('1080p')
const currentBitrate = ref(2500)

// Device lists
const audioDevices = ref([])
const videoDevices = ref([])

// Settings
const settings = ref({
  resolution: '1280x720',
  frameRate: 30,
  bitrate: 2500,
  audioSource: 'default',
  audioBitrate: 128,
  chatEnabled: true,
  pewGiftsEnabled: true,
  recordStream: true
})

// Computed
const isStreaming = computed(() => {
  return props.stream?.status === 'live'
})

const canStartStream = computed(() => {
  return props.stream && ['scheduled', 'ended'].includes(props.stream.status)
})

const statusClass = computed(() => {
  switch (props.stream?.status) {
    case 'live': return 'live'
    case 'paused': return 'paused'
    case 'ended': return 'ended'
    default: return 'offline'
  }
})

const statusText = computed(() => {
  switch (props.stream?.status) {
    case 'live': return 'LIVE'
    case 'paused': return 'PAUSED'
    case 'ended': return 'ENDED'
    case 'scheduled': return 'SCHEDULED'
    default: return 'OFFLINE'
  }
})

// Methods
const startStream = async () => {
  if (!props.streamId) return
  
  isLoading.value = true
  loadingMessage.value = 'Starting stream...'
  
  try {
    await startStreamBroadcast(props.streamId)
    await initializeMediaDevices()
    emit('stream-started')
  } catch (error) {
    console.error('Failed to start stream:', error)
  } finally {
    isLoading.value = false
  }
}

const endStream = async () => {
  if (!props.streamId) return
  
  isLoading.value = true
  loadingMessage.value = 'Ending stream...'
  
  try {
    await endStreamBroadcast(props.streamId)
    await stopMediaDevices()
    emit('stream-ended')
  } catch (error) {
    console.error('Failed to end stream:', error)
  } finally {
    isLoading.value = false
  }
}

const pauseStream = async () => {
  if (!props.streamId) return
  
  try {
    await pauseStreamBroadcast(props.streamId)
  } catch (error) {
    console.error('Failed to pause stream:', error)
  }
}

const toggleCamera = async () => {
  isCameraOn.value = !isCameraOn.value
  // Implementation for toggling camera
}

const toggleMicrophone = async () => {
  isMicrophoneOn.value = !isMicrophoneOn.value
  // Implementation for toggling microphone
}

const toggleScreenShare = async () => {
  isScreenSharing.value = !isScreenSharing.value
  // Implementation for screen sharing
}

const togglePreview = () => {
  showPreview.value = !showPreview.value
}

const openStreamSettings = () => {
  showSettings.value = true
}

const closeSettings = () => {
  showSettings.value = false
}

const openAnalytics = () => {
  // Navigate to analytics page
  navigateTo(`/live/analytics/${props.streamId}`)
}

const saveSettings = async () => {
  try {
    if (props.streamId) {
      await updateStreamSettings(props.streamId, settings.value)
      emit('settings-updated', settings.value)
    }
    closeSettings()
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

const updateVideoSettings = () => {
  // Apply video settings to stream
  currentQuality.value = settings.value.resolution.split('x')[1] + 'p'
  currentBitrate.value = settings.value.bitrate
}

const initializeMediaDevices = async () => {
  try {
    // Get user media
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: parseInt(settings.value.resolution.split('x')[0]) },
        height: { ideal: parseInt(settings.value.resolution.split('x')[1]) },
        frameRate: { ideal: settings.value.frameRate }
      },
      audio: {
        deviceId: settings.value.audioSource !== 'default' ? settings.value.audioSource : undefined
      }
    })
    
    if (previewVideo.value) {
      previewVideo.value.srcObject = stream
    }
    
    // Get available devices
    const devices = await navigator.mediaDevices.enumerateDevices()
    audioDevices.value = devices.filter(device => device.kind === 'audioinput')
    videoDevices.value = devices.filter(device => device.kind === 'videoinput')
    
  } catch (error) {
    console.error('Failed to initialize media devices:', error)
  }
}

const stopMediaDevices = () => {
  if (previewVideo.value?.srcObject) {
    const stream = previewVideo.value.srcObject as MediaStream
    stream.getTracks().forEach(track => track.stop())
    previewVideo.value.srcObject = null
  }
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// Stream duration timer
let durationInterval: NodeJS.Timeout
const startDurationTimer = () => {
  if (props.stream?.startTime) {
    durationInterval = setInterval(() => {
      const startTime = new Date(props.stream.startTime).getTime()
      const now = Date.now()
      streamDuration.value = Math.floor((now - startTime) / 1000)
    }, 1000)
  }
}

const stopDurationTimer = () => {
  if (durationInterval) {
    clearInterval(durationInterval)
  }
}

// Lifecycle
onMounted(async () => {
  // Initialize devices list
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    audioDevices.value = devices.filter(device => device.kind === 'audioinput')
    videoDevices.value = devices.filter(device => device.kind === 'videoinput')
  } catch (error) {
    console.error('Failed to get media devices:', error)
  }
  
  // Start duration timer if stream is live
  if (props.stream?.status === 'live') {
    startDurationTimer()
  }
})

onUnmounted(() => {
  stopMediaDevices()
  stopDurationTimer()
})

// Watch for stream status changes
watch(() => props.stream?.status, (newStatus, oldStatus) => {
  if (newStatus === 'live' && oldStatus !== 'live') {
    startDurationTimer()
  } else if (newStatus !== 'live' && oldStatus === 'live') {
    stopDurationTimer()
  }
})
</script>

<style scoped>
.stream-controls-container {
  @apply bg-gray-900 text-white rounded-lg p-6 space-y-6;
}

.stream-status {
  @apply flex items-center justify-between p-4 rounded-lg border-2;
}

.stream-status.live {
  @apply bg-red-900 bg-opacity-30 border-red-500;
}

.stream-status.paused {
  @apply bg-yellow-900 bg-opacity-30 border-yellow-500;
}

.stream-status.ended {
  @apply bg-gray-700 bg-opacity-30 border-gray-500;
}

.stream-status.offline {
  @apply bg-gray-800 bg-opacity-30 border-gray-600;
}

.status-indicator {
  @apply flex items-center gap-3;
}

.status-dot {
  @apply w-3 h-3 rounded-full;
}

.status-dot.live {
  @apply bg-red-500 animate-pulse;
}

.status-dot.paused {
  @apply bg-yellow-500;
}

.status-dot.ended {
  @apply bg-gray-500;
}

.status-dot.offline {
  @apply bg-gray-600;
}

.status-text {
  @apply font-bold text-lg;
}

.stream-info {
  @apply flex items-center gap-4 text-sm;
}

.main-controls {
  @apply flex flex-wrap gap-4;
}

.control-group {
  @apply flex items-center gap-2;
}

.control-btn {
  @apply flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.control-btn.primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white;
}

.control-btn.secondary {
  @apply bg-gray-600 hover:bg-gray-700 text-white;
}

.control-btn.danger {
  @apply bg-red-600 hover:bg-red-700 text-white;
}

.control-btn:not(.primary):not(.secondary):not(.danger) {
  @apply bg-gray-700 hover:bg-gray-600 text-white;
}

.control-btn.active {
  @apply bg-green-600 hover:bg-green-700;
}

.start-btn {
  @apply text-lg px-6 py-3;
}

.end-btn {
  @apply text-lg px-6 py-3;
}

.stream-preview {
  @apply bg-gray-800 rounded-lg overflow-hidden;
}

.preview-header {
  @apply flex items-center justify-between p-3 border-b border-gray-700;
}

.preview-controls {
  @apply flex items-center gap-2;
}

.preview-btn {
  @apply p-2 hover:bg-gray-700 rounded-lg transition-colors;
}

.preview-video-container {
  @apply relative aspect-video bg-black;
}

.preview-video {
  @apply w-full h-full object-cover;
}

.preview-overlay {
  @apply absolute top-2 right-2;
}

.preview-info {
  @apply flex items-center gap-2 bg-black bg-opacity-50 px-2 py-1 rounded text-sm;
}

.quality-indicator,
.bitrate-indicator {
  @apply text-green-400;
}

.quick-stats {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4;
}

.stat-item {
  @apply flex items-center gap-3 p-3 bg-gray-800 rounded-lg;
}

.stat-info {
  @apply flex flex-col;
}

.stat-value {
  @apply text-lg font-bold;
}

.stat-label {
  @apply text-sm text-gray-400;
}

.settings-modal {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.settings-content {
  @apply bg-gray-800 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto;
}

.settings-header {
  @apply flex items-center justify-between p-4 border-b border-gray-700;
}

.close-btn {
  @apply p-2 hover:bg-gray-700 rounded-lg transition-colors;
}

.settings-body {
  @apply p-4 space-y-6;
}

.settings-section {
  @apply space-y-4;
}

.settings-section h4 {
  @apply text-lg font-semibold border-b border-gray-700 pb-2;
}

.setting-item {
  @apply flex items-center justify-between gap-4;
}

.setting-item label {
  @apply flex items-center gap-2 text-sm;
}

.setting-item select,
.setting-item input[type="range"] {
  @apply bg-gray-700 border border-gray-600 rounded px-3 py-2;
}

.setting-item input[type="checkbox"] {
  @apply w-4 h-4;
}

.settings-footer {
  @apply flex items-center justify-end gap-3 p-4 border-t border-gray-700;
}

.save-btn {
  @apply bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors;
}

.cancel-btn {
  @apply bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors;
}

.loading-overlay {
  @apply absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center;
}

.loading-spinner {
  @apply w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4;
}
</style>
