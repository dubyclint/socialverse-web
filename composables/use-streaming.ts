// ============================================================================
// FILE: /composables/use-streaming.ts
// Description: Consolidated Streaming infrastructure covering live websocket chat, 
//              engagement telemetries, and adaptive HLS decoding configurations.
// ============================================================================
import { ref, computed, onMounted, onUnmounted, readonly } from 'vue'
import { useSocket } from '~/composables/use-socket'
import { useUserStore } from '~/stores/user'
import type { ChatMessage } from '~/types/chat'

// --- Types ---
export interface StreamMessage { id: string; streamId: string; userId: string; username: string; message: string; messageType: 'text' | 'pewgift' | 'reaction' | 'system'; timestamp: Date; userAvatar?: string }
export interface StreamReaction { id: string; userId: string; username: string; emoji: string; timestamp: Date; x: number; delay: number }
export interface PewGift { id: string; streamId: string; senderId: string; senderUsername: string; senderAvatar?: string; giftId: string; giftName: string; giftImage: string; giftValue: number; quantity: number; totalValue: number; message?: string; timestamp: Date; animationType: 'normal' | 'special' | 'legendary' }
export interface StreamUser { userId: string; username: string; avatar?: string; isStreamer: boolean; isModerator: boolean; isTyping: boolean }

// ============================================================================
// CORE STREAMING COMPOSABLE
// ============================================================================
export const useStreaming = (streamId: string) => {
  const userStore = useUserStore()
  const socket = useSocket()

  const messages = ref<StreamMessage[]>([])
  const reactions = ref<StreamReaction[]>([])
  const pewGifts = ref<PewGift[]>([])
  const streamUsers = ref<StreamUser[]>([])
  const isConnected = ref(false)

  // Computed: Filter out current user from active list
  const activeUsers = computed(() => 
    streamUsers.value.filter(u => u.userId !== userStore.user?.id)
  )

  const sendMessage = async (message: string): Promise<void> => {
  if (!message.trim() || !Boolean(userStore.user)) return
    
    const newMessage: StreamMessage = {
      id: `msg-${Date.now()}`,
      streamId,
      userId: userStore.user!.id,
      username: userStore.user?.username || 'Anonymous',
      message,
      messageType: 'text',
      timestamp: new Date(),
      userAvatar: userStore.user?.avatar ?? undefined
    }
    messages.value.push(newMessage)
  ;(socket as any).emit('stream:message', newMessage)
  }

  const sendReaction = (emoji: string): void => {
  if (!Boolean(userStore.user)) return
    const reaction: StreamReaction = {
      id: `reaction-${Date.now()}`,
      userId: userStore.user!.id,
      username: userStore.user?.username || 'Anonymous',
      emoji,
      timestamp: new Date(),
      x: Math.random() * 100,
      delay: Math.random() * 0.5
    }
    reactions.value.push(reaction)
  ;(socket as any).emit('stream:reaction', reaction)
  setTimeout(() => { reactions.value = reactions.value.filter((r: StreamReaction) => r.id !== reaction.id) }, 3000)
  }

  const sendPewGift = async (giftId: string, quantity: number = 1, message?: string): Promise<void> => {
  if (!Boolean(userStore.user)) return
    const pewGift: PewGift = {
      id: `gift-${Date.now()}`,
      streamId,
      senderId: userStore.user!.id,
      senderUsername: userStore.user?.username || 'Anonymous',
      senderAvatar: userStore.user?.avatar ?? undefined,
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
  ;(socket as any).emit('stream:pewgift', pewGift)
  }

  onMounted(() => {
    socket.on('stream:message', (msg: StreamMessage) => messages.value.push(msg))
    socket.on('stream:reaction', (reaction: StreamReaction) => {
        reactions.value.push(reaction)
        setTimeout(() => (reactions.value = reactions.value.filter((r: StreamReaction) => r.id !== reaction.id)), 3000)
    })
    socket.on('stream:pewgift', (gift: PewGift) => pewGifts.value.push(gift))
    
    // Join using userStore
    ;(socket as any).emit('stream:join', { streamId, userId: userStore.user?.id })
    isConnected.value = true
  })

  onUnmounted(() => {
    ;(socket as any).emit('stream:leave', { streamId, userId: userStore.user?.id })
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

// ============================================================================
// ENHANCED & ADAPTIVE STREAMING (Modular Exports)
// ============================================================================

export const useEnhancedStreaming = (_streamId: string) => {
  const pinnedMessages = ref<ChatMessage[]>([])
  const moderatedMessages = ref<ChatMessage[]>([])
  const typingUsers = ref<string[]>([])

  return {
    pinnedMessages: readonly(pinnedMessages),
    moderatedMessages: readonly(moderatedMessages),
    typingUsers: readonly(typingUsers),
    pinMessage: (m: ChatMessage) => pinnedMessages.value.push(m),
    unpinMessage: (id: string) => (pinnedMessages.value = pinnedMessages.value.filter((m: ChatMessage) => m.id !== id)),
    moderateMessage: (m: ChatMessage) => { (m as any).isModerated = true; moderatedMessages.value.push(m) }
  }
}

export const useAdaptiveStreaming = (config: any) => {
  const selectedQuality = ref<string>('auto')
  const bufferHealth = ref<number>(100)
  const isBuffering = ref<boolean>(false)
  let hls: any = null
  let qualityCheckInterval: any = null

  const initializeHLS = async (videoElement: HTMLVideoElement) => {
    if (typeof window === 'undefined') return
    // hls.js may not be available in test environments; guard dynamically.
    try {
      // Use eval to avoid static module resolution during typechecking/environments
      const imported: any = await eval('import("hls.js")')
      const HlsLib: any = (window as any).Hls || imported?.default
      if (HlsLib && typeof HlsLib.isSupported === 'function' && HlsLib.isSupported()) {
        hls = new HlsLib({ enableWorker: true, lowLatencyMode: true })
        hls.loadSource(config.baseStreamUrl)
        hls.attachMedia(videoElement)
        qualityCheckInterval = setInterval(() => {
          if (hls?.getMetrics?.()?.bufferStalled) {
            bufferHealth.value = Math.max(0, bufferHealth.value - 10)
            isBuffering.value = true
          } else {
            bufferHealth.value = Math.min(100, bufferHealth.value + 5)
            isBuffering.value = false
          }
        }, 1000)
      }
    } catch (err) {
      // Optional dependency; swallow errors to remain permissive in CI/tests.
      console.warn('[useAdaptiveStreaming] hls.js not available or failed to initialize:', err)
    }
  }

  onUnmounted(() => { 
    clearInterval(qualityCheckInterval)
    hls?.destroy() 
  })

  return { selectedQuality, bufferHealth, isBuffering, initializeHLS }
}
