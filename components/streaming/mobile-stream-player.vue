<!-- components/streaming/MobileStreamPlayer.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import StreamChat from './StreamChat.vue'
import StreamControls from './stream-controls.vue'
import StreamAnalytics from './stream-analytics.vue'

// Props
const props = defineProps({
  streamId: {
    type: String,
    required: true
  },
  streamerId: {
    type: String,
    required: true
  },
  autoplay: {
    type: Boolean,
    default: true
  }
})

// Refs
const videoPlayer = ref(null)
const isFullscreen = ref(false)
const showControls = ref(true)
const isMuted = ref(false)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const viewerCount = ref(0)
const isFollowing = ref(false)
const followerCount = ref(0)
const streamTitle = ref('')
const streamerName = ref('')
const adaptiveStreamUrl = ref('')

// Methods
const togglePlayPause = () => {
  if (videoPlayer.value) {
    if (isPlaying.value) {
      videoPlayer.value.pause()
    } else {
      videoPlayer.value.play()
    }
  }
}

const toggleMute = () => {
  isMuted.value = !isMuted.value
}

const toggleFullscreen = async () => {
  try {
    if (!isFullscreen.value) {
      await videoPlayer.value?.requestFullscreen()
      isFullscreen.value = true
    } else {
      await document.exitFullscreen()
      isFullscreen.value = false
    }
  } catch (error) {
    console.error('Fullscreen error:', error)
  }
}

const exitFullscreen = async () => {
  try {
    await document.exitFullscreen()
    isFullscreen.value = false
  } catch (error) {
    console.error('Exit fullscreen error:', error)
  }
}

const onVideoLoaded = () => {
  duration.value = videoPlayer.value?.duration || 0
}

const onTimeUpdate = () => {
  currentTime.value = videoPlayer.value?.currentTime || 0
}

const onPlay = () => {
  isPlaying.value = true
}

const onPause = () => {
  isPlaying.value = false
}

const onBuffering = () => {
  console.log('Video buffering...')
}

const onCanPlay = () => {
  console.log('Video can play')
}

const shareStream = async () => {
  const shareUrl = `${window.location.origin}/stream/${props.streamId}`
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
    }
  } catch (error) {
    console.error('Failed to follow:', error)
  }
}

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const onMessageSent = (message) => {
  console.log('Message sent:', message)
}

const onUserJoined = (user) => {
  console.log('User joined:', user)
}

const onUserLeft = (userId) => {
  console.log('User left:', userId)
}

const loadStreamData = async () => {
  try {
    const response = await $fetch(`/api/streams/${props.streamId}`)
    streamTitle.value = response.title
    streamerName.value = response.streamerName
    adaptiveStreamUrl.value = response.streamUrl
    viewerCount.value = response.viewerCount
    isFollowing.value = response.isFollowing
    followerCount.value = response.followerCount
  } catch (error) {
    console.error('Failed to load stream data:', error)
  }
}

onMounted(() => {
  loadStreamData()
})

onUnmounted(() => {
  // Cleanup
})
</script>

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
            ← Back
          </button>
          
          <div class="stream-info-mobile">
            <div class="live-badge">
              <span class="live-dot"></span>
              LIVE
            </div>
            <div class="viewer-count-mobile">
              {{ formatNumber(viewerCount) }} watching
            </div>
          </div>
          
          <div class="mobile-actions">
            <button @click="toggleMute" class="control-btn-mobile">
              {{ isMuted ? '🔇' : '🔊' }}
            </button>
          </div>
        </div>

        <!-- Bottom Controls -->
        <div class="mobile-bottom-bar">
          <div class="progress-bar">
            <div class="progress" :style="{ width: (currentTime / duration) * 100 + '%' }"></div>
          </div>
          
          <div class="control-buttons">
            <button @click="shareStream" class="control-btn-mobile" title="Share">
              📤 Share
            </button>
            <button @click="followStreamer" class="control-btn-mobile" :class="{ 'following': isFollowing }" title="Follow">
              {{ isFollowing ? '✓ Following' : '+ Follow' }}
            </button>
            <button @click="toggleFullscreen" class="control-btn-mobile" title="Fullscreen">
              ⛶ Fullscreen
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Stream Chat Component (Responsive) -->
    <StreamChat 
      :stream-id="streamId"
      :streamer-id="streamerId"
      :max-messages="100"
      @message-sent="onMessageSent"
      @user-joined="onUserJoined"
      @user-left="onUserLeft"
    />

    <!-- Stream Controls -->
    <StreamControls 
      :stream-id="streamId"
      :is-playing="isPlaying"
    />

    <!-- Stream Analytics -->
    <StreamAnalytics 
      :stream-id="streamId"
      :viewer-count="viewerCount"
    />
  </div>
</template>

<style scoped>
.mobile-stream-player {
  width: 100%;
  height: 100%;
  background: #000;
  position: relative;
  display: flex;
  flex-direction: column;
}

.mobile-stream-player.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
}

.mobile-video-container {
  width: 100%;
  flex: 1;
  position: relative;
  background: #000;
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
  right: 0;
  bottom: 0;
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
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
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
  color: white;
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
  color: white;
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
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: bold;
  transition: background 0.2s;
}

.control-btn-mobile:hover {
  background: rgba(0,0,0,0.7);
}

.control-btn-mobile.following {
  background: rgba(0,128,0,0.5);
}

.mobile-bottom-bar {
  padding: 1rem;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255,255,255,0.3);
  border-radius: 2px;
  margin-bottom: 1rem;
  cursor: pointer;
}

.progress {
  height: 100%;
  background: #ff0000;
  border-radius: 2px;
  transition: width 0.1s;
}

.control-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  flex-wrap: wrap;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .mobile-top-bar {
    padding: 0.75rem;
  }

  .control-btn-mobile {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }

  .mobile-bottom-bar {
    padding: 0.75rem;
  }
}

@media (max-width: 480px) {
  .mobile-top-bar {
    padding: 0.5rem;
  }

  .live-badge {
    font-size: 0.75rem;
    padding: 0.2rem 0.5rem;
  }

  .viewer-count-mobile {
    font-size: 0.75rem;
  }

  .control-btn-mobile {
    padding: 0.3rem 0.6rem;
    font-size: 0.7rem;
  }

  .mobile-bottom-bar {
    padding: 0.5rem;
  }

  .control-buttons {
    gap: 0.25rem;
  }
}
</style>
