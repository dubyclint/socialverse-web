// ============================================================================
// FILE: /composables/use-chat.ts
// Description: Chat Composable - Handles Socket.IO client instances and message 
//              state syncing with lazy store loading to bypass circular locks.
// ============================================================================
import { ref, onMounted, onUnmounted } from 'vue'
import { useRuntimeConfig } from '#app'
import { io, type Socket } from 'socket.io-client'

interface ChatMessage {
  id: string
  chatId: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
  isEdited: boolean
  isDeleted: boolean
  messageType: 'text' | 'image' | 'file' | 'system'
}

export const useChat = () => {
  let socket: Socket | null = null
  
  const isOnline = ref(true)
  const isSyncing = ref(false)
  const lastSyncTime = ref<number | null>(null)
  const connectionError = ref<string | null>(null)

  // ============================================================================
  // LAZY STORE RESOLVERS (Breaks the module-level circular dependency graph)
  // ============================================================================
  const getAuthStore = async () => {
    const { useAuthStore } = await import('~/stores/auth')
    return useAuthStore()
  }

  const getChatStore = async () => {
    const { useChatStore } = await import('~/stores/chat')
    return useChatStore()
  }

  // ============================================================================
  // CORE TIMELINE & ACTION METHODS
  // ============================================================================

  /**
   * Initialize Socket.IO with dynamic client context configurations
   */
  const initializeSocket = async () => {
    try {
      // Guard against execution environments missing standard client windows (SSR Safety)
      if (!process.client) return

      const authStore = await getAuthStore()
      const chatStore = await getChatStore()
      
      // Check if user is authenticated
      if (!authStore.isAuthenticated || !authStore.token) {
        console.warn('[Chat] ⚠️ User not authenticated - skipping socket connection')
        connectionError.value = 'User not authenticated'
        return
      }

      console.log('[Chat] Composable execution layer, initializing Socket.IO')
      
      const config = useRuntimeConfig()
      const socketUrl = (config.public?.socketUrl as string) || window.location.origin
      
      // Initialize socket with authentication token profiles
      socket = io(socketUrl, {
        auth: {
          token: authStore.token,
          userId: authStore.userId
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      })

      console.log('[Chat] Socket.IO connection instance initialized')

      // Handle connection events cleanly
      socket.on('connect', () => {
        console.log('[Chat] ✅ Socket connection verified')
        isOnline.value = true
        connectionError.value = null
      })

      socket.on('disconnect', () => {
        console.log('[Chat] ⚠️ Socket disconnected from endpoint target')
        isOnline.value = false
      })

      socket.on('error', (error: any) => {
        console.error('[Chat] Socket pipeline failure:', error)
        connectionError.value = error?.message || 'Socket connection error'
      })

      socket.on('message', (message: ChatMessage) => {
        console.log('[Chat] Received message:', message)
        chatStore.addMessage(message)
      })

      socket.on('typing', (data: any) => {
        console.log('[Chat] User typing update:', data)
        chatStore.setTypingUser(data.userId, data.isTyping)
      })

    } catch (error) {
      console.error('[Chat] ❌ Error initializing socket:', error)
      connectionError.value = error instanceof Error ? error.message : 'Failed to initialize socket'
    }
  }

  /**
   * Send a message through the socket channel instance
   */
  const sendMessage = async (chatId: string, content: string): Promise<boolean> => {
    try {
      if (!socket || !socket.connected) {
        console.warn('[Chat] ⚠️ Socket not connected')
        connectionError.value = 'Socket not connected'
        return false
      }

      const authStore = await getAuthStore()

      socket.emit('message', {
        chatId,
        content,
        senderId: authStore.userId,
        timestamp: new Date().toISOString()
      })

      console.log('[Chat] ✅ Message emitted successfully')
      return true
    } catch (error) {
      console.error('[Chat] ❌ Error sending message payload:', error)
      connectionError.value = error instanceof Error ? error.message : 'Failed to send message'
      return false
    }
  }

  /**
   * Emit typing indicator metrics across real-time instances
   */
  const setTyping = async (chatId: string, isTyping: boolean): Promise<void> => {
    try {
      if (!socket || !socket.connected) return

      const authStore = await getAuthStore()

      socket.emit('typing', {
        chatId,
        userId: authStore.userId,
        isTyping
      })
    } catch (error) {
      console.error('[Chat] ❌ Error setting typing state:', error)
    }
  }

  /**
   * Cleanup socket connections and close open streams safely
   */
  const cleanup = () => {
    try {
      console.log('[Chat] Composable unmounting, cleaning up resource handlers')
      
      if (socket) {
        console.log('[Chat] Cleaning up socket connection channel')
        socket.disconnect()
        socket = null
      }
    } catch (error) {
      console.error('[Chat] ❌ Error during cleanup sequence:', error)
    }
  }

  // ============================================================================
  // LIFECYCLE HOOKS
  // ============================================================================
  onMounted(() => {
    initializeSocket()
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    isOnline,
    isSyncing,
    lastSyncTime,
    connectionError,
    sendMessage,
    setTyping,
    initializeSocket,
    cleanup
  }
}
