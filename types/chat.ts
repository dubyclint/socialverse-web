// types/chat.ts
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface MessageReaction {
  emoji: string
  count: number
  /** Whether the viewer is one of the reactors. */
  reacted: boolean
}

export interface QuotedMessage {
  id: string
  senderId: string
  content: string
}

export interface ChatMessage {
  id: string
  chatId: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: number
  messageType?: 'text' | 'image' | 'video' | 'audio' | 'file' | 'system'
  status?: MessageStatus
  /** Client-side id of an optimistic message, echoed back by the server. */
  tempId?: string
  attachments?: string[]
  replyTo?: QuotedMessage
  reactions?: MessageReaction[]
  editedAt?: string
  expiresAt?: string
  deleted?: boolean
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
  activity?: 'typing' | 'recording'
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
  isGroup?: boolean
  type?: 'direct' | 'group'
  /** The other participant of a direct chat. */
  userId?: string
  username?: string
  participantCount?: number
  /** Other members of a group chat (excludes the viewer). */
  members?: ChatMember[]
}

export interface ChatMember {
  userId: string
  name: string
  avatar?: string
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
