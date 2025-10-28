// ============================================================================
// plugins/socket.client.ts - SOCKET.IO CLIENT PLUGIN
// ============================================================================
// Socket.io is DISABLED during sign-up/login
// Socket.io initializes ONLY after user is authenticated

import { io, Socket } from 'socket.io-client'

declare global {
  interface Window {
    $socket?: Socket
  }
}

let socketInstance: Socket | null = null

export default defineNuxtPlugin(() => {
  console.log('[Socket.io] Plugin loaded - Socket.io will initialize after authentication')
  
  // Socket.io is disabled by default - will be enabled by auth store after sign-in
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

          console.log('[Socket.io] Initializing connection to:', url)

          // Initialize Socket.io connection
          socketInstance = io(url, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 3,
            transports: ['websocket', 'polling'],
            autoConnect: false,
            secure: url.startsWith('https'),
          })

          // Set up event listeners
          socketInstance.on('connect', () => {
            console.log('[Socket.io] Connected successfully')
          })

          socketInstance.on('disconnect', () => {
            console.log('[Socket.io] Disconnected')
          })

          socketInstance.on('error', (error) => {
            console.error('[Socket.io] Error:', error)
          })

          if (process.client) {
            window.$socket = socketInstance
          }

          console.log('[Socket.io] Socket.io initialized successfully')
          return socketInstance
          
        } catch (error) {
          console.error('[Socket.io] Initialization failed:', error)
          return null
        }
      }
    }
  }
})
