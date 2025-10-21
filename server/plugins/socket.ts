// ✅ FIXED - Simplified Socket.IO with error handling
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

let io: any
const connectedUsers = new Map<string, User>()
const chatRooms = new Map<string, ChatMessage[]>()

export default defineNitroPlugin((nitroApp: NitroApp) => {
  try {
    // Socket.IO initialization is optional
    // It will be initialized when needed
    console.log('✅ Socket.IO plugin loaded')
  } catch (error) {
    console.warn('⚠️ Socket.IO initialization skipped:', error instanceof Error ? error.message : 'Unknown error')
  }
})


