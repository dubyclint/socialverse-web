// composables/useEnhancedStreaming.ts
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'

interface StreamUser {
  userId: string
  username: string
  avatar?: string
  isStreamer: boolean
  isModerator: boolean
  isTyping: boolean
}

interface ChatMessage {
  id: string
  userId: string
  username: string
  avatar?: string
  message: string
  timestamp: string
  messageType: 'text' | 'pewgift' | 'reaction' | 'system'
  reactions: Record<string, string[]>
  isModerated: boolean
  isPinned: boolean
}

interface StreamAnalytics {
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

interface LiveReaction {
  id: string
  userId: string
  username: string
  emoji: string
  position?: { x: number; y: number }
  timestamp: string
}

export const useEnhancedStreaming = (streamId: string) => {
  // WebSocket connection
  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const connectionError = ref<string | null>(null)

  // Stream state
  const streamStatus = ref<'scheduled' | 'live' | 'ended' | 'paused'>('scheduled')
  const isStreamer = ref(false)
  const isModerator = ref(false)

  // Users and viewers
  const currentViewers = ref(0)
  const peakViewers = ref(0)
  const connectedUsers = reactive<Map<string, StreamUser>>(new Map())
  const typingUsers = ref<string[]>([])

  // Chat system
  const chatMessages = reactive<ChatMessage[]>([])
  const isTyping = ref(false)
  const typingTimeout = ref<NodeJS.Timeout | null>(null)

  // Live reactions
  const liveReactions = reactive<LiveReaction[]>([])
  const reactionTimeout = 3000 // 3 seconds

  // Analytics
  const analytics = reactive<StreamAnalytics>({
    streamId: '',
    currentViewers: 0,
    peakViewers: 0,
    totalViews: 0,
    chatMessages: 0,
    pewGifts: 0,
    reactions: {},
    averageWatchTime: 0,
    engagementRate: 0,
    streamDuration: 0,
    streamStatus: 'scheduled'
  })

  // Computed properties
  const engagementRate = computed(() => {
    if (analytics.totalViews === 0) return 0
    return ((analytics.chatMessages + analytics.pewGifts) / analytics.totalViews * 100).toFixed(1)
  })

  const topReactions = computed(() => {
    return Object.entries(analytics.reactions)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([emoji, count]) => ({ emoji, count }))
  })

  const typingIndicator = computed(() => {
    if (typingUsers.value.length === 0) return ''
    if (typingUsers.value.length === 1) return `${typingUsers.value[0]} is typing...`
    if (typingUsers.value.length === 2) return `${typingUsers.value[0]} and ${typingUsers.value[1]} are typing...`
    return `${typingUsers.value[0]} and ${typingUsers.value.length - 1} others are typing...`
  })

