<!-- ============================================================================
     STREAMING PAGE - OPTIMIZED INTERFACE INTEGRATION
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
          <span v-if="isLive" class="live-badge">🔴 LIVE</span>
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
          
          <div v-if="isLive" class="stream-stats">
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
    <div v-if="isLive && viewers.length > 0" class="viewers-section">
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
    <div v-if="isLive" class="gifts-section">
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
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useUserStore } from '~/stores/user'
import { api } from '~/lib/api'
import { useStreamBroadcast } from '~/composables/use-stream-broadcast'
import MobileCameraStream from '~/components/streaming/mobile-camera-stream'

definePageMeta({
  middleware: ['auth', 'profile-completion', 'language-check', 'status-middleware'],
  layout: 'default'
})

const userStore = useUserStore()

// Composables connection
const { 
  isLive, 
  viewerCount: broadcastViewers,
  streamDuration: broadcastDuration,
  streamStats: broadcastStats,
  startStream,
  stopStream
} = useStreamBroadcast()

const currentStreamId = ref<string | null>(null)
const errorMessage = ref('')
const viewerCount = ref(0)
const streamDuration = ref(0)
const streamStats = ref<any>(null)
const viewers = ref<any[]>([])
const receivedGifts = ref<any[]>([])
const chatMessages = ref<any[]>([])
const chatInput = ref('')
let ws: WebSocket | null = null

// Keep composable state bound to viewable metrics
watch(broadcastViewers, (val) => { viewerCount.value = val })
watch(broadcastDuration, (val) => { streamDuration.value = val })
watch(broadcastStats, (val) => { streamStats.value = val })

// Stream Lifecycle
const onStreamStarted = async (config: any) => {
  try {
    // Using unified API client
    const response = await api('/stream', {
      method: 'POST',
      body: { action: 'create', ...config }
    })

    if (response.success) {
      currentStreamId.value = response.data.id
      await startStream(response.data.id)
      connectWebSocket(response.data.id)
    }
  } catch (err: any) {
    errorMessage.value = `Failed to initialize stream: ${err.message}`
  }
}

const onStreamEnded = async () => {
  try {
    if (currentStreamId.value) {
      await api(`/stream/${currentStreamId.value}`, {
        method: 'POST',
        body: { action: 'end', duration: streamDuration.value }
      })
    }
    await stopStream()
    disconnectWebSocket()
    currentStreamId.value = null
  } catch (err: any) {
    errorMessage.value = `Error closing stream: ${err.message}`
  }
}

// Real-time
const connectWebSocket = (streamId: string) => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${protocol}//${window.location.host}/api/stream/${streamId}/ws`
  ws = new WebSocket(wsUrl)
  ws.onmessage = (event) => handleWebSocketMessage(JSON.parse(event.data))
}

const disconnectWebSocket = () => { ws?.close(); ws = null }

const handleWebSocketMessage = (data: any) => {
  switch (data.type) {
    case 'viewer-joined': viewers.value.push(data.viewer); viewerCount.value++; break
    case 'viewer-left': viewers.value = viewers.value.filter(v => v.id !== data.viewerId); viewerCount.value--; break
    case 'chat-message': chatMessages.value.push(data.message); break
    case 'gift-received': receivedGifts.value.unshift(data.gift); break
    case 'stats-update': streamStats.value = data.stats; break
  }
}

const sendChatMessage = async () => {
  if (!chatInput.value.trim() || !currentStreamId.value) return
  try {
    await api(`/stream/${currentStreamId.value}/chat`, {
      method: 'POST',
      body: { content: chatInput.value }
    })
    chatInput.value = ''
  } catch (err) {
    console.error('Chat error:', err)
  }
}

onMounted(async () => {
  // Ensure profile is hydrated for streaming identity
  if (!userStore.user) await userStore.fetchProfile()
})

onUnmounted(disconnectWebSocket)
</script>

<style scoped>
.stream-page {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.stream-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.header-content h1 {
  font-size: 1.875rem;
  font-weight: 700;
  margin: 0;
}

.subtitle {
  color: #6b7280;
  margin: 0.5rem 0 0 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

.stream-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stream-section {
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-title h2 {
  margin: 0;
  font-size: 1.25rem;
}

.live-badge {
  background-color: #ef4444;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.stream-info-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-card {
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.info-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

.stream-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.no-stream-info {
  color: #6b7280;
  text-align: center;
  padding: 1rem;
}

.chat-section {
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 400px;
}

.chat-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 0.5rem;
}

.chat-message {
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background-color: #f9fafb;
  border-radius: 0.375rem;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.message-header strong {
  font-size: 0.875rem;
}

.message-time {
  font-size: 0.75rem;
  color: #9ca3af;
}

.message-content {
  margin: 0;
  font-size: 0.875rem;
  color: #1f2937;
}

.chat-input {
  display: flex;
  gap: 0.5rem;
}

.chat-input input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.btn-send {
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

.btn-send:hover {
  background-color: #2563eb;
}

.viewers-section {
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.viewers-section h3 {
  margin: 0 0 1rem 0;
}

.viewers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 1rem;
}

.viewer-card {
  text-align: center;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
}

.viewer-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin-bottom: 0.5rem;
  object-fit: cover;
}

.viewer-name {
  margin: 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 500;
}

.following-badge {
  display: inline-block;
  background-color: #dbeafe;
  color: #1e40af;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

.gifts-section {
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.gifts-section h3 {
  margin: 0 0 1rem 0;
}

.gifts-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.gift-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background-color: #fef3c7;
  border-radius: 0.375rem;
}

.gift-emoji {
  font-size: 1.5rem;
}

.gift-info {
  flex: 1;
}

.gift-sender {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
}

.gift-name {
  margin: 0.25rem 0 0 0;
  font-size: 0.75rem;
  color: #6b7280;
}

.gift-value {
  font-weight: 600;
  color: #d97706;
}

.error-banner {
  background-color: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.error-banner p {
  margin: 0;
  color: #991b1b;
  font-size: 0.875rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #991b1b;
}

@media (max-width: 768px) {
  .stream-container {
    grid-template-columns: 1fr;
  }

  .header-actions {
    flex-direction: column;
  }

  .viewers-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
}
</style>
