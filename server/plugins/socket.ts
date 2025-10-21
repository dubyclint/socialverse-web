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

export default defineNitroPlugin((nitroApp: NitroApp) => {
  // Socket.IO will be initialized when the Nitro server starts
  nitroApp.hooks.hook('listen', (server) => {
    io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    })

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id)

      socket.on('join', (userData: { userId: string; username: string; avatar?: string }) => {
        const user: User = {
          id: userData.userId,
          username: userData.username,
          avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`,
          socketId: socket.id,
        }

        connectedUsers.set(socket.id, user)
        io.emit('user-joined', user)
        console.log(`${userData.username} joined`)
      })

      socket.on('send-message', (data: ChatMessage) => {
        const roomId = data.roomId || 'general'
        if (!chatRooms.has(roomId)) {
          chatRooms.set(roomId, [])
        }
        chatRooms.get(roomId)?.push(data)
        io.to(roomId).emit('receive-message', data)
      })

      socket.on('disconnect', () => {
        const user = connectedUsers.get(socket.id)
        connectedUsers.delete(socket.id)
        io.emit('user-left', user)
        console.log('User disconnected:', socket.id)
      })
    })
  })
})

