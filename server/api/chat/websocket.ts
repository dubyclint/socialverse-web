// server/api/chat/websocket.ts
import { Server } from 'socket.io'
import type { NitroApp } from 'nitropack'

interface ChatMessage {
  id: string
  userId: string
  username: string
  message: string
  timestamp: number
  avatar?: string
  roomId?: string
}

interface User {
  id: string
  username: string
  avatar?: string
  socketId: string
}

let io: Server
const connectedUsers = new Map<string, User>()
const chatRooms = new Map<string, ChatMessage[]>()

export default async (nitroApp: NitroApp) => {
  const server = nitroApp.hooks.hook('render:route', () => {})
  
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  })

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    // Handle user joining
    socket.on('join', (userData: { userId: string, username: string, avatar?: string }) => {
      const user: User = {
        id: userData.userId,
        username: userData.username,
        avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`,
        socketId: socket.id
      }
      
      connectedUsers.set(socket.id, user)
      
      // Broadcast user list update
      io.emit('users_update', Array.from(connectedUsers.values()))
      
      // Send recent messages to the new user
      const recentMessages = chatRooms.get('general') || []
      socket.emit('message_history', recentMessages.slice(-50))
    })

    // Handle new message
    socket.on('send_message', (data: { message: string, roomId?: string }) => {
      const user = connectedUsers.get(socket.id)
      if (!user) return

      const roomId = data.roomId || 'general'
      const chatMessage: ChatMessage = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        username: user.username,
        message: data.message,
        timestamp: Date.now(),
        avatar: user.avatar,
        roomId
      }

      // Store message in room
      if (!chatRooms.has(roomId)) {
        chatRooms.set(roomId, [])
      }
      const roomMessages = chatRooms.get(roomId)!
      roomMessages.push(chatMessage)
      
      // Keep only last 1000 messages per room
      if (roomMessages.length > 1000) {
        roomMessages.splice(0, roomMessages.length - 1000)
      }

      // Broadcast message
      io.emit('new_message', chatMessage)
    })

    // Handle typing indicator
    socket.on('typing', (data: { isTyping: boolean }) => {
      const user = connectedUsers.get(socket.id)
      if (!user) return

      socket.broadcast.emit('user_typing', {
        userId: user.id,
        username: user.username,
        isTyping: data.isTyping
      })
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
      connectedUsers.delete(socket.id)
      io.emit('users_update', Array.from(connectedUsers.values()))
    })
  })
}
