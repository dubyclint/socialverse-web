// composables/useSocket.ts
import { io, Socket } from 'socket.io-client'
import type { ChatMessage, User } from '~/types/chat'

export const useSocket = () => {
  let socket: Socket | null = null
  const chatStore = useChatStore()

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
        reconnectionAttempts: 3,
        timeout: 5000,
      })

      socket.on('connect', () => {
        console.log('[useSocket] Connected to WebSocket server')
        chatStore.setConnectionStatus(true)
        
        // Join the chat with user info if provided
        if (user) {
          socket?.emit('join', {
            userId: user.id,
            username: user.username,
            avatar: user.avatar
          })
        }
      })

      socket.on('disconnect', () => {
        console.log('[useSocket] Disconnected from WebSocket server')
        chatStore.setConnectionStatus(false)
      })

      socket.on('error', (error: any) => {
        console.error('[useSocket] Socket error:', error)
      })

      socket.on('connect_error', (error: any) => {
        console.error('[useSocket] Connection error:', error)
      })

      socket.on('message_history', (messages: ChatMessage[]) => {
        chatStore.setMessages(messages)
      })

      socket.on('new_message', (message: ChatMessage) => {
        chatStore.addMessage(message)
      })

      socket.on('users_update', (users: User[]) => {
        chatStore.updateUsers(users)
      })

      socket.on('user_typing', (typingData: { userId: string, username: string, isTyping: boolean }) => {
        chatStore.updateTyping(typingData)
      })

      return socket
    } catch (err) {
      console.error('[useSocket] Connection failed:', err)
      return null
    }
  }

  const disconnect = () => {
    if (socket) {
      socket.disconnect()
      socket = null
      chatStore.setConnectionStatus(false)
    }
  }

  const sendMessage = (message: string, roomId?: string) => {
    if (socket && message.trim()) {
      socket.emit('send_message', { message: message.trim(), roomId })
    }
  }

  const sendTyping = (isTyping: boolean) => {
    if (socket) {
      socket.emit('typing', { isTyping })
    }
  }

  return {
    initializeSocket,
    connect,
    disconnect,
    sendMessage,
    sendTyping,
  }
}
