// FILE: /composables/use-socket.ts
// ============================================================================
// SOCKET.IO COMPOSABLE - PRODUCTION READY
// ============================================================================
// Provides easy-to-use composable for Socket.IO functionality
// Integrates with Nuxt 3 and provides reactive state management
// ============================================================================

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useNuxtApp } from '#app'

export const useSocket = () => {
  const nuxtApp = useNuxtApp()
  const socket = nuxtApp.$socket

  // State
  const isConnected = ref(false)
  const isAuthenticated = ref(false)
  const connectionError = ref<string | null>(null)
  const activeChats = ref<Set<string>>(new Set())
  const activeStreams = ref<Set<string>>(new Set())

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  /**
   * Initialize and connect to Socket.IO server
   */
  const connect = () => {
    try {
      console.log('[useSocket] Connecting to Socket.IO server...')
      socket.connect()
      // Note: connect() is typically fire-and-forget; use events for status
    } catch (err: any) {
      connectionError.value = err.message
      console.error('[useSocket] ❌ Connection error:', err.message)
    }
  }

  /**
   * Disconnect from Socket.IO server
   */
  const disconnect = () => {
    try {
      socket.disconnect()
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
   * Check connection status (if your socket plugin supports getState)
   */
  const checkConnection = () => {
    // Only use this if you've added getState() in your plugin
    // Otherwise, use socket.connected directly
    if (typeof socket.getState === 'function') {
      const state = socket.getState()
      isConnected.value = state.connected
      isAuthenticated.value = state.authenticated
      connectionError.value = state.error || null
    } else {
      isConnected.value = socket.connected
      // isAuthenticated would need to be tracked separately
    }
  }

  // ============================================================================
  // CHAT MANAGEMENT
  // ============================================================================

  const joinChat = (chatId: string) => {
    try {
      socket.joinChat(chatId)
      activeChats.value.add(chatId)
      console.log('[useSocket] Joined chat:', chatId)
    } catch (err: any) {
      console.error('[useSocket] Error joining chat:', err.message)
    }
  }

  const leaveChat = (chatId: string) => {
    try {
      socket.leaveChat(chatId)
      activeChats.value.delete(chatId)
      console.log('[useSocket] Left chat:', chatId)
    } catch (err: any) {
      console.error('[useSocket] Error leaving chat:', err.message)
    }
  }

  const sendMessage = (chatId: string, message: string) => {
    try {
      socket.sendMessage(chatId, message)
      console.log('[useSocket] Message sent to chat:', chatId)
    } catch (err: any) {
      console.error('[useSocket] Error sending message:', err.message)
    }
  }

  const sendTyping = (chatId: string) => {
    try {
      socket.sendTyping(chatId)
    } catch (err: any) {
      console.error('[useSocket] Error sending typing indicator:', err.message)
    }
  }

  // ============================================================================
  // PRESENCE MANAGEMENT
  // ============================================================================

  const updatePresence = (status: 'online' | 'away' | 'offline' | 'dnd', activity?: string) => {
    try {
      socket.updatePresence(status, activity)
      console.log('[useSocket] Presence updated:', status)
    } catch (err: any) {
      console.error('[useSocket] Error updating presence:', err.message)
    }
  }

  // ============================================================================
  // NOTIFICATION MANAGEMENT
  // ============================================================================

  const subscribeNotifications = (types: string[]) => {
    try {
      socket.subscribeNotifications(types)
      console.log('[useSocket] Subscribed to notifications:', types)
    } catch (err: any) {
      console.error('[useSocket] Error subscribing to notifications:', err.message)
    }
  }

  const unsubscribeNotifications = (types: string[]) => {
    try {
      socket.unsubscribeNotifications(types)
      console.log('[useSocket] Unsubscribed from notifications:', types)
    } catch (err: any) {
      console.error('[useSocket] Error unsubscribing from notifications:', err.message)
    }
  }

  // ============================================================================
  // STREAM MANAGEMENT
  // ============================================================================

  const startStream = (streamId: string, title: string) => {
    try {
      socket.startStream(streamId, title)
      activeStreams.value.add(streamId)
      console.log('[useSocket] Stream started:', streamId)
    } catch (err: any) {
      console.error('[useSocket] Error starting stream:', err.message)
    }
  }

  const endStream = (streamId: string) => {
    try {
      socket.endStream(streamId)
      activeStreams.value.delete(streamId)
      console.log('[useSocket] Stream ended:', streamId)
    } catch (err: any) {
      console.error('[useSocket] Error ending stream:', err.message)
    }
  }

  const joinStream = (streamId: string) => {
    try {
      socket.joinStream(streamId)
      console.log('[useSocket] Joined stream:', streamId)
    } catch (err: any) {
      console.error('[useSocket] Error joining stream:', err.message)
    }
  }

  const leaveStream = (streamId: string) => {
    try {
      socket.leaveStream(streamId)
      console.log('[useSocket] Left stream:', streamId)
    } catch (err: any) {
      console.error('[useSocket] Error leaving stream:', err.message)
    }
  }

  // ============================================================================
  // CALL MANAGEMENT (WebRTC)
  // ============================================================================

  const initiateCall = (targetUserId: string, offer: any) => {
    try {
      socket.initiateCall(targetUserId, offer)
      console.log('[useSocket] Call initiated to:', targetUserId)
    } catch (err: any) {
      console.error('[useSocket] Error initiating call:', err.message)
    }
  }

  const answerCall = (targetUserId: string, answer: any) => {
    try {
      socket.answerCall(targetUserId, answer)
      console.log('[useSocket] Call answered')
    } catch (err: any) {
      console.error('[useSocket] Error answering call:', err.message)
    }
  }

  const sendIceCandidate = (targetUserId: string, candidate: any) => {
    try {
      socket.sendIceCandidate(targetUserId, candidate)
    } catch (err: any) {
      console.error('[useSocket] Error sending ICE candidate:', err.message)
    }
  }

  const endCall = (targetUserId: string) => {
    try {
      socket.endCall(targetUserId)
      console.log('[useSocket] Call ended')
    } catch (err: any) {
      console.error('[useSocket] Error ending call:', err.message)
    }
  }

  // ============================================================================
  // EVENT LISTENERS
  // ============================================================================

  const on = (event: string, callback: (data: any) => void) => {
    socket.on(event, callback)
  }

  const off = (event: string, callback?: (data: any) => void) => {
    socket.off(event, callback)
  }

  const onCustomEvent = (eventName: string, callback: (event: CustomEvent) => void) => {
    window.addEventListener(eventName, callback as EventListener)
  }

  const offCustomEvent = (eventName: string, callback: (event: CustomEvent) => void) => {
    window.removeEventListener(eventName, callback as EventListener)
  }

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  onMounted(() => {
    console.log('[useSocket] Composable mounted')
    checkConnection()
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
