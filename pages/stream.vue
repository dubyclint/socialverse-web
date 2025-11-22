<!-- FILE 1: pages/stream.vue - STREAMING PAGE COMPONENT -->
<!-- ============================================================================
     STREAMING PAGE - MAIN STREAMING INTERFACE
     ============================================================================ -->

<template>
  <div class="stream-page">
    <!-- Header -->
    <div class="stream-header">
      <div class="header-content">
        <h1>📱 Live Streaming</h1>
        <p class="subtitle">Broadcast to your audience in real-time</p>
      </div>
      <div class="header-actions">
        <button @click="navigateTo('/stream/history')" class="btn-secondary">
          📹 Stream History
        </button>
        <button @click="navigateTo('/stream/settings')" class="btn-secondary">
          ⚙️ Settings
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="stream-container">
      <!-- Camera Stream Section -->
      <div class="stream-section">
        <div class="section-title">
          <h2>📹 Camera Stream</h2>
          <span v-if="isStreaming" class="live-badge">🔴 LIVE</span>
        </div>

        <MobileCameraStream
          :stream-id="currentStreamId"
          @stream-started="onStreamStarted"
          @stream-ended="onStreamEnded"
          @error="onStreamError"
        />
      </div>

      <!-- Stream Info Section -->
      <div class="stream-info-section">
        <div class="info-card">
          <h3>Stream Information</h3>
          
          <div v-if="isStreaming" class="stream-stats">
            <div class="stat-item">
              <span class="stat-label">👥 Viewers</span>
              <span class="stat-value">{{ viewerCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">⏱️ Duration</span>
              <span class="stat-value">{{ formatDuration(streamDuration) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">📊 Bitrate</span>
              <span class="stat-value">{{ streamStats?.bitrate || 0 }} kbps</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">🎬 FPS</span>
              <span class="stat-value">{{ streamStats?.frameRate || 0 }}</span>
            </div>
          </div>

          <div v-else class="no-stream-info">
            <p>Start streaming to see live statistics</p>
          </div>
        </div>

        <!-- Chat Section -->
        <div class="chat-section">
          <h3>💬 Live Chat</h3>
          <div class="chat-messages">
            <div v-for="msg in chatMessages" :key="msg.id" class="chat-message">
              <div class="message-header">
                <strong>{{ msg.username }}</strong>
                <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
              </div>
              <p class="message-content">{{ msg.content }}</p>
            </div>
          </div>
          <div class="chat-input">
            <input
              v-model="chatInput"
              type="text"
              placeholder="Send a message..."
              @keyup.enter="sendChatMessage"
            />
            <button @click="sendChatMessage" class="btn-send">Send</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Viewers List -->
    <div v-if="isStreaming && viewers.length > 0" class="viewers-section">
      <h3>👥 Active Viewers ({{ viewers.length }})</h3>
      <div class="viewers-grid">
        <div v-for="viewer in viewers" :key="viewer.id" class="viewer-card">
          <img :src="viewer.avatar" :alt="viewer.username" class="viewer-avatar" />
          <p class="viewer-name">{{ viewer.username }}</p>
          <span v-if="viewer.isFollowing" class="following-badge">Following</span>
        </div>
      </div>
    </div>

    <!-- Gifts Section -->
    <div v-if="isStreaming" class="gifts-section">
      <h3>🎁 Received Gifts</h3>
      <div class="gifts-list">
        <div v-for="gift in receivedGifts" :key="gift.id" class="gift-item">
          <span class="gift-emoji">{{ gift.emoji }}</span>
          <div class="gift-info">
            <p class="gift-sender">{{ gift.senderName }}</p>
            <p class="gift-name">{{ gift.giftName }} x{{ gift.quantity }}</p>
          </div>
          <span class="gift-value">{{ gift.value }} PEW</span>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="error-banner">
      <p>{{ errorMessage }}</p>
      <button @click="errorMessage = ''" class="btn-close">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'language-check', 'status-middleware'],
  layout: 'default'
})
  
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStreamBroadcast } from '~/composables/useStream-Broadcast'
import MobileCameraStream from '~/components/streaming/mobile-camera-stream.vue'

const router = useRouter()
const user = useAuthStore()

// Stream state
const currentStreamId = ref<string | null>(null)
const isStreaming = ref(false)
const errorMessage = ref('')

// Stream data
const viewerCount = ref(0)
const streamDuration = ref(0)
const streamStats = ref(null)
const viewers = ref<any[]>([])
const receivedGifts = ref<any[]>([])

// Chat
const chatMessages = ref<any[]>([])
const chatInput = ref('')

// WebSocket connection
let ws: WebSocket | null = null

const { 
  isRecording, 
  isLive, 
  viewerCount: broadcastViewers,
  streamDuration: broadcastDuration,
  streamStats: broadcastStats,
  startStream,
  stopStream
} = useStreamBroadcast()

// Format duration
const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// Format time
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}

