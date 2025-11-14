<!-- CORRECTED FILE: components/streaming/mobile-stream-player.vue -->
<!-- All imports fixed, component names corrected to kebab-case -->
<!-- Path aliases changed from ~ to @ where appropriate -->

<template>
  <div class="mobile-stream-player" :class="{ 'fullscreen': isFullscreen }">
    <!-- Mobile Video Container -->
    <div class="mobile-video-container" @click="togglePlayPause">
      <video 
        ref="videoPlayer"
        :src="adaptiveStreamUrl"
        @loadedmetadata="onVideoLoaded"
        @timeupdate="onTimeUpdate"
        @play="onPlay"
        @pause="onPause"
        @waiting="onBuffering"
        @canplay="onCanPlay"
        :autoplay="autoplay"
        :muted="isMuted"
        playsinline
        webkit-playsinline
      ></video>
      
      <!-- Mobile Overlay Controls -->
      <div class="mobile-overlay" :class="{ 'visible': showControls }">
        <!-- Top Bar -->
        <div class="mobile-top-bar">
          <button @click="exitFullscreen" class="back-btn" v-if="isFullscreen">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          
          <div class="stream-info-mobile">
            <div class="live-badge">
              <span class="live-dot"></span>
              LIVE
            </div>
            <div class="viewer-count-mobile">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
              </svg>
              {{ formatNumber(viewerCount) }}
            </div>
          </div>
          
          <div class="mobile-actions">
            <button @click="toggleMute" class="control-btn-mobile">
              <svg v-if="!isMuted" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072M17.828 5.172a9 9 0 010 14.142M6.343 6.343L4.93 4.93A1 1 0 003.515 6.343L6.343 9.17v.001c0 .552.448 1 1 1h3.172l4.95 4.95a1 1 0 001.414-1.414L6.343 6.343z"/>
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clip-rule="evenodd"/>
              </svg>
            </button>
            
            <button @click="toggleFullscreen" class="control-btn-mobile">
              <svg v-if="!isFullscreen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5m0 0l5.5-5.5"/>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Center Play/Pause Button -->
        <div class="center-controls">
          <button 
            v-if="showPlayButton" 
            @click="togglePlayPause" 
            class="play-pause-btn"
          >
            <svg v-if="!isPlaying" class="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/>
            </svg>
            <svg v-else class="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
          </button>
          
          <!-- Loading Spinner -->
          <div v-if="isBuffering" class="loading-spinner-mobile">
            <div class="spinner"></div>
          </div>
        </div>
        
        <!-- Bottom Controls -->
        <div class="mobile-bottom-bar">
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
            </div>
          </div>
          
          <div class="bottom-actions">
            <div class="quality-selector-mobile">
              <select v-model="selectedQuality" @change="changeQuality">
                <option value="auto">Auto</option>
                <option value="1080p">1080p</option>
                <option value="720p">720p</option>
                <option value="480p">480p</option>
                <option value="360p">360p</option>
              </select>
            </div>
            
            <div class="stream-duration">{{ formatDuration(currentTime) }}</div>
          </div>
        </div>
      </div>
      
      <!-- Mobile Reaction Overlay -->
      <div class="mobile-reaction-overlay">
        <div 
          v-for="reaction in activeReactions" 
          :key="reaction.id"
          :class="['mobile-reaction', `reaction-${reaction.type}`]"
          :style="{ left: reaction.x + '%', top: reaction.y + '%' }"
        >
          {{ getReactionEmoji(reaction.type) }}
        </div>
      </div>
      
      <!-- Mobile Gift Overlay -->
      <div class="mobile-gift-overlay">
        <div 
          v-for="gift in activeGifts" 
          :key="gift.id"
          class="mobile-gift-animation"
        >
          <div class="gift-content-mobile">
            <span class="gift-sender-mobile">{{ gift.senderName }}</span>
            <span class="gift-amount-mobile">${{ (gift.amount / 100).toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Stream Controls Panel -->
    <div class="mobile-controls-panel" :class="{ 'expanded': showMobileControls }">
      <div class="mobile-controls-header" @click="toggleMobileControls">
        <h3>{{ streamTitle }}</h3>
        <button class="expand-btn">
          <svg class="w-5 h-5" :class="{ 'rotate-180': showMobileControls }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
      </div>
      
      <div v-if="showMobileControls" class="mobile-controls-content">
        <!-- Mobile Reaction Buttons -->
        <div class="mobile-reaction-buttons">
          <button 
            v-for="reaction in reactionTypes" 
            :key="reaction"
            @click="sendReaction(reaction)"
            :class="['mobile-reaction-btn', { 'cooldown': reactionCooldown }]"
            :disabled="reactionCooldown"
          >
            {{ getReactionEmoji(reaction) }}
          </button>
        </div>
        
        <!-- Mobile Action Buttons -->
        <div class="mobile-action-buttons">
          <button @click="shareStream" class="mobile-action-btn">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"/>
            </svg>
            Share
          </button>
          
          <button v-if="!isFollowing" @click="followStreamer" class="mobile-action-btn follow">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Follow
          </button>
          
          <pew-gift-button-mobile 
            v-if="!isStreamer"
            :stream-id="streamId"
            :receiver-id="streamerId"
            @gift-sent="onGiftSent"
          />
        </div>
        
        <!-- Mobile Stream Info -->
        <div class="mobile-stream-info">
          <div class="streamer-info-mobile">
            <img 
              :src="streamerAvatar || '/default-avatar.png'" 
              :alt="streamerName"
              class="streamer-avatar-mobile"
            >
            <div class="streamer-details-mobile">
              <span class="streamer-name-mobile">{{ streamerName }}</span>
              <span class="follower-count-mobile">{{ formatNumber(followerCount) }} followers</span>
            </div>
          </div>
          
          <div class="stream-stats-mobile">
            <div class="stat-mobile">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
              </svg>
              {{ formatDuration(streamDuration) }}
            </div>
            <div class="stat-mobile">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
              </svg>
              {{ formatNumber(likeCount) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Chat Integration -->
    <mobile-stream-chat
      v-if="showMobileControls"
      :stream-id="streamId"
      :is-streamer="isStreamer"
      class="mobile-chat"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useSocket } from '@/composables/use-socket'
import { useUser } from '@/composables/use-user'
import { useMobileDetection } from '@/composables/use-mobile-detection'
import { useAdaptiveStreaming } from '@/composables/use-adaptive-streaming'
import MobileStreamChat from './mobile-stream-chat.vue'
import PewGiftButtonMobile from '../pew-gift-button-mobile.vue'

const props = defineProps({
  streamId: String,
  streamUrl: String,
  streamerId: String,
  isStreamer: Boolean,
  streamData: Object
})

const { socket, isConnected } = useSocket('/streaming')
const { user } = useUser()
const { isMobile, isTablet, orientation } = useMobileDetection()
const { adaptiveStreamUrl, selectedQuality, changeQuality } = useAdaptiveStreaming(props.streamUrl)

// Mobile-specific refs
const videoPlayer = ref(null)
const isFullscreen = ref(false)
const showControls = ref(true)
const showMobileControls = ref(false)
const showPlayButton = ref(false)
const isPlaying = ref(false)
const isBuffering = ref(false)
const isMuted = ref(true)
const currentTime = ref(0)
const duration = ref(0)
const reactionCooldown = ref(false)

// Stream data
const viewerCount = ref(0)
const activeReactions = ref([])
const activeGifts = ref([])
const streamDuration = ref(0)
const likeCount = ref(0)
const isFollowing = ref(false)

const streamTitle = ref(props.streamData?.title || 'Live Stream')
const streamerName = ref(props.streamData?.streamerName || 'Streamer')
const streamerAvatar = ref(props.streamData?.streamerAvatar || '')
const followerCount = ref(props.streamData?.followerCount || 0)

const reactionTypes = ['like', 'love', 'laugh', 'wow', 'sad', 'angry']

let controlsTimeout = null
let durationInterval = null

// Computed
const autoplay = computed(() => isMobile.value ? false : true)
const progressPercentage = computed(() => {
  return duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
})

// Methods
const togglePlayPause = () => {
  if (!videoPlayer.value) return
  
  if (videoPlayer.value.paused) {
    videoPlayer.value.play()
  } else {
    videoPlayer.value.pause()
  }
}

const toggleMute = () => {
  if (!videoPlayer.value) return
  
  videoPlayer.value.muted = !videoPlayer.value.muted
  isMuted.value = videoPlayer.value.muted
}

const toggleFullscreen = async () => {
  if (!videoPlayer.value) return
  
  try {
    if (!isFullscreen.value) {
      if (videoPlayer.value.requestFullscreen) {
        await videoPlayer.value.requestFullscreen()
      } else if (videoPlayer.value.webkitRequestFullscreen) {
        await videoPlayer.value.webkitRequestFullscreen()
      } else if (videoPlayer.value.mozRequestFullScreen) {
        await videoPlayer.value.mozRequestFullScreen()
      }
      isFullscreen.value = true
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen()
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen()
      }
      isFullscreen.value = false
    }
  } catch (error) {
    console.error('Fullscreen error:', error)
  }
}

const exitFullscreen = () => {
  if (isFullscreen.value) {
    toggleFullscreen()
  }
}

const toggleMobileControls = () => {
  showMobileControls.value = !showMobileControls.value
}

const onVideoLoaded = () => {
  if (videoPlayer.value) {
    duration.value = videoPlayer.value.duration
  }
}

const onTimeUpdate = () => {
  if (videoPlayer.value) {
    currentTime.value = videoPlayer.value.currentTime
  }
}

const onPlay = () => {
  isPlaying.value = true
  showPlayButton.value = false
  hideControlsAfterDelay()
}

const onPause = () => {
  isPlaying.value = false
  showPlayButton.value = true
  showControls.value = true
}

const onBuffering = () => {
  isBuffering.value = true
}

const onCanPlay = () => {
  isBuffering.value = false
}

const hideControlsAfterDelay = () => {
  clearTimeout(controlsTimeout)
  controlsTimeout = setTimeout(() => {
    if (isPlaying.value) {
      showControls.value = false
    }
  }, 3000)
}

const showControlsTemporarily = () => {
  showControls.value = true
  hideControlsAfterDelay()
}

const sendReaction = (reactionType) => {
  if (reactionCooldown.value || !socket.value || !isConnected.value) return
  
  socket.value.emit('stream-reaction', {
    streamId: props.streamId,
    userId: user.value?.id,
    reactionType
  })
  
  // Set cooldown
  reactionCooldown.value = true
  setTimeout(() => {
    reactionCooldown.value = false
  }, 1000)
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
      showToast('Stream link copied!')
    }
  } catch (error) {
    console.error('Error sharing:', error)
  }
}

