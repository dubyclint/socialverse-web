import { ref, computed, readonly, onMounted, onUnmounted } from 'vue'
import { useSocket } from '~/composables/use-socket'
import { useAuthStore } from '~/stores/auth' // Pinia Auth Store
import type { ChatMessage } from '~/stores/chat'

// ... (Types & Interfaces remain unchanged as provided in your file) ...

// ============================================================================
// CORE STREAMING COMPOSABLE
// ============================================================================

export const useStreaming = (streamId: string) => {
  const authStore = useAuthStore() // Access centralized auth
  const socket = useSocket()

  // State
  const messages = ref<StreamMessage[]>([])
  const reactions = ref<StreamReaction[]>([])
  const pewGifts = ref<PewGift[]>([])
  const streamUsers = ref<StreamUser[]>([])
  const isConnected = ref(false)

  // Computed
  const activeUsers = computed(() =>
    streamUsers.value.filter(u => u.userId !== authStore.userId)
  )

  // Methods
  const sendMessage = async (message: string): Promise<void> => {
    if (!message.trim() || !authStore.isAuthenticated) return

    const newMessage: StreamMessage = {
      id: `msg-${Date.now()}`,
      streamId,
      userId: authStore.userId!,
      username: authStore.user?.username || 'Anonymous',
      message,
      messageType: 'text',
      timestamp: new Date(),
      userAvatar: authStore.user?.avatar
    }

    messages.value.push(newMessage)
    socket.emit('stream:message', newMessage)
  }

  const sendReaction = (emoji: string): void => {
    if (!authStore.isAuthenticated) return

    const reaction: StreamReaction = {
      id: `reaction-${Date.now()}`,
      userId: authStore.userId!,
      username: authStore.user?.username || 'Anonymous',
      emoji,
      timestamp: new Date(),
      x: Math.random() * 100,
      delay: Math.random() * 0.5
    }

    reactions.value.push(reaction)
    socket.emit('stream:reaction', reaction)
    setTimeout(() => {
      reactions.value = reactions.value.filter(r => r.id !== reaction.id)
    }, 3000)
  }

  const sendPewGift = async (giftId: string, quantity: number = 1, message?: string): Promise<void> => {
    if (!authStore.isAuthenticated) return

    const pewGift: PewGift = {
      id: `gift-${Date.now()}`,
      streamId,
      senderId: authStore.userId!,
      senderUsername: authStore.user?.username || 'Anonymous',
      senderAvatar: authStore.user?.avatar,
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

  // Lifecycle
  onMounted(() => {
    socket.on('stream:message', (msg: StreamMessage) => messages.value.push(msg))
    socket.on('stream:reaction', (reaction: StreamReaction) => {
        reactions.value.push(reaction)
        setTimeout(() => (reactions.value = reactions.value.filter(r => r.id !== reaction.id)), 3000)
    })
    socket.on('stream:pewgift', (gift: PewGift) => pewGifts.value.push(gift))

    socket.emit('stream:join', { streamId, userId: authStore.userId })
    isConnected.value = true
  })

  onUnmounted(() => {
    socket.emit('stream:leave', { streamId, userId: authStore.userId })
    socket.off('stream:message')
    socket.off('stream:reaction')
    socket.off('stream:pewgift')
  })

  return {
    messages: readonly(messages),
    reactions: readonly(reactions),
    pewGifts: readonly(pewGifts),
    activeUsers,
    sendMessage,
    sendReaction,
    sendPewGift
  }
}

// ... (useEnhancedStreaming and useAdaptiveStreaming remain largely the same, 
// ensuring you swap any internal 'user' references to 'authStore') ...
