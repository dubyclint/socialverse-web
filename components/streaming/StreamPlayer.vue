<!-- components/streaming/StreamPlayer.vue -->
<template>
  <div class="stream-player-container">
    <!-- Video Player -->
    <div class="video-container" :class="{ 'fullscreen': isFullscreen }">
      <video
        ref="videoPlayer"
        class="stream-video"
        :poster="stream?.thumbnailUrl"
        autoplay
        muted
        playsinline
        @loadstart="onVideoLoadStart"
        @canplay="onVideoCanPlay"
        @error="onVideoError"
        @click="togglePlayPause"
      />
      
      <!-- Loading Overlay -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>Connecting to stream...</p>
      </div>
      
      <!-- Stream Offline Overlay -->
      <div v-if="!isLive && !isLoading" class="offline-overlay">
        <div class="offline-content">
          <Icon name="mdi:video-off" size="48" />
          <h3>Stream is offline</h3>
          <p>{{ stream?.title || 'This stream has ended' }}</p>
        </div>
      </div>
      
      <!-- Video Controls -->
      <div class="video-controls" :class="{ 'visible': showControls }">
        <div class="controls-left">
          <button @click="togglePlayPause" class="control-btn">
            <Icon :name="isPlaying ? 'mdi:pause' : 'mdi:play'" />
          </button>
          <button @click="toggleMute" class="control-btn">
            <Icon :name="isMuted ? 'mdi:volume-off' : 'mdi:volume-high'" />
          </button>
          <div class="volume-slider">
            <input
              type="range"
              min="0"
              max="100"
              v-model="volume"
              @input="setVolume"
            />
          </div>
        </div>
        
        <div class="controls-center">
          <div class="live-indicator" v-if="isLive">
            <span class="live-dot"></span>
            LIVE
          </div>
          <div class="viewer-count">
            <Icon name="mdi:eye" />
            {{ formatNumber(viewerCount) }}
          </div>
        </div>
        
        <div class="controls-right">
          <div class="quality-selector">
            <select v-model="selectedQuality" @change="changeQuality">
              <option value="auto">Auto</option>
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
              <option value="480p">480p</option>
              <option value="360p">360p</option>
            </select>
          </div>
          <button @click="toggleFullscreen" class="control-btn">
            <Icon :name="isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'" />
          </button>
        </div>
      </div>
      
      <!-- PewGift Animations -->
      <div class="pewgift-animations">
        <TransitionGroup name="pewgift" tag="div">
          <div
            v-for="gift in activeGifts"
            :key="gift.id"
            class="pewgift-animation"
            :class="gift.animationType"
          >
            <img :src="gift.giftImage" :alt="gift.giftName" />
            <div class="gift-info">
              <span class="gift-sender">{{ gift.senderUsername }}</span>
              <span class="gift-name">{{ gift.quantity }}x {{ gift.giftName }}</span>
            </div>
          </div>
        </TransitionGroup>
      </div>
      
      <!-- Reaction Animations -->
      <div class="reaction-animations">
        <TransitionGroup name="reaction" tag="div">
          <div
            v-for="reaction in activeReactions"
            :key="reaction.id"
            class="reaction-emoji"
            :style="{ left: reaction.x + '%', animationDelay: reaction.delay + 'ms' }"
          >
            {{ reaction.emoji }}
          </div>
        </TransitionGroup>
      </div>
    </div>
    
    <!-- Stream Info Bar -->
    <div class="stream-info-bar">
      <div class="stream-details">
        <div class="streamer-info">
          <img :src="stream?.userId?.avatar" :alt="stream?.userId?.username" class="streamer-avatar" />
          <div>
            <h3>{{ stream?.title }}</h3>
            <p>{{ stream?.userId?.username }}</p>
          </div>
        </div>
        <div class="stream-stats">
          <span class="stat">
            <Icon name="mdi:eye" />
            {{ formatNumber(viewerCount) }}
          </span>
          <span class="stat" v-if="stream?.duration">
            <Icon name="mdi:clock" />
            {{ formatDuration(stream.duration) }}
          </span>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="stream-actions">
        <button @click="toggleFollow" class="action-btn follow-btn" :class="{ active: isFollowing }">
          <Icon name="mdi:heart" />
          {{ isFollowing ? 'Following' : 'Follow' }}
        </button>
        <button @click="openPewGiftModal" class="action-btn pewgift-btn">
          <Icon name="mdi:gift" />
          PewGift
        </button>
        <button @click="shareStream" class="action-btn share-btn">
          <Icon name="mdi:share" />
          Share
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useStreaming } from '~/composables/useStreaming'

interface Props {
  streamId: string
  stream?: any
  autoplay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoplay: true
})

const emit = defineEmits(['pewgift-click', 'follow-toggle', 'share'])

// Refs
const videoPlayer = ref<HTMLVideoElement>()
const isLoading = ref(true)
const isPlaying = ref(false)
const isMuted = ref(true)
const volume = ref(50)
const selectedQuality = ref('auto')
const isFullscreen = ref(false)
const showControls = ref(true)
const isFollowing = ref(false)

// Streaming composable
const { 
  isLive, 
  viewerCount, 
  joinStream, 
  leaveStream, 
  activeGifts, 
  activeReactions,
  streamSocket 
} = useStreaming()

// Auto-hide controls
let controlsTimeout: NodeJS.Timeout
const resetControlsTimeout = () => {
  clearTimeout(controlsTimeout)
  showControls.value = true
  controlsTimeout = setTimeout(() => {
    showControls.value = false
  }, 3000)
}

