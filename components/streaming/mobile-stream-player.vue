<template>
  <div class="mobile-stream-player">
    <video
      ref="videoPlayer"
      :src="adaptiveStreamUrl"
      :autoplay="props.autoplay"
      class="stream-video"
      @loadedmetadata="onVideoLoaded"
      @timeupdate="onTimeUpdate"
      @play="onPlay"
      @pause="onPause"
      @waiting="onBuffering"
      @canplay="onCanPlay"
    />
    <div class="stream-overlay">
      <div class="stream-info">
        <h3>{{ streamTitle }}</h3>
        <p>{{ streamerName }}</p>
        <span class="viewer-count">{{ formatNumber(viewerCount) }} viewers</span>
      </div>
      <div class="stream-actions">
        <button @click="togglePlayPause">{{ isPlaying ? 'Pause' : 'Play' }}</button>
        <button @click="toggleMute">{{ isMuted ? 'Unmute' : 'Mute' }}</button>
        <button @click="toggleFullscreen">Fullscreen</button>
        <button @click="shareStream">Share</button>
        <button @click="followStreamer">Follow</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// NEW: Import composables with kebab-case naming
import { useSocket } from '~/composables/use-socket'
import { useUser } from '~/composables/use-user'
import { useMobileDetection } from '~/composables/use-mobile-detection'

// Initialize composables
const { socket, connect, disconnect, on } = useSocket('/streaming')
const { isAuthenticated, fetchUserProfile } = useUser()
const { isMobile, screenSize, isTablet, deviceOrientation } = useMobileDetection()

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
const videoPlayer = ref<HTMLVideoElement | null>(null)
const isFullscreen = ref(false)
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
const adaptiveEnabled = ref(false)

const initializeHLS = (_video: HTMLVideoElement) => {
  // TODO: implement HLS initialization when use-adaptive-streaming composable is available
  console.log('[mobile-stream-player] HLS init requested')
}

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

const onVideoLoaded = () => {
  duration.value = videoPlayer.value?.duration || 0
  // Initialize adaptive streaming when video is loaded
  if (videoPlayer.value && adaptiveEnabled.value) {
    initializeHLS(videoPlayer.value)
  }
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
    const response = await $fetch<{ success: boolean }>('/api/users/follow', {
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

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const loadStreamData = async () => {
  try {
    const response = await $fetch<{
      title: string
      streamerName: string
      streamUrl: string
      viewerCount: number
      isFollowing: boolean
      followerCount: number
    }>(`/api/streams/${props.streamId}`)
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

  // Fetch user profile if authenticated
  if (isAuthenticated.value) {
    fetchUserProfile()
  }

  // Initialize socket connection
  if (socket) {
    connect()
    on('stream:viewerCount', (count: number) => {
      viewerCount.value = count
    })
  }

  // Log device info
  console.log('Device Info:', {
    isMobile: isMobile.value,
    isTablet: isTablet.value,
    screenSize: screenSize.value,
    orientation: deviceOrientation.value
  })
})

onUnmounted(() => {
  // Cleanup socket connection
  if (socket) {
    disconnect()
  }
})
</script>

