// ============================================================================
// plugins/socket.client.ts - SOCKET.IO CLIENT PLUGIN
// ============================================================================
// This plugin initializes Socket.io client connection for real-time features
// Place this file at: /plugins/socket.client.ts

import { io, Socket } from 'socket.io-client'

declare global {
  interface Window {
    $socket?: Socket
  }
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const socketUrl = config.public.socketUrl || 'http://localhost:8080'

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
    console.log('Socket.io connected:', socket.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('Socket.io disconnected:', reason)
  })

  socket.on('connect_error', (error) => {
    console.error('Socket.io connection error:', error)
  })

  socket.on('error', (error) => {
    console.error('Socket.io error:', error)
  })

  // Make socket available globally
  if (process.client) {
    window.$socket = socket
  }

  // Provide socket to all components
  return {
    provide: {
      socket
    }
  }
})
