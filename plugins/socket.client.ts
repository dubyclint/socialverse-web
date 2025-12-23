// ============================================================================
// FILE 3: /plugins/socket.client.ts - COMPLETE FIXED VERSION
// ============================================================================
// SOCKET.IO CLIENT PLUGIN - FIXED: Proper auth handling and connection
// ============================================================================

import { io, Socket } from 'socket.io-client'

let socketInstance: Socket | null = null

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
              console.warn('[Socket.IO] ⚠️ No auth token available')
              return null
            }

            console.log('[Socket.IO] ✅ Auth token available, connecting...')

            // Get runtime config for socket URL
            const config = useRuntimeConfig()
            const socketUrl = config.public.socketUrl || window.location.origin

            // Create Socket.IO connection with auth
            socketInstance = io(socketUrl, {
              auth: {
                token: authStore.token,
                userId: authStore.userId
              },
              reconnection: true,
              reconnectionDelay: 1000,
              reconnectionDelayMax: 5000,
              reconnectionAttempts: 5,
              transports: ['websocket', 'polling']
            })

            // Connection event handlers
            socketInstance.on('connect', () => {
              console.log('[Socket.IO] ✅ Connected to server')
            })

            socketInstance.on('connect_error', (error: any) => {
              console.error('[Socket.IO] ❌ Connection error:', error.message)
            })

            socketInstance.on('disconnect', (reason: string) => {
              console.log('[Socket.IO] ⚠️ Disconnected:', reason)
            })

            socketInstance.on('error', (error: any) => {
              console.error('[Socket.IO] ❌ Error:', error)
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
         * Disconnect socket
         */
        disconnect(): void {
          if (socketInstance) {
            socketInstance.disconnect()
            socketInstance = null
            console.log('[Socket.IO] ✅ Disconnected')
          }
        },

        /**
         * Emit event
         */
        emit(event: string, data?: any): void {
          if (socketInstance?.connected) {
            socketInstance.emit(event, data)
          } else {
            console.warn('[Socket.IO] ⚠️ Not connected, cannot emit:', event)
          }
        },

        /**
         * Listen to event
         */
        on(event: string, callback: (data: any) => void): void {
          if (socketInstance) {
            socketInstance.on(event, callback)
          }
        },

        /**
         * Remove event listener
         */
        off(event: string, callback?: (data: any) => void): void {
          if (socketInstance) {
            socketInstance.off(event, callback)
          }
        }
      }
    }
  }
})
