// composables/use-chat.ts
import { computed } from 'vue'
import { useSocket } from '~/composables/use-socket'

interface ChatMessagePayload {
  content: string
  recipientId?: string
  timestamp?: number
}

// Realtime chat glue over the Socket.IO orchestrator (`useSocket`).
export const useChat = () => {
  const socket = useSocket()

  const initialize = async () => {
    await socket.connect()
  }

  const sendMessage = (chatId: string, payload: ChatMessagePayload) => {
    socket.emit('chat:message', { chatId, ...payload })
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

  return { initialize, sendMessage, editMessage, deleteMessage, disconnect }
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

  // 2. Updated Auth Headers
  const getAuthHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const userStore = getActiveUserStoreSync()
    
    // Access token from unified store
    const token = userStore?.token 

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

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
