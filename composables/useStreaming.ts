// composables/useStreaming.ts
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSocket } from '~/composables/useSocket'
import { useAuth } from '~/composables/useAuth'

interface StreamMessage {
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
    giftImage: string
    quantity: number
  }
}

interface StreamReaction {
  id: string
  userId: string
  username: string
  emoji: string
  timestamp: Date
  x: number
  delay: number
}

interface PewGift {
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
  animationType: 'normal' | 'combo' | 'special'
}

interface TypingUser {
  userId: string
  username: string
  isTyping: boolean
}

export const useStreaming = () => {
  // Composables
  const { user } = useAuth()
  const { socket, connect, disconnect } = useSocket()

  // Reactive state
  const isConnected = ref(false)
  const currentStreamId = ref<string | null>(null)
  const isLive = ref(false)
  const viewerCount = ref(0)
  const peakViewers = ref(0)
  const messages = ref<StreamMessage[]>([])
  const activeGifts = ref<PewGift[]>([])
  const activeReactions = ref<StreamReaction[]>([])
  const typingUsers = ref<TypingUser[]>([])

  // Stream management
  const joinStream = async (streamId: string) => {
    try {
      currentStreamId.value = streamId
      
      if (!socket.value) {
        await connect()
      }

      // Join stream room
      socket.value?.emit('join_stream', {
        streamId,
        userId: user.value?.id,
        username: user.value?.username,
        avatar: user.value?.avatar,
        isStreamer: false
      })

      // Set up event listeners
      setupStreamEventListeners()

      return true
    } catch (error) {
      console.error('Failed to join stream:', error)
      return false
    }
  }

  const leaveStream = async (streamId: string) => {
    try {
      socket.value?.emit('leave_stream', { streamId })
      
      // Clean up state
      currentStreamId.value = null
      isLive.value = false
      viewerCount.value = 0
      messages.value = []
      activeGifts.value = []
      activeReactions.value = []
      typingUsers.value = []

      return true
    } catch (error) {
      console.error('Failed to leave stream:', error)
      return false
    }
  }

  // Chat functionality
  const sendChatMessage = async (streamId: string, message: string, messageType: string = 'text') => {
    try {
      socket.value?.emit('stream_chat', {
        streamId,
        message,
        messageType
      })
      return true
    } catch (error) {
      console.error('Failed to send chat message:', error)
      return false
    }
  }

  const sendStreamReaction = async (streamId: string, emoji: string) => {
    try {
      socket.value?.emit('stream_reaction', {
        streamId,
        emoji
      })

      // Add local reaction animation
      addReactionAnimation(emoji)
      return true
    } catch (error) {
      console.error('Failed to send reaction:', error)
      return false
    }
  }

  const sendPewGift = async (streamId: string, giftData: {
    giftId: string
    quantity?: number
    message?: string
    isAnonymous?: boolean
  }) => {
    try {
      socket.value?.emit('send_pewgift', {
        streamId,
        ...giftData
      })
      return true
    } catch (error) {
      console.error('Failed to send PewGift:', error)
      return false
    }
  }

  // Stream broadcasting (for streamers)
  const startStreamBroadcast = async (streamId: string) => {
    try {
      // API call to start stream
      const response = await $fetch(`/api/streams/${streamId}/start`, {
        method: 'PUT'
      })

      if (response.success) {
        // Join as streamer
        await joinStreamAsStreamer(streamId)
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to start stream broadcast:', error)
      return false
    }
  }

  const endStreamBroadcast = async (streamId: string) => {
    try {
      const response = await $fetch(`/api/streams/${streamId}/end`, {
        method: 'PUT'
      })

      if (response.success) {
        await leaveStream(streamId)
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to end stream broadcast:', error)
      return false
    }
  }

  const pauseStreamBroadcast = async (streamId: string) => {
    try {
      socket.value?.emit('stream_status_update', {
        streamId,
        status: 'paused'
      })
      return true
    } catch (error) {
      console.error('Failed to pause stream:', error)
      return false
    }
  }

  const joinStreamAsStreamer = async (streamId: string) => {
    try {
      currentStreamId.value = streamId
      
      if (!socket.value) {
        await connect()
      }

      socket.value?.emit('join_stream', {
        streamId,
        userId: user.value?.id,
        username: user.value?.username,
        avatar: user.value?.avatar,
        isStreamer: true
      })

      setupStreamEventListeners()
      return true
    } catch (error) {
      console.error('Failed to join as streamer:', error)
      return false
    }
  }

  // Stream settings
  const updateStreamSettings = async (streamId: string, settings: any) => {
    try {
      const response = await $fetch(`/api/streams/${streamId}/settings`, {
        method: 'PUT',
        body: settings
      })
      return response.success
    } catch (error) {
      console.error('Failed to update stream settings:', error)
      return false
    }
  }

  // Event listeners setup
  const setupStreamEventListeners = () => {
    if (!socket.value) return

    // Connection events
    socket.value.on('joined_stream', (data: any) => {
      isConnected.value = true
      isLive.value = data.payload.stream.status === 'live'
      console.log('Joined stream successfully')
    })

    socket.value.on('left_stream', () => {
      isConnected.value = false
      console.log('Left stream successfully')
    })

    // Chat events
    socket.value.on('new_chat_message', (data: any) => {
      const message: StreamMessage = {
        id: data.payload.id,
        streamId: data.payload.streamId,
        userId: data.payload.userId,
        username: data.payload.username,
        message: data.payload.message,
        messageType: data.payload.messageType,
        timestamp: new Date(data.payload.timestamp),
        userAvatar: data.payload.userAvatar,
        userBadges: data.payload.userBadges,
        pewGiftData: data.payload.pewGiftData
      }
      
      messages.value.push(message)
      
      // Keep only last 100 messages for performance
      if (messages.value.length > 100) {
        messages.value = messages.value.slice(-100)
      }
    })

    // PewGift events
    socket.value.on('pewgift_received', (data: any) => {
      const gift: PewGift = {
        id: data.payload.id,
        streamId: data.payload.streamId,
        senderId: data.payload.senderId,
        senderUsername: data.payload.senderUsername,
        senderAvatar: data.payload.senderAvatar,
        giftId: data.payload.giftId,
        giftName: data.payload.giftName,
        giftImage: data.payload.giftImage,
        giftValue: data.payload.giftValue,
        quantity: data.payload.quantity,
        totalValue: data.payload.totalValue,
        message: data.payload.message,
        timestamp: new Date(data.payload.timestamp),
        animationType: data.payload.animationType
      }

      // Add gift animation
      activeGifts.value.push(gift)
      
      // Remove after animation duration
      setTimeout(() => {
        const index = activeGifts.value.findIndex(g => g.id === gift.id)
        if (index > -1) {
          activeGifts.value.splice(index, 1)
        }
      }, gift.animationType === 'combo' ? 5000 : 3000)
    })

    // Reaction events
    socket.value.on('stream_reaction', (data: any) => {
      addReactionAnimation(data.payload.emoji)
    })

    // Viewer count updates
    socket.value.on('viewer_count_updated', (data: any) => {
      viewerCount.value = data.payload.viewerCount
      peakViewers.value = data.payload.peakViewers
    })

    // User join/leave events
    socket.value.on('user_joined', (data: any) => {
      // Handle user joined notification
      console.log(`${data.payload.username} joined the stream`)
    })

    socket.value.on('user_left', (data: any) => {
      // Handle user left notification
      console.log(`${data.payload.username} left the stream`)
    })

    // Typing indicators
    socket.value.on('typing_indicator', (data: any) => {
      const { userId, username, isTyping } = data.payload
      
      if (isTyping) {
        const existingUser = typingUsers.value.find(u => u.userId === userId)
        if (!existingUser) {
          typingUsers.value.push({ userId, username, isTyping: true })
        }
      } else {
        const index = typingUsers.value.findIndex(u => u.userId === userId)
        if (index > -1) {
          typingUsers.value.splice(index, 1)
        }
      }
    })

    // Stream status changes
    socket.value.on('stream_status_changed', (data: any) => {
      isLive.value = data.payload.status === 'live'
    })

    // Error handling
    socket.value.on('error', (data: any) => {
      console.error('Stream error:', data.message)
    })
  }

  // Helper functions
  const addReactionAnimation = (emoji: string) => {
    const reaction: StreamReaction = {
      id: `reaction_${Date.now()}_${Math.random()}`,
      userId: user.value?.id || '',
      username: user.value?.username || '',
      emoji,
      timestamp: new Date(),
      x: Math.random() * 80 + 10, // Random position between 10% and 90%
      delay: Math.random() * 500 // Random delay up to 500ms
    }

    activeReactions.value.push(reaction)

    // Remove after animation
    setTimeout(() => {
      const index = activeReactions.value.findIndex(r => r.id === reaction.id)
      if (index > -1) {
        activeReactions.value.splice(index, 1)
      }
    }, 3000)
  }

  // API functions for stream management
  const createStream = async (streamData: {
    title: string
    description?: string
    privacy?: string
    categories?: string[]
    tags?: string[]
    scheduledTime?: Date
  }) => {
    try {
      const response = await $fetch('/api/streams/create', {
        method: 'POST',
        body: streamData
      })
      return response
    } catch (error) {
      console.error('Failed to create stream:', error)
      throw error
    }
  }

  const getActiveStreams = async (filters?: {
    page?: number
    limit?: number
    category?: string
    search?: string
  }) => {
    try {
      const response = await $fetch('/api/streams/active', {
        query: filters
      })
      return response
    } catch (error) {
      console.error('Failed to get active streams:', error)
      throw error
    }
  }

  const getStreamDetails = async (streamId: string) => {
    try {
      const response = await $fetch(`/api/streams/${streamId}`)
      return response
    } catch (error) {
      console.error('Failed to get stream details:', error)
      throw error
    }
  }

  const getUserStreams = async (userId: string) => {
    try {
      const response = await $fetch(`/api/streams/user/${userId}`)
      return response
    } catch (error) {
      console.error('Failed to get user streams:', error)
      throw error
    }
  }

  // Computed properties
  const streamSocket = computed(() => socket.value)
  const isStreamConnected = computed(() => isConnected.value && currentStreamId.value !== null)

  // Cleanup on unmount
  onUnmounted(() => {
    if (currentStreamId.value) {
      leaveStream(currentStreamId.value)
    }
  })

  return {
    // State
    isConnected: isStreamConnected,
    currentStreamId: readonly(currentStreamId),
    isLive: readonly(isLive),
    viewerCount: readonly(viewerCount),
    peakViewers: readonly(peakViewers),
    messages: readonly(messages),
    activeGifts: readonly(activeGifts),
    activeReactions: readonly(activeReactions),
    typingUsers: readonly(typingUsers),
    streamSocket,

    // Stream management
    joinStream,
    leaveStream,
    startStreamBroadcast,
    endStreamBroadcast,
    pauseStreamBroadcast,
    updateStreamSettings,

    // Chat and interactions
    sendChatMessage,
    sendStreamReaction,
    sendPewGift,

    // API functions
    createStream,
    getActiveStreams,
    getStreamDetails,
    getUserStreams
  }
}
