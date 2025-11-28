// ============================================================================
// composables/use-chat.ts - ENHANCED WITH SOCKET.IO (GUN REMOVED)
// ============================================================================
// ✅ FIXED: Removed direct Gun import that causes "Cannot set property state" error
// Gun will be handled separately through plugins only

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
  const lastSyncTime = ref<number>(0)

  // ✅ REMOVED: initializeGunDB function (causes History error)
  // Gun is now disabled and handled only through plugins

  // ===== INITIALIZE SOCKET.IO =====
  const initializeSocket = async () => {
    try {
      const user = authStore.user
      if (!user) {
        console.warn('[Chat] No authenticated user')
        return null
      }

      const socketUrl = process.client
        ? window.location.origin
        : 'http://localhost:3000'

      socket = io(socketUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling'],
        auth: {
          userId: user.id,
          username: user.username,
          token: authStore.token
        }
      })

      // Connection events
      socket.on('connect', () => {
        console.log('[Chat] Socket connected:', socket?.id)
        chatStore.setConnected(true)
        isOnline.value = true
        
        // Sync offline messages when reconnected
        syncOfflineMessages()
      })

      socket.on('disconnect', (reason) => {
        console.log('[Chat] Socket disconnected:', reason)
        chatStore.setConnected(false)
        isOnline.value = false
      })

      socket.on('connect_error', (error) => {
        console.error('[Chat] Socket connection error:', error)
        chatStore.setConnected(false)
      })

      // Message events
      socket.on('message:new', (message: ChatMessage) => {
        console.log('[Chat] New message received:', message)
        chatStore.addMessage(message)
        
        // ✅ REMOVED: Gun storage (Gun is disabled)
        // Messages are stored in Supabase instead
      })

      socket.on('message:updated', (message: ChatMessage) => {
        console.log('[Chat] Message updated:', message)
        chatStore.updateMessage(message)
        // ✅ REMOVED: Gun storage
      })

      socket.on('message:deleted', (messageId: string) => {
        console.log('[Chat] Message deleted:', messageId)
        chatStore.deleteMessage(messageId)
        // ✅ REMOVED: Gun storage
      })

      socket.on('typing', (data: { userId: string; chatId: string }) => {
        chatStore.setUserTyping(data.userId, data.chatId, true)
      })

      socket.on('typing:stop', (data: { userId: string; chatId: string }) => {
        chatStore.setUserTyping(data.userId, data.chatId, false)
      })

      console.log('[Chat] Socket.IO initialized')
      return socket
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('[Chat] Failed to initialize Socket.IO:', err.message)
      return null
    }
  }

  // ===== SYNC OFFLINE MESSAGES =====
  const syncOfflineMessages = async () => {
    try {
      isSyncing.value = true
      const offlineMessages = chatStore.getOfflineMessages()
      
      if (offlineMessages.length === 0) {
        isSyncing.value = false
        return
      }

      console.log(`[Chat] Syncing ${offlineMessages.length} offline messages`)

      for (const message of offlineMessages) {
        if (socket && socket.connected) {
          socket.emit('message:send', message, (ack: any) => {
            if (ack.success) {
              chatStore.removeOfflineMessage(message.id)
            }
          })
        }
      }

      lastSyncTime.value = Date.now()
      isSyncing.value = false
      console.log('[Chat] Offline messages synced')
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('[Chat] Failed to sync offline messages:', err.message)
      isSyncing.value = false
    }
  }

  // ===== SEND MESSAGE =====
  const sendMessage = async (chatId: string, content: string, messageType: string = 'text') => {
    try {
      if (!socket || !socket.connected) {
        console.warn('[Chat] Socket not connected, storing offline')
        chatStore.addOfflineMessage({
          id: `offline-${Date.now()}`,
          chatId,
          senderId: authStore.user?.id || '',
          senderName: authStore.user?.username || 'Unknown',
          content,
          timestamp: new Date().toISOString(),
          isEdited: false,
          isDeleted: false,
          messageType: messageType as any
        })
        return
      }

      const message: ChatMessage = {
        id: `msg-${Date.now()}`,
        chatId,
        senderId: authStore.user?.id || '',
        senderName: authStore.user?.username || 'Unknown',
        content,
        timestamp: new Date().toISOString(),
        isEdited: false,
        isDeleted: false,
        messageType: messageType as any
      }

      socket.emit('message:send', message, (ack: any) => {
        if (ack.success) {
          console.log('[Chat] Message sent successfully')
          chatStore.addMessage(ack.message)
        } else {
          console.error('[Chat] Failed to send message:', ack.error)
          chatStore.addOfflineMessage(message)
        }
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('[Chat] Error sending message:', err.message)
    }
  }

  // ===== EDIT MESSAGE =====
  const editMessage = async (chatId: string, messageId: string, content: string) => {
    try {
      if (!socket || !socket.connected) {
        console.warn('[Chat] Socket not connected')
        return
      }

      socket.emit('message:edit', { chatId, messageId, content }, (ack: any) => {
        if (ack.success) {
          console.log('[Chat] Message edited successfully')
          chatStore.updateMessage(ack.message)
        } else {
          console.error('[Chat] Failed to edit message:', ack.error)
        }
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('[Chat] Error editing message:', err.message)
    }
  }

  // ===== DELETE MESSAGE =====
  const deleteMessage = async (chatId: string, messageId: string) => {
    try {
      if (!socket || !socket.connected) {
        console.warn('[Chat] Socket not connected')
        return
      }

      socket.emit('message:delete', { chatId, messageId }, (ack: any) => {
        if (ack.success) {
          console.log('[Chat] Message deleted successfully')
          chatStore.deleteMessage(messageId)
        } else {
          console.error('[Chat] Failed to delete message:', ack.error)
        }
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('[Chat] Error deleting message:', err.message)
    }
  }

  // ===== TYPING INDICATOR =====
  const sendTypingIndicator = (chatId: string) => {
    try {
      if (socket && socket.connected) {
        socket.emit('typing', { chatId })
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('[Chat] Error sending typing indicator:', err.message)
    }
  }

  const stopTypingIndicator = (chatId: string) => {
    try {
      if (socket && socket.connected) {
        socket.emit('typing:stop', { chatId })
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('[Chat] Error stopping typing indicator:', err.message)
    }
  }

  // ===== CLEANUP =====
  const cleanup = () => {
    if (socket) {
      console.log('[Chat] Cleaning up socket connection')
      socket.disconnect()
      socket = null
    }
  }

  // ===== LIFECYCLE =====
  onMounted(async () => {
    console.log('[Chat] Composable mounted, initializing Socket.IO')
    await initializeSocket()
  })

  onUnmounted(() => {
    console.log('[Chat] Composable unmounted, cleaning up')
    cleanup()
  })

  return {
    // State
    isOnline,
    isSyncing,
    lastSyncTime,
    
    // Methods
    initializeSocket,
    sendMessage,
    editMessage,
    deleteMessage,
    sendTypingIndicator,
    stopTypingIndicator,
    syncOfflineMessages,
    cleanup
  }
}
