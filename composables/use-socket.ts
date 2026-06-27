// ============================================================================
// FILE: /composables/use-socket.ts
// Description: Socket.IO interface orchestrator mapping client signals to runtime plug.
// ============================================================================
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useNuxtApp } from '#app'

export const useSocket = () => {
  // State initialization 
  const isConnected = ref(false)
  const isAuthenticated = ref(false)
  const connectionError = ref<string | null>(null)
  const activeChats = ref<Set<string>>(new Set())
  const activeStreams = ref<Set<string>>(new Set())

  // Safe lazy lookup container for the injected global socket plugin instance
  const getSocketInstance = () => {
    try {
      const nuxtApp = useNuxtApp()
      const socket = nuxtApp.$socket
      if (!socket) {
        throw new Error('Socket core instance missing from nuxt application context layer.')
      }
      return socket
    } catch (err: any) {
      console.warn('[useSocket] Runtime context exception during plugin lookup:', err.message)
      return null
    }
  }

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  /**
   * Initialize and connect to Socket.IO server
   */
  const connect = async () => {
    try {
      console.log('[useSocket] Connecting to Socket.IO server...')
      const socket = getSocketInstance()
      if (!socket) return

      const result = await socket.connect()
      
      if (result) {
        isConnected.value = true
        isAuthenticated.value = true
        connectionError.value = null
        console.log('[useSocket] ✅ Connected successfully')
      } else {
        connectionError.value = 'Failed to connect'
        console.error('[useSocket] ❌ Connection failed')
      }
    } catch (err: any) {
      connectionError.value = err.message
      console.error('[useSocket] ❌ Connection error:', err.message)
    }
  }

  /**
   * Disconnect from Socket.IO server
   */
  const disconnect = async () => {
    try {
      const socket = getSocketInstance()
      if (!socket) return

      await socket.disconnect()
      isConnected.value = false
      isAuthenticated.value = false
      activeChats.value.clear()
      activeStreams.value.clear()
      console.log('[useSocket] ✅ Disconnected')
    } catch (err: any) {
      console.error('[useSocket] ❌ Disconnect error:', err.message)
    }
  }

  /**
   * Check connection status
   */
  const checkConnection = () => {
    const socket = getSocketInstance()
    if (!socket) return

    const state = socket.getState()
    isConnected.value = state.connected
    isAuthenticated.value = state.authenticated
    connectionError.value = state.error || null
  }

  // ============================================================================
  // CHAT MANAGEMENT
  // ============================================================================

  /**
   * Join a chat room
   */
  const joinChat = (chatId: string) => {
    try {
      const socket = getSocketInstance()
      if (!socket) return
      
      socket.joinChat(chatId)
      activeChats.value.add(chatId)
      console.log('[useSocket] Joined chat:', chatId)
    } catch (err: any) {
      console.error('[useSocket] Error joining chat:', err.message)
    }
  }

  /**
   * Leave a chat room
   */
  const leaveChat = (chatId: string) => {
    try {
      const socket = getSocketInstance()
      if (!socket) return

      socket.leaveChat(chatId)
      activeChats.value.delete(chatId)
      console.log('[useSocket] Left chat:', chatId)
    } catch (err: any) {
      console.error('[useSocket] Error leaving chat:', err.message)
    }
  }

  /**
   * Send a chat message
   */
  const sendMessage = (chatId: string, message: string) => {
    try {
      const socket = getSocketInstance()
      if (!socket) return

      socket.sendMessage(chatId, message)
      console.log('[useSocket] Message sent to chat:', chatId)
    } catch (err: any) {
      console.error('[useSocket] Error sending message:', err.message)
    }
  }

  /**
   * Send typing indicator
   */
  const sendTyping = (chatId: string) => {
    try {
      const socket = getSocketInstance()
      if (!socket) return
      socket.sendTyping(chatId)
    } catch (err: any) {
      console.error('[useSocket] Error sending typing indicator:', err.message)
    }
  }

  // ============================================================================
  // PRESENCE MANAGEMENT
  // ============================================================================

  /**
   * Update user presence status
   */
  const updatePresence = (status: 'online' | 'away' | 'offline' | 'dnd', activity?: string) => {
    try {
      const socket = getSocketInstance()
      if (!socket) return

      socket.updatePresence(status, activity)
      console.log('[useSocket] Presence updated:', status)
    } catch (err: any) {
      console.error('[useSocket] Error updating presence:', err.message)
    }
  }

  // ============================================================================
  // NOTIFICATION MANAGEMENT
  // ============================================================================

  /**
   * Subscribe to notification types
   */
  const subscribeNotifications = (types: string[]) => {
    try {
      const socket = getSocketInstance()
      if (!socket) return

      socket.subscribeNotifications(types)
      console.log('[useSocket] Subscribed to notifications:', types)
    } catch (err: any) {
      console.error('[useSocket] Error subscribing to notifications:', err.message)
    }
  }

  /**
   * Unsubscribe from notification types
   */
  const unsubscribeNotifications = (types: string[]) => {
    try {
      const socket = getSocketInstance()
      if (!socket) return

      socket.unsubscribeNotifications(types)
      console.log('[useSocket] Unsubscribed from notifications:', types)
    } catch (err: any) {
      console.error('[useSocket] Error unsubscribing from notifications:', err.message)
    }
  }

  // ============================================================================
  // STREAM MANAGEMENT
  // ============================================================================

  /**
   * Start a live stream
   */
  const startStream = (streamId: string, title: string) => {
    try {
      const socket = getSocketInstance()
      if (!socket) return

      socket.startStream(streamId, title)
      activeStreams.value.add(streamId)
      console.log('[useSocket] Stream started:', streamId)
    } catch (err: any) {
      console.error('[useSocket] Error starting stream:', err.message)
    }
  }

  /**
   * End a live stream
   */
  const endStream = (streamId: string) => {
    try {
      const socket = getSocketInstance()
      if (!socket) return

      socket.endStream(streamId)
      activeStreams.value.delete(streamId)
      console.log('[useSocket] Stream ended:', streamId)
    } catch (err: any) {
      console.error('[useSocket] Error ending stream:', err.message)
    }
  }

  /**
   * Join a live stream
   */
  const joinStream = (streamId: string) => {
    try {
      const socket = getSocketInstance()
      if (!socket) return

      socket.joinStream(streamId)
      console.log('[useSocket] Joined stream:', streamId)
    } catch (err: any) {
      console.error('[useSocket] Error joining stream:', err.message)
    }
  }

  /**
   * Leave a live stream
   */
  const leaveStream = (streamId: string) => {
    try {
      const socket = getSocketInstance()
      if (!socket) return

      socket.leaveStream(streamId)
      console.log('[useSocket] Left stream:', streamId)
    } catch (err: any) {
      console.error('[useSocket] Error leaving stream:', err.message)
    }
  }

  // ============================================================================
  // CALL MANAGEMENT (WebRTC)
  // ============================================================================

  /**
   * Initiate a call
   */
  const initiateCall = (targetUserId: string, offer: any) => {
    try {
      const socket = getSocketInstance()
      if (!socket) return

      socket.initiateCall(targetUserId, offer)
      console.log('[useSocket] Call initiated to:', targetUserId)
    } catch (err: any) {
      console.error('[useSocket] Error initiating call:', err.message)
    }
  }

  /**
   * Answer a call
   */
  const answerCall = (targetUserId: string, answer: any) => {
    try {
      const socket = getSocketInstance()
      if (!socket) return

      socket.answerCall(targetUserId, answer)
      console.log('[useSocket] Call answered')
    } catch (err: any) {
      console.error('[useSocket] Error answering call:', err.message)
    }
  }

  /**
   * Send ICE candidate
   */
  const sendIceCandidate = (targetUserId: string, candidate: any) => {
    try {
      const socket = getSocketInstance()
      if (!socket) return
      socket.sendIceCandidate(targetUserId, candidate)
    } catch (err: any) {
      console.error('[useSocket] Error sending ICE candidate:', err.message)
    }
  }

  /**
   * End a call
   */
  const endCall = (targetUserId: string) => {
    try {
      const socket = getSocketInstance()
      if (!socket) return

      socket.endCall(targetUserId)
      console.log('[useSocket] Call ended')
    } catch (err: any) {
      console.error('[useSocket] Error ending call:', err.message)
    }
  }

  // ============================================================================
  // EVENT LISTENERS
  // ============================================================================

  /**
   * Listen to socket events
   */
  const on = (event: string, callback: (data: any) => void) => {
    const socket = getSocketInstance()
    if (socket) socket.on(event, callback)
  }

  /**
   * Remove event listener
   */
  const off = (event: string, callback?: (data: any) => void) => {
    const socket = getSocketInstance()
    if (socket) socket.off(event, callback)
  }

  /**
   * Listen to custom window events
   */
  const onCustomEvent = (eventName: string, callback: (event: CustomEvent) => void) => {
    if (typeof window !== 'undefined') {
      window.addEventListener(eventName, callback as EventListener)
    }
  }

  /**
   * Remove custom window event listener
   */
  const offCustomEvent = (eventName: string, callback: (event: CustomEvent) => void) => {
    if (typeof window !== 'undefined') {
      window.removeEventListener(eventName, callback as EventListener)
    }
  }

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  onMounted(() => {
    if (process.client) {
      console.log('[useSocket] Composable mounted client-side')
      checkConnection()
    }
  })

  onUnmounted(() => {
    console.log('[useSocket] Composable unmounted')
  })

  // ============================================================================
  // COMPUTED PROPERTIES
  // ============================================================================

  const isReady = computed(() => isConnected.value && isAuthenticated.value)
  const hasError = computed(() => connectionError.value !== null)
  const activeChatCount = computed(() => activeChats.value.size)
  const activeStreamCount = computed(() => activeStreams.value.size)

  return {
    // State
    isConnected,
    isAuthenticated,
    connectionError,
    activeChats,
    activeStreams,

    // Computed
    isReady,
    hasError,
    activeChatCount,
    activeStreamCount,

    // Connection
    connect,
    disconnect,
    checkConnection,

    // Chat
    joinChat,
    leaveChat,
    sendMessage,
    sendTyping,

    // Presence
    updatePresence,

    // Notifications
    subscribeNotifications,
    unsubscribeNotifications,

    // Streams
    startStream,
    endStream,
    joinStream,
    leaveStream,

    // Calls
    initiateCall,
    answerCall,
    sendIceCandidate,
    endCall,

    // Events
    on,
    off,
    onCustomEvent,
    offCustomEvent
  }
}
