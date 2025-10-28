// ============================================================================
// plugins/socket.client.ts - SOCKET.IO CLIENT PLUGIN
// ============================================================================
// ✅ Socket.io is DISABLED during sign-up/login
// ✅ Socket.io initializes ONLY after user is authenticated

import { io, Socket } from 'socket.io-client'

declare global {
  interface Window {
    $socket?: Socket
  }
}

let socketInstance: Socket | null = null

export default defineNuxtPlugin(() => {
  console.log('[Socket.io] Plugin loaded - waiting for authentication')
  
  // ✅ Socket.io is disabled by default - will be enabled by auth store after sign-in
  return {
    provide: {
      socket: null,
      // Function to initialize Socket.io after auth
      initializeSocket: (socketUrl?: string) => {
        try {
          const config = useRuntimeConfig()
          
          // Get socket URL from parameter or config
          let url = socketUrl || config.public.socketUrl
          
          if (!url && process.client) {
            url = window.location.origin
          }
          
          // Don't connect to localhost in production
          if (url?.includes('localhost') && process.env.NODE_ENV === 'production') {
            console.warn('[Socket.io] Skipping localhost connection in production')
            return null
          }
          
          if (!url) {
            console.warn('[Socket.io] No socket URL configured')
            return null
          }

          console.log('[Socket.io] Initializing Socket.io connection to:', url)
          
          socketInstance = io(url, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
            transports: ['websocket', 'polling']
          })

          socketInstance.on('connect', () => {
            console.log('[Socket.io] ✅ Connected to server')
          })

          socketInstance.on('disconnect', () => {
            console.log('[Socket.io] Disconnected from server')
          })

          socketInstance.on('error', (error) => {
            console.error('[Socket.io] Error:', error)
          })

          window.$socket = socketInstance
          return socketInstance
        } catch (error) {
          console.error('[Socket.io] Failed to initialize:', error)
          return null
        }
      },
      
      // Function to disconnect Socket.io
      disconnectSocket: () => {
        if (socketInstance) {
          console.log('[Socket.io] Disconnecting...')
          socketInstance.disconnect()
          socketInstance = null
          window.$socket = undefined
        }
      }
    }
  }
})


