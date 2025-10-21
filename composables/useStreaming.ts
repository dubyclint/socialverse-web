// composables/useStreaming.ts - MERGED VERSION
import { ref, computed, onMounted, onUnmounted, readonly } from 'vue'
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

      socket.value?.emit('join_stream', {
        streamId,
        userId: user.value?.id,
        username: user.value?.username,
        avatar: user.value?.avatar,
        isStreamer: false
      })

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
      const response = await $fetch(`/api/streams/${streamId}/start`, {
        method: 'PUT'
      })

      if (response.success) {
        isLive.value = true
        currentStreamId.value = streamId
        return response.data
      }
      throw new Error(response.message)
    } catch (error) {
      console.error('Failed to start broadcast:', error)
      throw error
    }
  }

  const endStreamBroadcast = async (streamId: string) => {
    try {
      const response = await $fetch(`/api/streams/${streamId}/end`, {
        method: 'PUT'
      })

      if (response.success) {
        isLive.value = false
        return response.data
      }
      throw new Error(response.message)
    } catch (error) {
      console.error('Failed to end broadcast:', error)
      throw error
    }
  }

  // Event listeners setup
  const setupStreamEventListeners = () => {
    socket.value?.on('stream_connected', (data) => {
      isConnected.value = true
      viewerCount.value = data.viewerCount || 0
      peakViewers.value = Math.max(peakViewers.value, viewerCount.value)
    })

    socket.value?.on('viewer_count_updated', (data) => {
      viewerCount.value = data.count
      peakViewers.value = Math.max(peakViewers.value, viewerCount.value)
    })

    socket.value?.on('stream_message', (message: StreamMessage) => {
      messages.value.push(message)
    })

    socket.value?.on('pewgift_received', (gift: PewGift) => {
      activeGifts.value.push(gift)
      setTimeout(() => {
        activeGifts.value = activeGifts.value.filter(g => g.id !== gift.id)
      }, 5000)
    })

    socket.value?.on('reaction_received', (reaction: StreamReaction) => {
      activeReactions.value.push(reaction)
      setTimeout(() => {
        activeReactions.value = activeReactions.value.filter(r => r.id !== reaction.id)
      }, 2000)
    })

    socket.value?.on('user_typing', (data) => {
      const existingUser = typingUsers.value.find(u => u.userId === data.userId)
      if (existingUser) {
        existingUser.isTyping = data.isTyping
      } else {
        typingUsers.value.push(data)
      }
    })
  }

  const addReactionAnimation = (emoji: string) => {
    const reaction: StreamReaction = {
      id: Math.random().toString(),
      userId: user.value?.id || '',
      username: user.value?.username || '',
      emoji,
      timestamp: new Date(),
      x: Math.random() * 100,
      delay: 0
    }
    activeReactions.value.push(reaction)
  }

  // Cleanup
  onUnmounted(() => {
    if (currentStreamId.value) {
      leaveStream(currentStreamId.value)
    }
    disconnect()
  })

  return {
    // State
    isConnected: readonly(isConnected),
    currentStreamId: readonly(currentStreamId),
    isLive: readonly(isLive),
    viewerCount: readonly(viewerCount),
    peakViewers: readonly(peakViewers),
    messages: readonly(messages),
    activeGifts: readonly(activeGifts),
    activeReactions: readonly(activeReactions),
    typingUsers: readonly(typingUsers),
    
    // Methods
    joinStream,
    leaveStream,
    sendChatMessage,
    sendStreamReaction,
    sendPewGift,
    startStreamBroadcast,
    endStreamBroadcast
  }
}
