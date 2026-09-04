// composables/use-chat.ts
import { computed } from 'vue'
import { useSocket } from '~/composables/use-socket'

interface ChatMessagePayload {
  content: string
  recipientId?: string
  tempId?: string
  timestamp?: number
}

export interface IncomingChatMessage {
  id: string
  chatId: string
  content: string
  senderId: string
  senderName?: string
  senderAvatar?: string
  timestamp: string
  tempId?: string
}

export interface ChatSendAck {
  success: boolean
  id?: string
  tempId?: string
  timestamp?: string
  error?: string
}

export interface ChatReceipt {
  chatId: string
  userId: string
  at: string
}

export interface ChatTypingEvent {
  chatId: string
  userId: string
}

// Realtime chat glue over the Socket.IO orchestrator (`useSocket`).
export const useChat = () => {
  const socket = useSocket()

  const initialize = async () => {
    await socket.connect()
  }

  /**
   * Resolves with the server's acknowledgement so the optimistic bubble can
   * flip from "sending" to "sent" (or "failed").
   */
  const sendMessage = (chatId: string, payload: ChatMessagePayload): Promise<ChatSendAck> =>
    new Promise((resolve) => {
      let settled = false
      const done = (ack: ChatSendAck) => {
        if (settled) return
        settled = true
        resolve(ack)
      }

      const timer = setTimeout(
        () => done({ success: false, tempId: payload.tempId, error: 'Timed out' }),
        15000
      )

      socket.emit('chat:message', { chatId, ...payload }, (ack: ChatSendAck) => {
        clearTimeout(timer)
        done(ack || { success: false, tempId: payload.tempId, error: 'No acknowledgement' })
      })
    })

  const joinChat = (chatId: string) => {
    socket.emit('chat:join', { chatId })
  }

  const leaveChat = (chatId: string) => {
    socket.emit('chat:leave', { chatId })
  }

  const onMessage = (handler: (message: IncomingChatMessage) => void) => {
    socket.on('chat:message', handler)
  }

  const onTyping = (handler: (event: ChatTypingEvent, isTyping: boolean) => void) => {
    socket.on('chat:typing', (event: ChatTypingEvent) => handler(event, true))
    socket.on('chat:stop-typing', (event: ChatTypingEvent) => handler(event, false))
  }

  const onReceipt = (handler: (receipt: ChatReceipt, kind: 'delivered' | 'read') => void) => {
    socket.on('chat:delivered', (receipt: ChatReceipt) => handler(receipt, 'delivered'))
    socket.on('chat:read', (receipt: ChatReceipt) => handler(receipt, 'read'))
  }

  const sendTyping = (chatId: string, isTyping: boolean) => {
    socket.emit('chat:typing', { chatId, isTyping })
  }

  const markDelivered = (chatId: string) => {
    socket.emit('chat:delivered', { chatId })
  }

  const markRead = (chatId: string) => {
    socket.emit('chat:read', { chatId })
  }

  const editMessage = (chatId: string, messageId: string, content: string) => {
    socket.emit('chat:edit', { chatId, messageId, content })
  }

  const deleteMessage = (chatId: string, messageId: string) => {
    socket.emit('chat:delete', { chatId, messageId })
  }

  const disconnect = () => {
    void socket.disconnect()
  }

  return {
    isConnected: socket.isConnected,
    initialize,
    joinChat,
    leaveChat,
    onMessage,
    onTyping,
    onReceipt,
    sendTyping,
    markDelivered,
    markRead,
    sendMessage,
    editMessage,
    deleteMessage,
    disconnect
  }
}

export const useChatApi = () => { // Renamed from useApi
  // 1. Unified Store Resolver
  let _cachedUserStore: any = null

  const getUserStore = async () => {
    if (_cachedUserStore) return _cachedUserStore
    // Import the unified store
    const { useUserStore } = await import('~/stores/user')
    _cachedUserStore = useUserStore()
    return _cachedUserStore
  }

  // Helper for synchronous checks
  const getActiveUserStoreSync = () => _cachedUserStore

  // 2. Request headers. Same-origin `/api/*` calls carry the Supabase SSR cookie,
  // so no Authorization header is needed.
  const getAuthHeaders = (): Record<string, string> => ({
    'Content-Type': 'application/json'
  })

  // 3. Updated User ID Retrieval
  const getUserId = (): string | null => {
    const userStore = getActiveUserStoreSync()
    return userStore?.userId || null
  }

  // 4. Mapped State Objects
  // Using computed properties to ensure reactivity when the store is initialized
  const profile = computed(() => getActiveUserStoreSync()?.profile || null)
  const posts = computed(() => getActiveUserStoreSync()?.posts || [])
  const notifications = computed(() => getActiveUserStoreSync()?.notifications || [])

  return { 
    profile, 
    posts, 
    notifications, 
    getUserId, 
    getAuthHeaders, 
    getUserStore 
  }
}
