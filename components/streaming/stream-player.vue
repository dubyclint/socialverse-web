<template>
  <div class="advanced-stream-player">
    <!-- Main Video Player -->
    <div class="video-container">
      <video 
        ref="videoPlayer"
        :src="streamUrl"
        @loadedmetadata="onVideoLoaded"
        @timeupdate="onTimeUpdate"
        @play="onPlay"
        @pause="onPause"
        controls
        autoplay
        muted
        playsinline
      ></video>
      
      <!-- Stream Overlay -->
      <div class="stream-overlay">
        <!-- Live Indicator -->
        <div class="live-indicator">
          <span class="live-dot"></span>
          LIVE
        </div>
        
        <!-- Viewer Count -->
        <div class="viewer-count">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
          </svg>
          {{ formatNumber(viewerCount) }}
        </div>
        
        <!-- Stream Quality -->
        <div class="quality-selector">
          <select v-model="selectedQuality" @change="changeQuality">
            <option value="1080p">1080p</option>
            <option value="720p">720p</option>
            <option value="480p">480p</option>
            <option value="360p">360p</option>
            <option value="auto">Auto</option>
          </select>
        </div>
      </div>

      <!-- Reaction Animations -->
      <div class="reaction-overlay">
        <div 
          v-for="reaction in activeReactions" 
          :key="reaction.id"
          :class="['reaction-animation', `reaction-${reaction.type}`]"
          :style="{ left: reaction.x + 'px', top: reaction.y + 'px' }"
        >
          {{ getReactionEmoji(reaction.type) }}
        </div>
      </div>

      <!-- PewGift Animations -->
      <div class="gift-overlay">
        <div 
          v-for="gift in activeGifts" 
          :key="gift.id"
          class="gift-animation"
        >
          <div class="gift-content">
            <div class="gift-header">
              <span class="gift-sender">{{ gift.senderName }}</span>
              <span class="gift-type">{{ gift.giftType }}</span>
            </div>
            <div class="gift-amount">${{ (gift.amount / 100).toFixed(2) }}</div>
          </div>
        </div>
      </div>

      <!-- Loading Spinner -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>Loading stream...</p>
      </div>

      <!-- Error State -->
      <div v-if="hasError" class="error-overlay">
        <div class="error-content">
          <svg class="w-12 h-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
          <h3>Stream Unavailable</h3>
          <p>{{ errorMessage }}</p>
          <button @click="retryStream" class="retry-btn">Try Again</button>
        </div>
      </div>
    </div>

    <!-- Stream Controls -->
    <div class="stream-controls">
      <div class="control-group">
        <!-- Reaction Buttons -->
        <div class="reaction-buttons">
          <button 
            v-for="reaction in reactionTypes" 
            :key="reaction"
            @click="sendReaction(reaction)"
            :class="['reaction-btn', { 'reaction-cooldown': reactionCooldown }]"
            :disabled="reactionCooldown"
          >
            {{ getReactionEmoji(reaction) }}
          </button>
        </div>

        <!-- PewGift Button -->
        <PewGiftButton 
          v-if="!isStreamer"
          :streamId="streamId"
          :receiverId="streamerId"
          @gift-sent="onGiftSent"
        />

        <!-- Share Button -->
        <button @click="shareStream" class="control-btn">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"/>
          </svg>
          Share
        </button>

        <!-- Follow Button -->
        <button 
          v-if="!isStreamer && !isFollowing"
          @click="followStreamer" 
          class="control-btn follow-btn"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
          </svg>
          Follow
        </button>

        <!-- Report Button -->
        <button @click="reportStream" class="control-btn report-btn">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/>
          </svg>
          Report
        </button>
      </div>

      <!-- Recording Indicator -->
      <div v-if="isRecording" class="recording-indicator">
        <span class="recording-dot"></span>
        Recording
      </div>

      <!-- Stream Stats -->
      <div class="stream-stats">
        <span class="stat-item">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
          </svg>
          {{ formatDuration(streamDuration) }}
        </span>
        <span class="stat-item">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
            <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/>
          </svg>
          {{ chatMessageCount }}
        </span>
      </div>
    </div>

    <!-- Stream Info -->
    <div class="stream-info">
      <div class="stream-header">
        <h2 class="stream-title">{{ streamTitle }}</h2>
        <div class="stream-badges">
          <span v-if="streamData?.isVerified" class="badge verified">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            Verified
          </span>
          <span v-if="streamData?.category" class="badge category">
            {{ streamData.category }}
          </span>
        </div>
      </div>
      
      <div class="stream-meta">
        <div class="streamer-info">
          <img 
            :src="streamerAvatar || '/default-avatar.png'" 
            :alt="streamerName"
            class="streamer-avatar"
          >
          <div class="streamer-details">
            <span class="streamer-name">{{ streamerName }}</span>
            <span class="follower-count">{{ formatNumber(followerCount) }} followers</span>
          </div>
        </div>
        
        <div class="stream-metrics">
          <span class="metric">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
            </svg>
            {{ formatNumber(viewerCount) }} watching
          </span>
          <span class="metric">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
            </svg>
            {{ formatNumber(likeCount) }} likes
          </span>
        </div>
      </div>
      
      <p v-if="streamDescription" class="stream-description">{{ streamDescription }}</p>
      
      <!-- Stream Tags -->
      <div v-if="streamTags?.length" class="stream-tags">
        <span 
          v-for="tag in streamTags" 
          :key="tag"
          class="stream-tag"
        >
          #{{ tag }}
        </span>
      </div>
    </div>

    <!-- Analytics Panel (for streamers) -->
    <StreamAnalytics 
      v-if="isStreamer" 
      :streamId="streamId"
      class="analytics-panel"
    />

    <!-- Moderation Panel (for streamers) -->
    <ModerationPanel 
      v-if="isStreamer" 
      :streamId="streamId"
      class="moderation-panel"
    />

    <!-- Chat Integration -->
    <StreamChat
      :streamId="streamId"
      :isStreamer="isStreamer"
      class="stream-chat"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useSocket } from '~/composables/useSocket'