// Stream started
const onStreamStarted = async (config: any) => {
  try {
    currentStreamId.value = config.streamId
    isStreaming.value = true

    // Create stream record
    const response = await $fetch('/api/stream', {
      method: 'POST',
      body: {
        action: 'create',
        title: config.title,
        category: config.category,
        privacy: config.privacy,
        quality: config.quality
      }
    })

    if (response.success) {
      currentStreamId.value = response.data.id
      
      // Connect WebSocket for real-time updates
      connectWebSocket(response.data.id)
    }
  } catch (err: any) {
    errorMessage.value = 'Failed to start stream: ' + err.message
    isStreaming.value = false
  }
}

// Stream ended
const onStreamEnded = async () => {
  try {
    if (currentStreamId.value) {
      await $fetch(`/api/stream/${currentStreamId.value}`, {
        method: 'POST',
        body: {
          action: 'end',
          duration: streamDuration.value
        }
      })
    }

    isStreaming.value = false
    disconnectWebSocket()
    currentStreamId.value = null
  } catch (err: any) {
    errorMessage.value = 'Error ending stream: ' + err.message
  }
}

// Stream error
const onStreamError = (error: string) => {
  errorMessage.value = error
}

// Connect WebSocket
const connectWebSocket = (streamId: string) => {
  try {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/stream/${streamId}/ws`
    
    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('WebSocket connected')
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      handleWebSocketMessage(data)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
    }
  } catch (err) {
    console.error('Failed to connect WebSocket:', err)
  }
}

// Disconnect WebSocket
const disconnectWebSocket = () => {
  if (ws) {
    ws.close()
    ws = null
  }
}

// Handle WebSocket messages
const handleWebSocketMessage = (data: any) => {
  switch (data.type) {
    case 'viewer-joined':
      viewers.value.push(data.viewer)
      viewerCount.value++
      break
    case 'viewer-left':
      viewers.value = viewers.value.filter(v => v.id !== data.viewerId)
      viewerCount.value--
      break
    case 'chat-message':
      chatMessages.value.push(data.message)
      break
    case 'gift-received':
      receivedGifts.value.unshift(data.gift)
      break
    case 'stats-update':
      streamStats.value = data.stats
      break
  }
}

// Send chat message
const sendChatMessage = async () => {
  if (!chatInput.value.trim() || !currentStreamId.value) return

  try {
    await $fetch(`/api/stream/${currentStreamId.value}/chat`, {
      method: 'POST',
      body: {
        content: chatInput.value
      }
    })

    chatInput.value = ''
  } catch (err) {
    console.error('Failed to send message:', err)
  }
}

// Update stats
const updateStats = () => {
  if (isStreaming.value) {
    viewerCount.value = broadcastViewers.value
    streamDuration.value = broadcastDuration.value
    streamStats.value = broadcastStats.value
  }
}

// Lifecycle
onMounted(() => {
  // Check if user is authenticated
  if (!user.isAuthenticated) {
    navigateTo('/login')
    return
  }

  // Start stats update interval
  const statsInterval = setInterval(updateStats, 1000)

  onUnmounted(() => {
    clearInterval(statsInterval)
    disconnectWebSocket()
  })
})
</script>

<style scoped>
.stream-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.stream-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content h1 {
  margin: 0 0 5px 0;
  font-size: 28px;
  color: #333;
}

.subtitle {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-secondary {
  padding: 10px 20px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.stream-container {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 20px;
  margin-bottom: 30px;
}

.stream-section {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.section-title h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.live-badge {
  background: #ef4444;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.stream-info-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.info-card h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #333;
}

.stream-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.no-stream-info {
  text-align: center;
  padding: 20px;
  color: #999;
}

.chat-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 500px;
}

.chat-section h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #333;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chat-message {
  padding: 10px;
  background: #f9f9f9;
  border-radius: 6px;
  font-size: 13px;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.message-header strong {
  color: #333;
}

.message-time {
  font-size: 11px;
  color: #999;
}

.message-content {
  margin: 0;
  color: #666;
  word-break: break-word;
}

.chat-input {
  display: flex;
  gap: 10px;
}

.chat-input input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
}

.btn-send {
  padding: 10px 20px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.btn-send:hover {
  background: #059669;
}

.viewers-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.viewers-section h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #333;
}

.viewers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 15px;
}

.viewer-card {
  text-align: center;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
  position: relative;
}

.viewer-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 10px;
}

.viewer-name {
  margin: 0 0 5px 0;
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.following-badge {
  display: inline-block;
  background: #10b981;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
}

.gifts-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.gifts-section h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #333;
}

.gifts-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.gift-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  border-left: 4px solid #ff6b6b;
}

.gift-emoji {
  font-size: 24px;
}

.gift-info {
  flex: 1;
}

.gift-sender {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.gift-name {
  margin: 2px 0 0 0;
  font-size: 12px;
  color: #666;
}

.gift-value {
  font-weight: bold;
  color: #ff6b6b;
}

.error-banner {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #ef4444;
  color: white;
  padding: 15px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.error-banner p {
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
}

@media (max-width: 1024px) {
  .stream-container {
    grid-template-columns: 1fr;
  }

  .chat-section {
    height: 300px;
  }
}

@media (max-width: 768px) {
  .stream-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .header-actions {
    width: 100%;
    justify-content: center;
  }

  .viewers-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
}
</style>