// Video player methods
const togglePlayPause = () => {
  if (!videoPlayer.value) return
  
  if (isPlaying.value) {
    videoPlayer.value.pause()
  } else {
    videoPlayer.value.play()
  }
  isPlaying.value = !isPlaying.value
}

const toggleMute = () => {
  if (!videoPlayer.value) return
  videoPlayer.value.muted = !videoPlayer.value.muted
  isMuted.value = videoPlayer.value.muted
}

const setVolume = () => {
  if (!videoPlayer.value) return
  videoPlayer.value.volume = volume.value / 100
  isMuted.value = volume.value === 0
}

const changeQuality = () => {
  // Implementation depends on your streaming setup
  console.log('Quality changed to:', selectedQuality.value)
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    videoPlayer.value?.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

// Stream actions
const toggleFollow = () => {
  isFollowing.value = !isFollowing.value
  emit('follow-toggle', isFollowing.value)
}

const openPewGiftModal = () => {
  emit('pewgift-click')
}

const shareStream = () => {
  emit('share')
}

// Video event handlers
const onVideoLoadStart = () => {
  isLoading.value = true
}

const onVideoCanPlay = () => {
  isLoading.value = false
  if (props.autoplay) {
    videoPlayer.value?.play()
    isPlaying.value = true
  }
}

const onVideoError = (error: Event) => {
  console.error('Video error:', error)
  isLoading.value = false
}

// Utility functions
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

// Lifecycle
onMounted(async () => {
  if (props.streamId) {
    await joinStream(props.streamId)
    
    // Setup HLS or WebRTC stream
    if (videoPlayer.value && props.stream?.hlsUrl) {
      videoPlayer.value.src = props.stream.hlsUrl
    }
  }
  
  // Mouse move handler for controls
  document.addEventListener('mousemove', resetControlsTimeout)
  resetControlsTimeout()
})

onUnmounted(() => {
  if (props.streamId) {
    leaveStream(props.streamId)
  }
  document.removeEventListener('mousemove', resetControlsTimeout)
  clearTimeout(controlsTimeout)
})

// Watch for fullscreen changes
watch(() => document.fullscreenElement, (element) => {
  isFullscreen.value = !!element
})
</script>

<style scoped>
.stream-player-container {
  @apply w-full bg-black rounded-lg overflow-hidden;
}

.video-container {
  @apply relative aspect-video bg-black;
}

.video-container.fullscreen {
  @apply fixed inset-0 z-50 aspect-auto;
}

.stream-video {
  @apply w-full h-full object-contain;
}

.loading-overlay,
.offline-overlay {
  @apply absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-75 text-white;
}

.loading-spinner {
  @apply w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4;
}

.offline-content {
  @apply text-center;
}

.video-controls {
  @apply absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 flex items-center justify-between opacity-0 transition-opacity duration-300;
}

.video-controls.visible {
  @apply opacity-100;
}

.controls-left,
.controls-right {
  @apply flex items-center gap-2;
}

.controls-center {
  @apply flex items-center gap-4;
}

.control-btn {
  @apply p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors;
}

.volume-slider input {
  @apply w-20;
}

.live-indicator {
  @apply flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full text-sm font-bold text-white;
}

.live-dot {
  @apply w-2 h-2 bg-white rounded-full animate-pulse;
}

.viewer-count {
  @apply flex items-center gap-1 text-white text-sm;
}

.quality-selector select {
  @apply bg-black bg-opacity-50 text-white border border-gray-600 rounded px-2 py-1 text-sm;
}

.pewgift-animations {
  @apply absolute top-4 right-4 pointer-events-none;
}

.pewgift-animation {
  @apply flex items-center gap-2 bg-purple-600 bg-opacity-90 text-white px-3 py-2 rounded-lg mb-2;
}

.pewgift-animation img {
  @apply w-8 h-8;
}

.gift-info {
  @apply flex flex-col text-sm;
}

.gift-sender {
  @apply font-bold;
}

.reaction-animations {
  @apply absolute inset-0 pointer-events-none overflow-hidden;
}

.reaction-emoji {
  @apply absolute bottom-0 text-4xl animate-bounce;
  animation: float-up 3s ease-out forwards;
}

.stream-info-bar {
  @apply flex items-center justify-between p-4 bg-gray-900 text-white;
}

.stream-details {
  @apply flex items-center gap-4;
}

.streamer-info {
  @apply flex items-center gap-3;
}

.streamer-avatar {
  @apply w-12 h-12 rounded-full;
}

.stream-stats {
  @apply flex items-center gap-4 text-sm text-gray-400;
}

.stat {
  @apply flex items-center gap-1;
}

.stream-actions {
  @apply flex items-center gap-2;
}

.action-btn {
  @apply flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors;
}

.follow-btn {
  @apply bg-red-600 hover:bg-red-700 text-white;
}

.follow-btn.active {
  @apply bg-gray-600 hover:bg-gray-700;
}

.pewgift-btn {
  @apply bg-purple-600 hover:bg-purple-700 text-white;
}

.share-btn {
  @apply bg-gray-600 hover:bg-gray-700 text-white;
}

/* Animations */
.pewgift-enter-active,
.pewgift-leave-active {
  transition: all 0.5s ease;
}

.pewgift-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.pewgift-leave-to {
  opacity: 0;
  transform: translateX(-100px);
}

.reaction-enter-active {
  transition: all 0.3s ease;
}

.reaction-enter-from {
  opacity: 0;
  transform: scale(0);
}

@keyframes float-up {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-200px) scale(1.5);
    opacity: 0;
  }
}
</style>
