// ============================================================================
// plugins/socket.client.ts - SOCKET.IO CLIENT PLUGIN
// ============================================================================
// This plugin initializes Socket.io client connection for real-time features

import { io, Socket } from 'socket.io-client'

declare global {
  interface Window {
    $socket?: Socket
  }
}

export default defineNuxtPlugin(() => {
  try {
    const config = useRuntimeConfig()
    
    // Get socket URL from config, default to current origin
    let socketUrl = config.public.socketUrl
    
    // If no socketUrl configured, use current origin
    if (!socketUrl && process.client) {
      socketUrl = window.location.origin
    }
    
    // Don't connect to localhost in production
    if (socketUrl?.includes('localhost') && process.env.NODE_ENV === 'production') {
      console.warn('Socket.io: Skipping localhost connection in production')
      return
    }
    
    if (!socketUrl) {
      console.warn('Socket.io: No socket URL configured, skipping initialization')
      return
    }

    console.log('Socket.io: Initializing connection to', socketUrl)

    // Initialize Socket.io connection
    const socket: Socket = io(socketUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      secure: socketUrl.startsWith('https'),
      rejectUnauthorized: false
    })

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Socket.io: Connected successfully')
    })

    socket.on('disconnect', () => {
      console.log('Socket.io: Disconnected')
    })

    socket.on('error', (error: any) => {
      console.error('Socket.io connection error:', error)
    })

    socket.on('connect_error', (error: any) => {
      console.error('Socket.io connection error:', error)
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
    console.error('Socket.io plugin initialization failed:', err)
    // Don't break the app if socket fails
    return
  }
})
