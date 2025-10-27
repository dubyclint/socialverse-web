// plugins/socket.client.ts
import { io, Socket } from 'socket.io-client'

declare global {
  interface Window {
    $socket?: Socket
  }
}

export default defineNuxtPlugin(() => {
  try {
    const config = useRuntimeConfig()
    const authStore = useAuthStore()
    
    // Get socket URL from config
    let socketUrl = config.public.socketUrl
    
    if (!socketUrl && process.client) {
      socketUrl = window.location.origin
    }

    if (!socketUrl) {
      console.warn('Socket.io: No socket URL configured')
      return
    }

    console.log('Socket.io: Connecting to', socketUrl)

    // Initialize Socket.io connection
    const socket: Socket = io(socketUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      secure: socketUrl.startsWith('https'),
      rejectUnauthorized: false,
      // Pass auth token if user is authenticated
      auth: (cb) => {
        const token = localStorage.getItem('auth_token')
        cb({
          token: token || null
        })
      }
    })

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ Socket.io: Connected successfully')
    })

    socket.on('disconnect', () => {
      console.log('⚠️ Socket.io: Disconnected')
    })

    socket.on('error', (error: any) => {
      console.error('❌ Socket.io connection error:', error)
    })

    socket.on('connect_error', (error: any) => {
      console.error('❌ Socket.io connect error:', error)
    })

    // Make socket available globally
    if (process.client) {
      window.$socket = socket
    }

    return {
      provide: {
        socket
      }
    }

  } catch (error) {
    console.error('Socket.io plugin error:', error)
  }
})
