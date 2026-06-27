// types/chat.ts
export interface ChatMessage {
  id: string
  userId: string
  username: string
  message: string
  timestamp: number
  avatar?: string
  roomId?: string
}

export interface User {
  id: string
  username: string
  avatar?: string
  isOnline?: boolean
}

export interface TypingUser {
  userId: string
  username: string
  isTyping: boolean
}