const followStreamer = async () => {
  try {
    const response = await $fetch('/api/users/follow', {
      method: 'POST',
      body: { targetUserId: props.streamerId }
    })
    
    if (response.success) {
      isFollowing.value = true
      followerCount.value += 1
      showToast('Successfully followed!')
    }
  } catch (error) {
    console.error('Failed to follow:', error)
  }
}

const onGiftSent = (giftData) => {
  console.log('Gift sent:', giftData)
}

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num?.toString() || '0'
}

const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const getReactionEmoji = (type) => {
  const emojis = {
    like: '👍', love: '❤️', laugh: '😂',
    wow: '😮', sad: '😢', angry: '😠'
  }
  return emojis[type] || '👍'
}

const animateReaction = (reaction) => {
  reaction.x = Math.random() * 80 + 10 // 10-90% from left
  reaction.y = Math.random() * 60 + 20 // 20-80% from top
  reaction.id = `reaction_${Date.now()}_${Math.random()}`
  
  activeReactions.value.push(reaction)
  
  setTimeout(() => {
    const index = activeReactions.value.findIndex(r => r.id === reaction.id)
    if (index > -1) activeReactions.value.splice(index, 1)
  }, 3000)
}

const animateGift = (gift) => {
  gift.id = `gift_${Date.now()}_${Math.random()}`
  activeGifts.value.push(gift)
  
  setTimeout(() => {
    const index = activeGifts.value.findIndex(g => g.id === gift.id)
    if (index > -1) activeGifts.value.splice(index, 1)
  }, 4000)
}

