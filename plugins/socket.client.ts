// FILE: /plugins/socket.client.ts - COMPLETE FIXED VERSION
// ============================================================================
// SOCKET.IO PLUGIN - FIXED VERSION
// ✅ FIXED: Proper error handling and connection management
// ✅ FIXED: Fallback to polling if WebSocket fails
// ✅ FIXED: Better auth token handling
// ============================================================================

import { io, Socket } from 'socket.io-client'

let socketInstance: Socket | null = null
let connectionAttempts = 0
const MAX_CONNECTION_ATTEMPTS = 5

export default defineNuxtPlugin(async (nuxtApp) => {
  console.log('[Socket.IO Plugin] Initializing...')

  return {
    provide: {
      socket: {
        /**
         * Connect to Socket.IO server with proper authentication
         */
        async connect(): Promise<Socket | null> {
          try {
            // If already connected, return existing instance
            if (socketInstance?.connected) {
              console.log('[Socket.IO] Already connected')
              return socketInstance
            }

            console.log('[Socket.IO] 🚀 Connecting to server...')

            // Get auth store
            const authStore = useAuthStore()
            
            // Wait for auth to be ready (max 5 seconds)
            let attempts = 0
            while (!authStore.token && attempts < 50) {
              await new Promise(resolve => setTimeout(resolve, 100))
              attempts++
            }

            if (!authStore.token) {
              console.warn('[Socket.IO] ⚠️ No auth token available, skipping connection')
              return null
            }

            console.log('[Socket.IO] ✅ Auth token available, connecting...')

            // Get runtime config for socket URL
            const config = useRuntimeConfig()
            const socketUrl = config.public.socketUrl || window.location.origin

            console.log('[Socket.IO] Connecting to:', socketUrl)

            // ✅ FIXED: Create Socket.IO connection with proper configuration
            socketInstance = io(socketUrl, {
              auth: {
                token: authStore.token,
                userId: authStore.userId
              },
              reconnection: true,
              reconnectionDelay: 1000,
              reconnectionDelayMax: 5000,
              reconnectionAttempts: MAX_CONNECTION_ATTEMPTS,
              transports: ['websocket', 'polling'],  // ✅ Fallback to polling
              path: '/socket.io/',  // ✅ Correct path
              secure: window.location.protocol === 'https:',  // ✅ Use secure if HTTPS
              rejectUnauthorized: false,  // ✅ For development
              forceNew: false,
              autoConnect: true
            })

            // ✅ FIXED: Connection event handlers with better logging
            socketInstance.on('connect', () => {
              console.log('[Socket.IO] ✅ Connected to server')
              console.log('[Socket.IO] Socket ID:', socketInstance?.id)
              connectionAttempts = 0
            })

            socketInstance.on('connect_error', (error: any) => {
              console.error('[Socket.IO] ❌ Connection error:', error.message)
              console.error('[Socket.IO] Error code:', error.code)
              console.error('[Socket.IO] Error data:', error.data)
              connectionAttempts++
              
              // ✅ FIXED: Better error handling
              if (error.code === 'ERR_AUTH') {
                console.error('[Socket.IO] Auth failed - token may be invalid')
                authStore.clearAuth()
              }
            })

            socketInstance.on('disconnect', (reason: string) => {
              console.log('[Socket.IO] ⚠️ Disconnected:', reason)
              if (reason === 'io server disconnect') {
                console.log('[Socket.IO] Server disconnected, attempting to reconnect...')
              }
            })

            socketInstance.on('error', (error: any) => {
              console.error('[Socket.IO] ❌ Socket error:', error)
            })

            // Listen for auth errors
            socketInstance.on('auth_error', (error: any) => {
              console.error('[Socket.IO] ❌ Auth error:', error)
              authStore.clearAuth()
            })

            // ✅ FIXED: Listen for connection events
            socketInstance.on('message', (data: any) => {
              console.log('[Socket.IO] Message received:', data)
            })

            socketInstance.on('notification', (data: any) => {
              console.log('[Socket.IO] Notification received:', data)
            })

            console.log('[Socket.IO] ✅ Socket instance created')
            return socketInstance

          } catch (error: any) {
            console.error('[Socket.IO] ❌ Connection failed:', error.message)
            console.error('[Socket.IO] Stack:', error.stack)
            return null
          }
        },

        /**
         * Get current socket instance
         */
        getInstance(): Socket | null {
          return socketInstance
        },

        /**
         * Check if connected
         */
        isConnected(): boolean {
          return socketInstance?.connected || false
        },

        /**
         * Get connection state
         */
        getState(): { connected: boolean; authenticated: boolean; error: string | null } {
          return {
            connected: socketInstance?.connected || false,
            authenticated: socketInstance?.connected || false,
            error: null
          }
        },

        /**
         * Disconnect socket properly
         */
        disconnect(): void {
          if (socketInstance) {
            socketInstance.disconnect()
            socketInstance = null
            connectionAttempts = 0
            console.log('[Socket.IO] ✅ Disconnected')
          }
        },

        /**
         * Emit event with proper error handling
         */
        emit(event: string, data?: any): void {
          if (socketInstance?.connected) {
            try {
              socketInstance.emit(event, data)
              console.log('[Socket.IO] ✅ Event emitted:', event)
            } catch (error) {
              console.error('[Socket.IO] ❌ Error emitting event:', error)
            }
          } else {
            console.warn('[Socket.IO] ⚠️ Not connected, cannot emit:', event)
          }
        },

        /**
         * Listen to event with proper error handling
         */
        on(event: string, callback: (data: any) => void): void {
          if (socketInstance) {
            try {
              socketInstance.on(event, callback)
              console.log('[Socket.IO] ✅ Listening to event:', event)
            } catch (error) {
              console.error('[Socket.IO] ❌ Error listening to event:', error)
            }
          }
        },

        /**
         * Remove event listener
         */
        off(event: string, callback?: (data: any) => void): void {
          if (socketInstance) {
            try {
              socketInstance.off(event, callback)
              console.log('[Socket.IO] ✅ Stopped listening to event:', event)
            } catch (error) {
              console.error('[Socket.IO] ❌ Error removing listener:', error)
            }
          }
        },

        /**
         * Reconnect with fresh auth token
         */
        async reconnect(): Promise<Socket | null> {
          console.log('[Socket.IO] 🔄 Reconnecting...')
          this.disconnect()
          
          // Wait a bit before reconnecting
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          return this.connect()
        },

        /**
         * Join a chat room
         */
        joinChat(chatId: string): void {
          this.emit('join_chat', { chatId })
        },

        /**
         * Leave a chat room
         */
        leaveChat(chatId: string): void {
          this.emit('leave_chat', { chatId })
        },

        /**
         * Send a message
         */
        sendMessage(chatId: string, message: string): void {
          this.emit('send_message', { chatId, message })
        },

        /**
         * Send typing indicator
         */
        sendTyping(chatId: string): void {
          this.emit('typing', { chatId })
        },

        /**
         * Update presence status
         */
        updatePresence(status: string, activity?: string): void {
          this.emit('update_presence', { status, activity })
        },

        /**
         * Subscribe to notifications
         */
        subscribeNotifications(types: string[]): void {
          this.emit('subscribe_notifications', { types })
        },

        /**
         * Unsubscribe from notifications
         */
        unsubscribeNotifications(types: string[]): void {
          this.emit('unsubscribe_notifications', { types })
        },

        /**
         * Start a stream
         */
        startStream(streamId: string, title: string): void {
          this.emit('start_stream', { streamId, title })
        },

        /**
         * End a stream
         */
        endStream(streamId: string): void {
          this.emit('end_stream', { streamId })
        },

        /**
         * Join a stream
         */
        joinStream(streamId: string): void {
          this.emit('join_stream', { streamId })
        },

        /**
         * Leave a stream
         */
        leaveStream(streamId: string): void {
          this.emit('leave_stream', { streamId })
        },

        /**
         * Initiate a call
         */
        initiateCall(targetUserId: string, offer: any): void {
          this.emit('initiate_call', { targetUserId, offer })
        },

        /**
         * Answer a call
         */
        answerCall(targetUserId: string, answer: any): void {
          this.emit('answer_call', { targetUserId, answer })
        },

        /**
         * Send ICE candidate
         */
        sendIceCandidate(targetUserId: string, candidate: any): void {
          this.emit('ice_candidate', { targetUserId, candidate })
        },

        /**
         * End a call
         */
        endCall(targetUserId: string): void {
          this.emit('end_call', { targetUserId })
        }
      }
    }
  }
})
