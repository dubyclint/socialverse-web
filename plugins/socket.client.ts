// ============================================================================
// plugins/socket.client.ts - SOCKET.IO CLIENT PLUGIN
// ============================================================================
// This plugin initializes Socket.io client connection for real-time features
// DISABLED BY DEFAULT - Enable only when Socket.io server is ready

import { io, Socket } from 'socket.io-client'

declare global {
  interface Window {
    $socket?: Socket
  }
}

export default defineNuxtPlugin(() => {
  console.log('[Socket.io] Plugin loaded')
  
  try {
    const config = useRuntimeConfig()
    
    // DISABLED: Socket.io is disabled by default
    // Enable this when you have a Socket.io server running
    const SOCKET_ENABLED = false
    
    if (!SOCKET_ENABLED) {
      console.log('[Socket.io] Socket.io is disabled (not configured)')
      return {
        provide: {
          socket: null,
        },
      }
    }

    // Get socket URL from config
    let socketUrl = config.public.socketUrl
    
    // If no socketUrl configured, use current origin
    if (!socketUrl && process.client) {
      socketUrl = window.location.origin
    }
    
    // Don't connect to localhost in production
    if (socketUrl?.includes('localhost') && process.env.NODE_ENV === 'production') {
      console.warn('[Socket.io] Skipping localhost connection in production')
      return {
        provide: {
          socket: null,
        },
      }
    }
    
    if (!socketUrl) {
      console.warn('[Socket.io] No socket URL configured')
      return {
        provide: {
          socket: null,
        },
      }
    }

    console.log('[Socket.io] Initializing connection to:', socketUrl)

    // Initialize Socket.io connection with timeout
    const socket: Socket = io(socketUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 3,
      transports: ['websocket', 'polling'],
      autoConnect: false, // Don't auto-connect
      secure: socketUrl.startsWith('https'),
      rejectUnauthorized: false,
      timeout: 5000,
    })

    // Connection event handlers
    socket.on('connect', () => {
      console.log('[Socket.io] Connected successfully')
    })

    socket.on('disconnect', () => {
      console.log('[Socket.io] Disconnected')
    })

    socket.on('error', (error: any) => {
      console.error('[Socket.io] Connection error:', error)
    })

    socket.on('connect_error', (error: any) => {
      console.error('[Socket.io] Connection error:', error)
    })

    // Make socket available globally
    if (process.client) {
      window.$socket = socket
    }

    return {
      provide: {
        socket,
      },
    }
  } catch (err) {
    console.error('[Socket.io] Plugin initialization failed:', err)
    // Don't break the app if socket fails
    return {
      provide: {
        socket: null,
      },
    }
  }
})