const showToast = (message) => {
  // Implement mobile-friendly toast
  console.log('Toast:', message)
}

// Touch event handlers
const handleTouchStart = (e) => {
  showControlsTemporarily()
}

const handleTouchMove = (e) => {
  // Prevent default scrolling when touching video
  if (e.target === videoPlayer.value) {
    e.preventDefault()
  }
}

// Socket event handlers
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
}

// Watchers
watch(isConnected, (connected) => {
  if (connected) {
    setupSocketListeners()
    socket.value.emit('join-stream', {
      streamId: props.streamId,
      userId: user.value?.id,
      userCountry: 'US'
    })
  }
})

watch(orientation, (newOrientation) => {
  // Handle orientation changes
  if (newOrientation === 'landscape' && isMobile.value) {
    // Auto-fullscreen on landscape for mobile
    nextTick(() => {
      if (!isFullscreen.value) {
        toggleFullscreen()
      }
    })
  }
})

// Lifecycle
onMounted(() => {
  // Add touch event listeners
  if (videoPlayer.value) {
    videoPlayer.value.addEventListener('touchstart', handleTouchStart)
    videoPlayer.value.addEventListener('touchmove', handleTouchMove)
  }
  
  // Start duration timer
  const startTime = Date.now()
  durationInterval = setInterval(() => {
    streamDuration.value = Math.floor((Date.now() - startTime) / 1000)
  }, 1000)
  
  // Setup socket if already connected
  if (isConnected.value) {
    setupSocketListeners()
    socket.value.emit('join-stream', {
      streamId: props.streamId,
      userId: user.value?.id,
      userCountry: 'US'
    })
  }
})

