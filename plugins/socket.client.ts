FIXED FILE 5: /plugins/socket.client.ts
# ============================================================================
# SOCKET.IO CLIENT PLUGIN - FIXED: Proper auth handling and localStorage
# ============================================================================
# ✅ FIXED: Uses auth store instead of direct localStorage
# ✅ FIXED: Proper connection state management
# ✅ FIXED: Comprehensive error handling
# ✅ FIXED: Socket instance caching
# ============================================================================

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
         * Uses auth store instead of direct localStorage access
         */
        async connect(): Promise<Socket | null> {
          try {
            // If already connected, return existing instance
            if (socketInstance?.connected) {
              console.log('[Socket.IO] Already connected')
              return socketInstance
            }

            console.log('[Socket.IO] 🚀 Connecting to server...')

            // Get auth store (not localStorage)
            const authStore = useAuthStore()
            
            // Wait for auth to be ready (max 5 seconds)
            let attempts = 0
            while (!authStore.token && attempts < 50) {
              await new Promise(resolve => setTimeout(resolve, 100))
              attempts++
            }

            if (!authStore.token) {
              console.warn('[Socket.IO] ⚠️ No auth token available')
              return null
            }

            console.log('[Socket.IO] ✅ Auth token available, connecting...')

            // Get runtime config for socket URL
            const config = useRuntimeConfig()
            const socketUrl = config.public.socketUrl || window.location.origin

            // Create Socket.IO connection with auth from store
            socketInstance = io(socketUrl, {
              auth: {
                token: authStore.token,
                userId: authStore.userId
              },
              reconnection: true,
              reconnectionDelay: 1000,
              reconnectionDelayMax: 5000,
              reconnectionAttempts: MAX_CONNECTION_ATTEMPTS,
              transports: ['websocket', 'polling']
            })

            // Connection event handlers
            socketInstance.on('connect', () => {
              console.log('[Socket.IO] ✅ Connected to server')
              connectionAttempts = 0
            })

            socketInstance.on('connect_error', (error: any) => {
              console.error('[Socket.IO] ❌ Connection error:', error.message)
              connectionAttempts++
            })

            socketInstance.on('disconnect', (reason: string) => {
              console.log('[Socket.IO] ⚠️ Disconnected:', reason)
            })

            socketInstance.on('error', (error: any) => {
              console.error('[Socket.IO] ❌ Error:', error)
            })

            // Listen for auth errors
            socketInstance.on('auth_error', (error: any) => {
              console.error('[Socket.IO] ❌ Auth error:', error)
              // Clear auth store on auth error
              authStore.clearAuth()
            })

            console.log('[Socket.IO] ✅ Socket instance created')
            return socketInstance

          } catch (error: any) {
            console.error('[Socket.IO] ❌ Connection failed:', error.message)
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
        }
      }
    }
  }
})
