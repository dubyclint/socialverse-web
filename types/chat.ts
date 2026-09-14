// types/chat.ts
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface ChatMessage {
  id: string
  chatId: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: number
  messageType?: 'text' | 'image' | 'file' | 'system'
  status?: MessageStatus
  /** Client-side id of an optimistic message, echoed back by the server. */
  tempId?: string
  isEdited?: boolean
  isDeleted?: boolean
  translatedText?: string
  translatedLang?: string
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
  chatId: string
}

export interface Chat {
  id: string
  title?: string
  name?: string
  avatar?: string
  lastMessage?: string
  lastMessageTime?: number
  unreadCount?: number
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