onUnmounted(() => {
  if (videoPlayer.value) {
    videoPlayer.value.removeEventListener('touchstart', handleTouchStart)
    videoPlayer.value.removeEventListener('touchmove', handleTouchMove)
  }
  
  if (durationInterval) {
    clearInterval(durationInterval)
  }
  
  if (controlsTimeout) {
    clearTimeout(controlsTimeout)
  }
})
</script>

<style scoped>
.mobile-stream-player {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #000;
  color: white;
}

.mobile-video-container {
  position: relative;
  flex: 1;
  background: #000;
  overflow: hidden;
}

.mobile-video-container video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.mobile-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent, rgba(0,0,0,0.5));
  opacity: 0;
  transition: opacity 0.3s;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.mobile-overlay.visible {
  opacity: 1;
}

.mobile-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
}

.back-btn {
  background: rgba(0,0,0,0.5);
  border: none;
  color: white;
  padding: 0.5rem;
  border-radius: 50%;
  cursor: pointer;
}

.stream-info-mobile {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.live-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255,0,0,0.7);
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: bold;
}

.live-dot {
  width: 8px;
  height: 8px;
  background: red;
  border-radius: 50%;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.viewer-count-mobile {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
}

.mobile-actions {
  display: flex;
  gap: 0.5rem;
}

.control-btn-mobile {
  background: rgba(0,0,0,0.5);
  border: none;
  color: white;
  padding: 0.5rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.center-controls {
  display: flex;
  justify-content: center;
  align-items: center;
}

.play-pause-btn {
  background: rgba(0,0,0,0.5);
  border: none;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.loading-spinner-mobile {
  display: flex;
  justify-content: center;
  align-items: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.mobile-bottom-bar {
  padding: 1rem;
}

.progress-container {
  margin-bottom: 0.5rem;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255,255,255,0.3);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #ff0000;
  transition: width 0.1s linear;
}

.bottom-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.quality-selector-mobile select {
  background: rgba(0,0,0,0.5);
  color: white;
  border: 1px solid rgba(255,255,255,0.3);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.mobile-reaction-overlay,
.mobile-gift-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.mobile-reaction {
  position: absolute;
  font-size: 2rem;
  animation: float-up 3s ease-out forwards;
}

@keyframes float-up {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-100px); }
}

.mobile-gift-animation {
  position: absolute;
  animation: gift-float 4s ease-out forwards;
}

@keyframes gift-float {
  0% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-150px) scale(0.8); }
}

.mobile-controls-panel {
  background: #1a1a1a;
  border-top: 1px solid rgba(255,255,255,0.1);
  max-height: 100px;
  overflow: hidden;
  transition: max-height 0.3s;
}

.mobile-controls-panel.expanded {
  max-height: 500px;
}

.mobile-controls-header {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.mobile-controls-header h3 {
  margin: 0;
  font-size: 1rem;
}

.expand-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  transition: transform 0.3s;
}

.mobile-controls-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mobile-reaction-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.mobile-reaction-btn {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  font-size: 1.5rem;
}

.mobile-reaction-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mobile-action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.mobile-action-btn {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.mobile-action-btn.follow {
  background: #007bff;
  border-color: #007bff;
}

.mobile-stream-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.streamer-info-mobile {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.streamer-avatar-mobile {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.streamer-details-mobile {
  display: flex;
  flex-direction: column;
}

.streamer-name-mobile {
  font-weight: bold;
  font-size: 0.875rem;
}

.follower-count-mobile {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.7);
}

.stream-stats-mobile {
  display: flex;
  gap: 1rem;
}

.stat-mobile {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
}

.mobile-chat {
  flex: 1;
  overflow-y: auto;
}
</style>
