// types/chat.ts
export interface ChatMessage {
  id: string
  userId: string
  username: string
  message: string
  timestamp: number
  avatar?: string
  roomId?: string
  // Some parts of the app expect `chatId` instead of `roomId`.
  chatId?: string
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

export interface Chat {
  id: string
  title?: string
  lastMessageTime?: number
  isPinned?: boolean
}

export interface Translation {
  id: string
  messageId: string
  language: string
  text: string
}

export interface Gift {
  id: string
  senderId: string
  recipientId: string
  amount: number
  type?: string
}