  // WebSocket connection management
  const connect = async (userId: string, username: string, avatar?: string, userIsStreamer = false, userIsModerator = false) => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/api/ws/enhanced-streaming`
      
      ws.value = new WebSocket(wsUrl)
      isStreamer.value = userIsStreamer
      isModerator.value = userIsModerator

      ws.value.onopen = () => {
        console.log('Enhanced streaming WebSocket connected')
        isConnected.value = true
        connectionError.value = null
        
        // Join stream
        sendMessage('join_stream', {
          streamId,
          userId,
          username,
          avatar,
          isStreamer: userIsStreamer,
          isModerator: userIsModerator
        })
      }

      ws.value.onmessage = (event) => {
        handleMessage(JSON.parse(event.data))
      }

      ws.value.onclose = () => {
        console.log('Enhanced streaming WebSocket disconnected')
        isConnected.value = false
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (!isConnected.value) {
            connect(userId, username, avatar, userIsStreamer, userIsModerator)
          }
        }, 3000)
      }

      ws.value.onerror = (error) => {
        console.error('Enhanced streaming WebSocket error:', error)
        connectionError.value = 'Connection failed'
      }

    } catch (error) {
      console.error('Failed to connect to enhanced streaming:', error)
      connectionError.value = 'Failed to connect'
    }
  }

  const disconnect = () => {
    if (ws.value) {
      sendMessage('leave_stream', { streamId })
      ws.value.close()
      ws.value = null
    }
    isConnected.value = false
  }

  // Message handling
  const sendMessage = (type: string, payload: any) => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type, payload }))
    }
  }

  const handleMessage = (data: any) => {
    const { type, data: messageData, timestamp } = data

    switch (type) {
      case 'connection':
        console.log('Connected to enhanced streaming server')
        break

      case 'stream_joined':
        streamStatus.value = messageData.streamStatus
        currentViewers.value = messageData.viewerCount
        break

      case 'viewer_count_update':
        currentViewers.value = messageData.viewerCount
        peakViewers.value = messageData.peakViewers
        break

      case 'user_joined':
        // Add user joined notification to chat
        addSystemMessage(`${messageData.username} joined the stream`)
        break

      case 'user_left':
        // Add user left notification to chat
        addSystemMessage(`${messageData.username} left the stream`)
        break

      case 'stream_chat_message':
        chatMessages.push({
          ...messageData,
          timestamp: new Date(messageData.timestamp).toISOString()
        })
        // Keep only last 100 messages for performance
        if (chatMessages.length > 100) {
          chatMessages.splice(0, chatMessages.length - 100)
        }
        break

      case 'typing_indicator':
        handleTypingIndicator(messageData)
        break

      case 'message_reaction_update':
        updateMessageReaction(messageData)
        break

      case 'live_reaction':
        addLiveReaction(messageData)
        break

      case 'pewgift_sent':
        handlePewGiftReceived(messageData)
        break

      case 'stream_analytics':
        Object.assign(analytics, messageData)
        break

      case 'stream_status_update':
        streamStatus.value = messageData.status
        break

      case 'error':
        console.error('Streaming error:', messageData.message)
        connectionError.value = messageData.message
        break

      default:
        console.log('Unknown message type:', type)
    }
  }

  // Chat functions
  const sendChatMessage = (message: string) => {
    if (!message.trim()) return

    sendMessage('stream_chat', {
      streamId,
      message: message.trim(),
      messageType: 'text'
    })
  }

  const startTyping = () => {
    if (!isTyping.value) {
      isTyping.value = true
      sendMessage('typing_start', { streamId })
    }

    // Reset typing timeout
    if (typingTimeout.value) {
      clearTimeout(typingTimeout.value)
    }

    typingTimeout.value = setTimeout(() => {
      stopTyping()
    }, 3000) // Stop typing after 3 seconds of inactivity
  }

  const stopTyping = () => {
    if (isTyping.value) {
      isTyping.value = false
      sendMessage('typing_stop', { streamId })
    }

    if (typingTimeout.value) {
      clearTimeout(typingTimeout.value)
      typingTimeout.value = null
    }
  }

  const addMessageReaction = (messageId: string, emoji: string) => {
    sendMessage('message_reaction', {
      streamId,
      messageId,
      emoji,
      action: 'add'
    })
  }

  const removeMessageReaction = (messageId: string, emoji: string) => {
    sendMessage('message_reaction', {
      streamId,
      messageId,
      emoji,
      action: 'remove'
    })
  }

  // Live reactions
  const sendLiveReaction = (emoji: string, position?: { x: number; y: number }) => {
    sendMessage('stream_reaction', {
      streamId,
      emoji,
      position
    })
  }

  const addLiveReaction = (reactionData: any) => {
    const reaction: LiveReaction = {
      id: reactionData.id,
      userId: reactionData.userId,
      username: reactionData.username,
      emoji: reactionData.emoji,
      position: reactionData.position,
      timestamp: reactionData.timestamp || new Date().toISOString()
    }

    liveReactions.push(reaction)

    // Remove reaction after timeout
    setTimeout(() => {
      const index = liveReactions.findIndex(r => r.id === reaction.id)
      if (index > -1) {
        liveReactions.splice(index, 1)
      }
    }, reactionTimeout)
  }

  // PewGift functions
  const sendPewGift = (receiverId: string, giftType: string, amount: number, message?: string) => {
    sendMessage('send_pewgift', {
      streamId,
      receiverId,
      giftType,
      amount,
      message
    })
  }

  const handlePewGiftReceived = (giftData: any) => {
    // Add PewGift to chat as special message
    chatMessages.push({
      id: giftData.id,
      userId: giftData.senderId,
      username: giftData.senderUsername,
      avatar: giftData.senderAvatar,
      message: `sent ${giftData.amount} ${giftData.giftType}${giftData.message ? `: ${giftData.message}` : ''}`,
      timestamp: giftData.timestamp,
      messageType: 'pewgift',
      reactions: {},
      isModerated: false,
      isPinned: false
    })

    // Trigger gift animation
    triggerGiftAnimation(giftData)
  }

  // Analytics functions
  const requestAnalytics = () => {
    if (isStreamer.value || isModerator.value) {
      sendMessage('request_analytics', { streamId })
    }
  }

  const updateStreamStatus = (status: 'live' | 'ended' | 'paused') => {
    if (isStreamer.value) {
      sendMessage('stream_status_update', { streamId, status })
    }
  }

  // Moderation functions
  const banUser = (userId: string, reason?: string) => {
    if (isStreamer.value || isModerator.value) {
      sendMessage('ban_user', { streamId, userId, reason })
    }
  }

  const timeoutUser = (userId: string, duration: number, reason?: string) => {
    if (isStreamer.value || isModerator.value) {
      sendMessage('timeout_user', { streamId, userId, duration, reason })
    }
  }

  const deleteMessage = (messageId: string) => {
    if (isStreamer.value || isModerator.value) {
      sendMessage('delete_message', { streamId, messageId })
      
      // Remove from local chat
      const index = chatMessages.findIndex(msg => msg.id === messageId)
      if (index > -1) {
        chatMessages.splice(index, 1)
      }
    }
  }

  const pinMessage = (messageId: string) => {
    if (isStreamer.value || isModerator.value) {
      sendMessage('pin_message', { streamId, messageId })
    }
  }

  // Helper functions
  const handleTypingIndicator = (data: any) => {
    const { userId, username, isTyping: userIsTyping } = data
    
    if (userIsTyping) {
      if (!typingUsers.value.includes(username)) {
        typingUsers.value.push(username)
      }
    } else {
      const index = typingUsers.value.indexOf(username)
      if (index > -1) {
        typingUsers.value.splice(index, 1)
      }
    }
  }

  const updateMessageReaction = (data: any) => {
    const { messageId, reactions } = data
    const message = chatMessages.find(msg => msg.id === messageId)
    if (message) {
      message.reactions = reactions
    }
  }

  const addSystemMessage = (message: string) => {
    chatMessages.push({
      id: `system_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: 'system',
      username: 'System',
      message,
      timestamp: new Date().toISOString(),
      messageType: 'system',
      reactions: {},
      isModerated: false,
      isPinned: false
    })
  }

  const triggerGiftAnimation = (giftData: any) => {
    // Emit event for gift animation component
    const event = new CustomEvent('pewgift-received', {
      detail: giftData
    })
    window.dispatchEvent(event)
  }

  // Heartbeat to maintain connection
  const startHeartbeat = () => {
    setInterval(() => {
      if (isConnected.value) {
        sendMessage('heartbeat', { streamId, timestamp: new Date().toISOString() })
      }
    }, 30000) // Every 30 seconds
  }

  // Lifecycle
  onMounted(() => {
    startHeartbeat()
  })

  onUnmounted(() => {
    disconnect()
    if (typingTimeout.value) {
      clearTimeout(typingTimeout.value)
    }
  })

  return {
    // Connection state
    isConnected,
    connectionError,
    connect,
    disconnect,

    // Stream state
    streamStatus,
    isStreamer,
    isModerator,
    currentViewers,
    peakViewers,

    // Chat
    chatMessages,
    sendChatMessage,
    startTyping,
    stopTyping,
    isTyping,
    typingIndicator,
    addMessageReaction,
    removeMessageReaction,

    // Live reactions
    liveReactions,
    sendLiveReaction,

    // PewGifts
    sendPewGift,

    // Analytics
    analytics,
    engagementRate,
    topReactions,
    requestAnalytics,

    // Stream management
    updateStreamStatus,

    // Moderation
    banUser,
    timeoutUser,
    deleteMessage,
    pinMessage
  }
}