import { useUser } from '~/composables/useUser'
import StreamAnalytics from './StreamAnalytics.vue'
import ModerationPanel from './ModerationPanel.vue'
import StreamChat from './StreamChat.vue'
import PewGiftButton from '../PewGiftButton.vue'

const props = defineProps({
  streamId: {
    type: String,
    required: true
  },
  streamUrl: {
    type: String,
    required: true
  },
  streamerId: {
    type: String,
    required: true
  },
  isStreamer: {
    type: Boolean,
    default: false
  },
  streamData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['stream-ended', 'viewer-joined', 'viewer-left'])

const { socket, isConnected } = useSocket('/streaming')
const { user } = useUser()

// Refs
const videoPlayer = ref(null)
const viewerCount = ref(0)
const selectedQuality = ref('auto')
const activeReactions = ref([])
const activeGifts = ref([])
const streamDuration = ref(0)
const isRecording = ref(false)
const isLoading = ref(true)
const hasError = ref(false)
const errorMessage = ref('')
const reactionCooldown = ref(false)
const chatMessageCount = ref(0)
const likeCount = ref(0)
const isFollowing = ref(false)

// Stream data
const streamTitle = ref(props.streamData?.title || 'Live Stream')
const streamerName = ref(props.streamData?.streamerName || 'Streamer')
const streamerAvatar = ref(props.streamData?.streamerAvatar || '')
const streamDescription = ref(props.streamData?.description || '')
const streamTags = ref(props.streamData?.tags || [])
const followerCount = ref(props.streamData?.followerCount || 0)

const reactionTypes = ['like', 'love', 'laugh', 'wow', 'sad', 'angry']

let durationInterval = null
let heartbeatInterval = null

// Computed
const currentUserId = computed(() => user.value?.id)

// Methods
const onVideoLoaded = () => {
  isLoading.value = false
  console.log('Video loaded successfully')
}

const onTimeUpdate = () => {
  // Handle time updates for analytics
  if (videoPlayer.value && !videoPlayer.value.paused) {
    // Track watch time
  }
}

const onPlay = () => {
  console.log('Video started playing')
}

const onPause = () => {
  console.log('Video paused')
}

const changeQuality = () => {
  console.log('Quality changed to:', selectedQuality.value)
  // Implement quality change logic with HLS.js or similar
}

const sendReaction = (reactionType) => {
  if (reactionCooldown.value || !socket.value || !isConnected.value) return
  
  socket.value.emit('stream-reaction', {
    streamId: props.streamId,
    userId: currentUserId.value,
    reactionType
  })
  
  // Set cooldown
  reactionCooldown.value = true
  setTimeout(() => {
    reactionCooldown.value = false
  }, 1000)
}

const onGiftSent = (giftData) => {
  console.log('Gift sent:', giftData)
  // Handle gift sent confirmation
}

const shareStream = async () => {
  const shareUrl = `${window.location.origin}/live/${props.streamId}`
  const shareData = {
    title: streamTitle.value,
    text: `Watch ${streamerName.value} live on SocialVerse!`,
    url: shareUrl
  }
  
  try {
    if (navigator.share && navigator.canShare(shareData)) {
      await navigator.share(shareData)
    } else {
      await navigator.clipboard.writeText(shareUrl)
      // Show toast notification
      showToast('Stream link copied to clipboard!')
    }
  } catch (error) {
    console.error('Error sharing:', error)
  }
}

const followStreamer = async () => {
  try {
    const response = await $fetch('/api/users/follow', {
      method: 'POST',
      body: {
        targetUserId: props.streamerId
      }
    })
    
    if (response.success) {
      isFollowing.value = true
      followerCount.value += 1
      showToast('Successfully followed!')
    }
  } catch (error) {
    console.error('Failed to follow:', error)
    showToast('Failed to follow user', 'error')
  }
}

const reportStream = () => {
  // Open report modal or navigate to report page
  console.log('Report stream')
  showToast('Report submitted. Thank you for helping keep our community safe.')
}

const retryStream = () => {
  hasError.value = false
  isLoading.value = true
  
  // Reload video source
  if (videoPlayer.value) {
    videoPlayer.value.load()
  }
}

const getReactionEmoji = (type) => {
  const emojis = {
    like: '👍',
    love: '❤️',
    laugh: '😂',
    wow: '😮',
    sad: '😢',
    angry: '😠'
  }
  return emojis[type] || '👍'
}

const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const animateReaction = (reaction) => {
  // Add random position within video bounds
  reaction.x = Math.random() * 300
  reaction.y = Math.random() * 200
  reaction.id = `reaction_${Date.now()}_${Math.random()}`
  
  activeReactions.value.push(reaction)
  
  // Remove after animation
  setTimeout(() => {
    const index = activeReactions.value.findIndex(r => r.id === reaction.id)
    if (index > -1) {
      activeReactions.value.splice(index, 1)
    }
  }, 3000)
}

const animateGift = (gift) => {
  gift.id = `gift_${Date.now()}_${Math.random()}`
  activeGifts.value.push(gift)
  
  // Remove after animation
  setTimeout(() => {
    const index = activeGifts.value.findIndex(g => g.id === gift.id)
    if (index > -1) {
      activeGifts.value.splice(index, 1)
    }
  }, 5000)
}

const showToast = (message, type = 'success') => {
  // Implement toast notification
  console.log(`Toast (${type}):`, message)
}

const setupSocketListeners = () => {
  if (!socket.value) return

  socket.value.on('viewer-count-updated', (data) => {
    viewerCount.value = data.count
  })

  socket.value.on('stream-reaction', (reaction) => {
    animateReaction(reaction)
    if (reaction.reactionType === 'like') {
      likeCount.value += 1
    }
  })

  socket.value.on('pewgift-received', (gift) => {
    animateGift({
      ...gift,
      senderName: gift.senderName || `User ${gift.gifterId.slice(-4)}`
    })
  })

  socket.value.on('blocked-from-stream', (data) => {
    hasError.value = true
    errorMessage.value = `You have been blocked from this stream: ${data.reason}`
  })

  socket.value.on('stream-ended', () => {
    hasError.value = true
    errorMessage.value = 'This stream has ended'
    emit('stream-ended')
  })

  socket.value.on('chat-message-count', (data) => {
    chatMessageCount.value = data.count
  })

  socket.value.on('connection-error', () => {
    hasError.value = true
    errorMessage.value = 'Connection lost. Please refresh the page.'
  })
}

const joinStream = () => {
  if (socket.value && isConnected.value) {
    socket.value.emit('join-stream', {
      streamId: props.streamId,
      userId: currentUserId.value,
      userCountry: 'US' // Get from geolocation or user profile
    })
  }
}

const leaveStream = () => {
  if (socket.value) {
    socket.value.emit('leave-stream')
  }
}

// Watchers
watch(isConnected, (connected) => {
  if (connected) {
    setupSocketListeners()
    joinStream()
  }
})

// Lifecycle
onMounted(() => {
  // Start duration timer
  const startTime = Date.now()
  durationInterval = setInterval(() => {
    streamDuration.value = Math.floor((Date.now() - startTime) / 1000)
  }, 1000)

  // Setup heartbeat to maintain connection
  heartbeatInterval = setInterval(() => {
    if (socket.value && isConnected.value) {
      socket.value.emit('heartbeat', { streamId: props.streamId })
    }
  }, 30000)

  // Handle video errors
  if (videoPlayer.value) {
    videoPlayer.value.addEventListener('error', (e) => {
      hasError.value = true
      errorMessage.value = 'Failed to load video stream'
      console.error('Video error:', e)
    })
  }

  // Setup socket if already connected
  if (isConnected.value) {
    setupSocketListeners()
    joinStream()
  }
})

onUnmounted(() => {
  leaveStream()
  
  if (durationInterval) {
    clearInterval(durationInterval)
  }
  
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
  }
})
</script>

