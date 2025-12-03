// ============================================================================
// FILE 2: /composables/use-streaming.ts - COMPLETE FIXED VERSION
// ============================================================================
// CONSOLIDATED STREAMING COMPOSABLE - MODULAR EXPORTS
// FIXED: Removed duplicate ChatMessage interface - now imports from stores
// ============================================================================

import { ref, computed, reactive, onMounted, onUnmounted, readonly, watch } from 'vue'
import { useSocket } from '~/composables/use-socket'
import { useAuth } from '~/composables/use-auth'
import type { ChatMessage } from '~/stores/chat'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface StreamMessage {
  id: string
  streamId: string
  userId: string
  username: string
  message: string
  messageType: 'text' | 'pewgift' | 'reaction' | 'system'
  timestamp: Date
  userAvatar?: string
  userBadges?: string[]
  pewGiftData?: {
    giftId: string
    giftName: string
    giftValue: number
    gifImage: string
    quantity: number
  }
}

export interface StreamReaction {
  id: string
  userId: string
  username: string
  emoji: string
  timestamp: Date
  x: number
  delay: number
}

export interface PewGift {
  id: string
  streamId: string
  senderId: string
  senderUsername: string
  senderAvatar?: string
  giftId: string
  giftName: string
  giftImage: string
  giftValue: number
  quantity: number
  totalValue: number
  message?: string
  timestamp: Date
  animationType: 'normal' | 'special' | 'legendary'
}

export interface StreamUser {
  userId: string
  username: string
  avatar?: string
  isStreamer: boolean
  isModerator: boolean
  isTyping: boolean
}

export interface StreamAnalytics {
  streamId: string
  currentViewers: number
  peakViewers: number
  totalViews: number
  chatMessages: number
  pewGifts: number
  reactions: Record<string, number>
  averageWatchTime: number
  engagementRate: number
  streamDuration: number
  streamStatus: string
}

export interface LiveReaction {
  id: string
  userId: string
  username: string
  emoji: string
  position?: { x: number; y: number }
  timestamp: string
}

export interface StreamQuality {
  label: string
  bitrate: number
  resolution: string
  fps: number
}

export interface AdaptiveStreamConfig {
  baseStreamUrl: string
  enableAdaptive: boolean
  minQuality: string
  maxQuality: string
  autoQualitySwitch: boolean
}

// ============================================================================
// CORE STREAMING COMPOSABLE
// ============================================================================

