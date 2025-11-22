<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import StreamChat from './StreamChat.vue'
import StreamControls from './stream-controls.vue'
import StreamAnalytics from './stream-analytics.vue'

// NEW: Import composables with kebab-case naming
import { useSocket } from '~/composables/use-socket'
import { useUser } from '~/composables/use-user'
import { useMobileDetection } from '~/composables/use-mobile-detection'
import { useAdaptiveStreaming } from '~/composables/use-adaptive-streaming'

// Initialize composables
const { socket, connect, disconnect, emit, on } = useSocket()
const { user, isAuthenticated, profile, fetchUserProfile } = useUser()
const { isMobile, screenSize, isTablet, deviceOrientation } = useMobileDetection()
const { selectedQuality, availableQualities, initializeHLS, adaptiveEnabled } = useAdaptiveStreaming('')

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
  // Emit socket event for real-time chat
  if (socket) {
    emit('chat:message', { streamId: props.streamId, message })
  }
}

const onUserJoined = (user) => {
  console.log('User joined:', user)
  // Emit socket event
  if (socket) {
    emit('user:joined', { streamId: props.streamId, user })
  }
}

const onUserLeft = (userId) => {
  console.log('User left:', userId)
  // Emit socket event
  if (socket) {
    emit('user:left', { streamId: props.streamId, userId })
  }
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
  
  // Fetch user profile if authenticated
  if (isAuthenticated.value) {
    fetchUserProfile()
  }
  
  // Initialize socket connection
  if (socket) {
    connect()
    on('stream:viewerCount', (count) => {
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