<style scoped>
.advanced-stream-player {
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  color: white;
  max-width: 100%;
}

.video-container {
  position: relative;
  aspect-ratio: 16/9;
  background: #000;
  overflow: hidden;
}

.video-container video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.stream-overlay {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  pointer-events: none;
  z-index: 10;
}

.live-indicator {
  background: #ef4444;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.live-dot {
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.viewer-count {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.quality-selector {
  pointer-events: all;
}

.quality-selector select {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.reaction-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 5;
}

.reaction-animation
.reaction-animation {
  position: absolute;
  font-size: 24px;
  animation: reactionFloat 3s ease-out forwards;
  z-index: 6;
}

@keyframes reactionFloat {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-100px) scale(1.5);
  }
}

.gift-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 7;
}

.gift-animation {
  background: linear-gradient(135deg, #10b981, #3b82f6);
  padding: 16px 24px;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  animation: giftSlide 5s ease-out forwards;
}

@keyframes giftSlide {
  0% {
    opacity: 0;
    transform: translateX(-100px) scale(0.8);
  }
  20% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  80% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateX(100px) scale(0.8);
  }
}

.gift-content {
  text-align: center;
}

.gift-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.gift-sender {
  font-weight: bold;
  font-size: 14px;
  color: white;
}

.gift-type {
  font-size: 12px;
  opacity: 0.9;
  color: rgba(255, 255, 255, 0.8);
}