export const useStreaming = (streamId: string) => {
  const { user } = useAuth()
  const socket = useSocket()

  // State
  const messages = ref<StreamMessage[]>([])
  const reactions = ref<StreamReaction[]>([])
  const pewGifts = ref<PewGift[]>([])
  const streamUsers = ref<StreamUser[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isConnected = ref(false)

  // Computed
  const messageCount = computed(() => messages.value.length)
  const reactionCount = computed(() => reactions.value.length)
  const pewGiftCount = computed(() => pewGifts.value.length)
  const totalPewGiftValue = computed(() =>
    pewGifts.value.reduce((sum, gift) => sum + gift.totalValue, 0)
  )
  const activeUsers = computed(() =>
    streamUsers.value.filter(u => u.userId !== user.value?.id)
  )

  // Methods
  const sendMessage = async (message: string): Promise<void> => {
    if (!message.trim() || !user.value) return

    const newMessage: StreamMessage = {
      id: `msg-${Date.now()}`,
      streamId,
      userId: user.value.id,
      username: user.value.username,
      message,
      messageType: 'text',
      timestamp: new Date(),
      userAvatar: user.value.avatar
    }

    messages.value.push(newMessage)
    socket.emit('stream:message', newMessage)
  }

  const sendReaction = (emoji: string): void => {
    if (!user.value) return

    const reaction: StreamReaction = {
      id: `reaction-${Date.now()}`,
      userId: user.value.id,
      username: user.value.username,
      emoji,
      timestamp: new Date(),
      x: Math.random() * 100,
      delay: Math.random() * 0.5
    }

    reactions.value.push(reaction)
    socket.emit('stream:reaction', reaction)

    // Auto-remove after animation
    setTimeout(() => {
      reactions.value = reactions.value.filter(r => r.id !== reaction.id)
    }, 3000)
  }

  const sendPewGift = async (giftId: string, quantity: number = 1, message?: string): Promise<void> => {
    if (!user.value) return

    const pewGift: PewGift = {
      id: `gift-${Date.now()}`,
      streamId,
      senderId: user.value.id,
      senderUsername: user.value.username,
      senderAvatar: user.value.avatar,
      giftId,
      giftName: `Gift ${giftId}`,
      giftImage: `/gifts/${giftId}.png`,
      giftValue: 100,
      quantity,
      totalValue: 100 * quantity,
      message,
      timestamp: new Date(),
      animationType: 'normal'
    }

    pewGifts.value.push(pewGift)
    socket.emit('stream:pewgift', pewGift)
  }

  const clearMessages = (): void => {
    messages.value = []
  }

  const clearReactions = (): void => {
    reactions.value = []
  }

  // Lifecycle
  onMounted(() => {
    socket.on('stream:message', (msg: StreamMessage) => {
      messages.value.push(msg)
    })

    socket.on('stream:reaction', (reaction: StreamReaction) => {
      reactions.value.push(reaction)
      setTimeout(() => {
        reactions.value = reactions.value.filter(r => r.id !== reaction.id)
      }, 3000)
    })

    socket.on('stream:pewgift', (gift: PewGift) => {
      pewGifts.value.push(gift)
    })

    socket.emit('stream:join', { streamId, userId: user.value?.id })
    isConnected.value = true
  })

  onUnmounted(() => {
    socket.emit('stream:leave', { streamId, userId: user.value?.id })
    socket.off('stream:message')
    socket.off('stream:reaction')
    socket.off('stream:pewgift')
    isConnected.value = false
  })

  return {
    // State
    messages: readonly(messages),
    reactions: readonly(reactions),
    pewGifts: readonly(pewGifts),
    streamUsers: readonly(streamUsers),
    loading: readonly(loading),
    error: readonly(error),
    isConnected: readonly(isConnected),

    // Computed
    messageCount,
    reactionCount,
    pewGiftCount,
    totalPewGiftValue,
    activeUsers,

    // Methods
    sendMessage,
    sendReaction,
    sendPewGift,
    clearMessages,
    clearReactions
  }
}

// ============================================================================
// ENHANCED STREAMING COMPOSABLE (Modular Export)
// ============================================================================

export const useEnhancedStreaming = (streamId: string) => {
  const streamAnalytics = ref<StreamAnalytics>({
    streamId,
    currentViewers: 0,
    peakViewers: 0,
    totalViews: 0,
    chatMessages: 0,
    pewGifts: 0,
    reactions: {},
    averageWatchTime: 0,
    engagementRate: 0,
    streamDuration: 0,
    streamStatus: 'live'
  })

  const pinnedMessages = ref<ChatMessage[]>([])
  const moderatedMessages = ref<ChatMessage[]>([])
  const typingUsers = ref<string[]>([])

  const updateAnalytics = (data: Partial<StreamAnalytics>): void => {
    streamAnalytics.value = { ...streamAnalytics.value, ...data }
  }

  const pinMessage = (message: ChatMessage): void => {
    if (!pinnedMessages.value.find(m => m.id === message.id)) {
      pinnedMessages.value.push(message)
    }
  }

  const unpinMessage = (messageId: string): void => {
    pinnedMessages.value = pinnedMessages.value.filter(m => m.id !== messageId)
  }

  const moderateMessage = (message: ChatMessage): void => {
    message.isModerated = true
    moderatedMessages.value.push(message)
  }

  const addTypingUser = (username: string): void => {
    if (!typingUsers.value.includes(username)) {
      typingUsers.value.push(username)
    }
  }

  const removeTypingUser = (username: string): void => {
    typingUsers.value = typingUsers.value.filter(u => u !== username)
  }

  return {
    streamAnalytics: readonly(streamAnalytics),
    pinnedMessages: readonly(pinnedMessages),
    moderatedMessages: readonly(moderatedMessages),
    typingUsers: readonly(typingUsers),

    updateAnalytics,
    pinMessage,
    unpinMessage,
    moderateMessage,
    addTypingUser,
    removeTypingUser
  }
}

// ============================================================================
// ADAPTIVE STREAMING COMPOSABLE (Modular Export)
// ============================================================================

export const useAdaptiveStreaming = (config: AdaptiveStreamConfig) => {
  const selectedQuality = ref<string>('auto')
  const availableQualities = ref<StreamQuality[]>([
    { label: '1080p', bitrate: 5000, resolution: '1920x1080', fps: 60 },
    { label: '720p', bitrate: 2500, resolution: '1280x720', fps: 60 },
    { label: '480p', bitrate: 1000, resolution: '854x480', fps: 30 },
    { label: '360p', bitrate: 500, resolution: '640x360', fps: 30 }
  ])
  const currentBitrate = ref<number>(0)
  const networkSpeed = ref<number>(0)
  const bufferHealth = ref<number>(100)
  const isBuffering = ref<boolean>(false)
  const adaptiveEnabled = ref<boolean>(config.enableAdaptive)

  let hls: any = null
  let speedTestInterval: NodeJS.Timeout | null = null
  let qualityCheckInterval: NodeJS.Timeout | null = null

  const initializeHLS = async (videoElement: HTMLVideoElement): Promise<void> => {
    if (!window.Hls) {
      const HLS = await import('hls.js')
      window.Hls = HLS.default
    }

    if (window.Hls.isSupported()) {
      hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        maxBufferSize: 60 * 1000 * 1000,
        maxBufferHole: 0.5
      })

      hls.loadSource(config.baseStreamUrl)
      hls.attachMedia(videoElement)

      hls.on('hlsManifestParsed', () => {
        const levels = hls.levels.map((level: any) => ({
          label: `${level.height}p`,
          bitrate: level.bitrate,
          resolution: `${level.width}x${level.height}`,
          fps: level.fps || 30
        }))
        availableQualities.value = levels
      })

      startQualityMonitoring()
    }
  }

  const startQualityMonitoring = (): void => {
    qualityCheckInterval = setInterval(() => {
      if (hls) {
        const stats = hls.getMetrics()
        if (stats && stats.bufferStalled) {
          bufferHealth.value = Math.max(0, bufferHealth.value - 10)
          isBuffering.value = true
        } else {
          bufferHealth.value = Math.min(100, bufferHealth.value + 5)
          isBuffering.value = false
        }

        if (adaptiveEnabled.value && bufferHealth.value < 30) {
          switchToLowerQuality()
        } else if (adaptiveEnabled.value && bufferHealth.value > 80) {
          switchToHigherQuality()
        }
      }
    }, 1000)
  }

  const switchToLowerQuality = (): void => {
    if (hls && hls.currentLevel > 0) {
      hls.currentLevel = hls.currentLevel - 1
      selectedQuality.value = availableQualities.value[hls.currentLevel]?.label || 'auto'
    }
  }

  const switchToHigherQuality = (): void => {
    if (hls && hls.currentLevel < hls.levels.length - 1) {
      hls.currentLevel = hls.currentLevel + 1
      selectedQuality.value = availableQualities.value[hls.currentLevel]?.label || 'auto'
    }
  }

  const setQuality = (quality: string): void => {
    if (hls) {
      const levelIndex = availableQualities.value.findIndex(q => q.label === quality)
      if (levelIndex >= 0) {
        hls.currentLevel = levelIndex
        selectedQuality.value = quality
      }
    }
  }

  const destroy = (): void => {
    if (speedTestInterval) clearInterval(speedTestInterval)
    if (qualityCheckInterval) clearInterval(qualityCheckInterval)
    if (hls) hls.destroy()
  }

  onUnmounted(() => {
    destroy()
  })

  return {
    selectedQuality: readonly(selectedQuality),
    availableQualities: readonly(availableQualities),
    currentBitrate: readonly(currentBitrate),
    networkSpeed: readonly(networkSpeed),
    bufferHealth: readonly(bufferHealth),
    isBuffering: readonly(isBuffering),
    adaptiveEnabled: readonly(adaptiveEnabled),

    initializeHLS,
    setQuality,
    switchToLowerQuality,
    switchToHigherQuality,
    destroy
  }
}
