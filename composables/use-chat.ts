// FILE: /composables/use-chat.ts (COMPLETE FIXED VERSION)
// ============================================================================
// CHAT COMPOSABLE - FIXED: Proper Socket.IO initialization and error handling
// ============================================================================
// ✅ CRITICAL FIX: Removed direct Gun import that causes errors
// ✅ Proper Socket.IO connection with authentication
// ✅ Graceful error handling for socket connection failures
// ✅ Proper cleanup on unmount
// ✅ Token validation before socket connection
// ============================================================================

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { io, Socket } from 'socket.io-client'
import { useChatStore } from '~/stores/chat'
import { useAuthStore } from '~/stores/auth'

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
  const chatStore = useChatStore()
  const authStore = useAuthStore()
  
  let socket: Socket | null = null
  
  const isOnline = ref(true)
  const isSyncing = ref(false)
  const lastSyncTime = ref<number | null>(null)
  const connectionError = ref<string | null>(null)

  /**
   * ✅ CRITICAL FIX: Initialize Socket.IO with proper authentication
   */
  const initializeSocket = () => {
    try {
      // ✅ Check if user is authenticated
      if (!authStore.isAuthenticated || !authStore.token) {
        console.warn('[Chat] ⚠️ User not authenticated - skipping socket connection')
        connectionError.value = 'User not authenticated'
        return
      }

      console.log('[Chat] Composable mounted, initializing Socket.IO')
      
      // ✅ Get the socket URL from config
      const config = useRuntimeConfig()
      const socketUrl = config.public.socketUrl || window.location.origin
      
      // ✅ Initialize socket with authentication token
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

      console.log('[Chat] Socket.IO initialized')

      // ✅ Handle connection events
      socket.on('connect', () => {
        console.log('[Chat] ✅ Socket connected')
        isOnline.value = true
        connectionError.value = null
      })

      socket.on('disconnect', () => {
        console.log('[Chat] ⚠️ Socket disconnected')
        isOnline.value = false
      })

      socket.on('error', (error: any) => {
        console.error('[Chat] Socket error:', error)
        connectionError.value = error?.message || 'Socket connection error'
      })

      socket.on('message', (message: ChatMessage) => {
        console.log('[Chat] Received message:', message)
        chatStore.addMessage(message)
      })

      socket.on('typing', (data: any) => {
        console.log('[Chat] User typing:', data)
        chatStore.setTypingUser(data.userId, data.isTyping)
      })

    } catch (error) {
      console.error('[Chat] ❌ Error initializing socket:', error)
      connectionError.value = error instanceof Error ? error.message : 'Failed to initialize socket'
    }
  }

  /**
   * Send a message through the socket
   */
  const sendMessage = (chatId: string, content: string) => {
    try {
      if (!socket || !socket.connected) {
        console.warn('[Chat] ⚠️ Socket not connected')
        connectionError.value = 'Socket not connected'
        return false
      }

      socket.emit('message', {
        chatId,
        content,
        senderId: authStore.userId,
        timestamp: new Date().toISOString()
      })

      console.log('[Chat] ✅ Message sent')
      return true
    } catch (error) {
      console.error('[Chat] ❌ Error sending message:', error)
      connectionError.value = error instanceof Error ? error.message : 'Failed to send message'
      return false
    }
  }

  /**
   * Emit typing indicator
   */
  const setTyping = (chatId: string, isTyping: boolean) => {
    try {
      if (!socket || !socket.connected) {
        return
      }

      socket.emit('typing', {
        chatId,
        userId: authStore.userId,
        isTyping
      })
    } catch (error) {
      console.error('[Chat] ❌ Error setting typing:', error)
    }
  }

  /**
   * Cleanup socket connection
   */
  const cleanup = () => {
    try {
      console.log('[Chat] Composable unmounted, cleaning up')
      
      if (socket) {
        console.log('[Chat] Cleaning up socket connection')
        socket.disconnect()
        socket = null
      }
    } catch (error) {
      console.error('[Chat] ❌ Error during cleanup:', error)
    }
  }

  /**
   * Lifecycle hooks
   */
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