.gift-amount {
  font-size: 18px;
  font-weight: bold;
  color: #fbbf24;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-content {
  text-align: center;
  padding: 20px;
}

.error-content h3 {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
}

.error-content p {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 16px;
}

.retry-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background: #059669;
}

.stream-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #1a1a1a;
  border-top: 1px solid #2d2d2d;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.reaction-buttons {
  display: flex;
  gap: 8px;
}

.reaction-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s;
  position: relative;
}

.reaction-btn:hover:not(:disabled) {
  transform: scale(1.2);
  background: rgba(255, 255, 255, 0.1);
}

.reaction-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reaction-cooldown::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  animation: cooldownFill 1s ease-out;
}

@keyframes cooldownFill {
  from { width: 100%; }
  to { width: 0%; }
}

.control-btn {
  background: #2d2d2d;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.control-btn:hover {
  background: #3d3d3d;
  transform: translateY(-1px);
}

.follow-btn {
  background: #10b981;
}

.follow-btn:hover {
  background: #059669;
}

.report-btn {
  background: #ef4444;
}

.report-btn:hover {
  background: #dc2626;
}

.recording-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ef4444;
  font-size: 12px;
  font-weight: 500;
}

.recording-dot {
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.stream-stats {
  display: flex;
  gap: 16px;
  align-items: center;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.stream-info {
  padding: 20px;
  background: #1a1a1a;
}

.stream-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.stream-title {
  font-size: 20px;
  font-weight: bold;
  margin: 0;
  line-height: 1.3;
}

.stream-badges {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 16px;
}

.badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.badge.verified {
  background: #10b981;
  color: white;
}

.badge.category {
  background: #3b82f6;
  color: white;
}

.stream-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.streamer-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.streamer-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.streamer-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.streamer-name {
  font-weight: 600;
  font-size: 14px;
}

.follower-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.stream-metrics {
  display: flex;
  gap: 16px;
  align-items: center;
}

.metric {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.stream-description {
  font-size: 14px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 16px;
}

.stream-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.stream-tag {
  background: #2d2d2d;
  color: #10b981;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.analytics-panel,
.moderation-panel,
.stream-chat {
  margin-top: 20px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Responsive Design */
@media (max-width: 768px) {
  .stream-overlay {
    padding: 12px;
  }
  
  .stream-controls {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .control-group {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .stream-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .stream-meta {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .stream-metrics {
    align-self: stretch;
    justify-content: space-around;
  }
}

@media (max-width: 480px) {
  .reaction-buttons {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .stream-info {
    padding: 16px;
  }
  
  .stream-title {
    font-size: 18px;
  }
}
</style>
