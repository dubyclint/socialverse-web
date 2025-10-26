// stores/chat.ts - UPDATED WITH TRANSLATION & GIFT STATE
// =========================================================

import { defineStore } from 'pinia'

export interface ChatMessage {
  id: string
  chatId: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: number
  isEdited: boolean
  isDeleted: boolean
  messageType: 'text' | 'image' | 'file' | 'system'
  attachments?: any[]
}

export interface Chat {
  id: string
  type: 'direct' | 'group'
  name: string
  avatar?: string
  description?: string
  lastMessage?: string
  lastMessageTime?: number
  unreadCount: number
  isPinned: boolean
  isMuted: boolean
  participants: string[]
  createdAt: number
  updatedAt: number
}

export interface TypingUser {
  userId: string
  username: string
  roomId: string
}

export interface User {
  id: string
  username: string
  avatar?: string
  status: 'online' | 'offline' | 'away'
}

export interface Translation {
  messageId: string
  originalText: string
  translatedText: string
  targetLanguage: string
  timestamp: number
}

export interface Gift {
  id: string
  giftId: string
  senderId: string
  senderName: string
  senderAvatar?: string
  recipientId: string
  amount: number
  message?: string
  messageId?: string
  timestamp: number
}

export const useChatStore = defineStore('chat', {
  state: () => ({
    // Messages
    messages: new Map<string, ChatMessage[]>(), // roomId -> messages
    
    // Chats
    chats: new Map<string, Chat>(), // chatId -> chat
    chatList: [] as string[], // ordered list of chat IDs
    
    // Users
    onlineUsers: new Map<string, User>(), // userId -> user
    typingUsers: new Map<string, TypingUser>(), // userId -> typing user
    
    // Translations
    translations: new Map<string, Translation>(), // messageId -> translation
    
    // Gifts
    gifts: new Map<string, Gift>(), // giftId -> gift
    userBalance: 0, // Current user's PEW balance
    
    // UI State
    currentChatId: null as string | null,
    isConnected: false,
    isLoading: false,
    error: null as string | null,
    
    // Settings
    unreadCounts: new Map<string, number>() // chatId -> unread count
  }),

  getters: {
    // Get messages for current chat
    currentChatMessages: (state) => {
      if (!state.currentChatId) return []
      return state.messages.get(state.currentChatId) || []
    },

    // Get sorted chat list
    sortedChats: (state) => {
      return state.chatList
        .map(id => state.chats.get(id))
        .filter(Boolean)
        .sort((a, b) => {
          // Pinned chats first
          if (a?.isPinned !== b?.isPinned) {
            return (b?.isPinned ? 1 : 0) - (a?.isPinned ? 1 : 0)
          }
          // Then by last message time
          return (b?.lastMessageTime || 0) - (a?.lastMessageTime || 0)
        })
    },

    // Get unread count
    totalUnreadCount: (state) => {
      let total = 0
      state.unreadCounts.forEach(count => {
        total += count
      })
      return total
    },

    // Get online users count
    onlineUsersCount: (state) => {
      return state.onlineUsers.size
    },

    // Get typing users for current chat
    currentChatTypingUsers: (state) => {
      if (!state.currentChatId) return []
      return Array.from(state.typingUsers.values()).filter(
        user => user.roomId === state.currentChatId
      )
    },

    // Get translations for current chat
    currentChatTranslations: (state) => {
      if (!state.currentChatId) return []
      const messages = state.messages.get(state.currentChatId) || []
      return messages
        .map(msg => state.translations.get(msg.id))
        .filter(Boolean)
    },

    // Get gifts for current chat
    currentChatGifts: (state) => {
      if (!state.currentChatId) return []
      return Array.from(state.gifts.values()).filter(
        gift => gift.messageId && state.messages.get(state.currentChatId)?.some(m => m.id === gift.messageId)
      )
    }
  },

  actions: {
    // ===== CONNECTION =====
    setConnected(connected: boolean) {
      this.isConnected = connected
    },

    // ===== MESSAGES =====
    addMessage(message: ChatMessage) {
      if (!this.messages.has(message.chatId)) {
        this.messages.set(message.chatId, [])
      }
      const messages = this.messages.get(message.chatId)!
      
      // Prevent duplicates
      if (!messages.find(m => m.id === message.id)) {
        messages.push(message)
        messages.sort((a, b) => a.timestamp - b.timestamp)
      }
    },

    addMessages(chatId: string, messages: ChatMessage[]) {
      this.messages.set(chatId, messages.sort((a, b) => a.timestamp - b.timestamp))
    },

    updateMessage(message: ChatMessage) {
      const messages = this.messages.get(message.chatId)
      if (messages) {
        const index = messages.findIndex(m => m.id === message.id)
        if (index !== -1) {
          messages[index] = message
        }
      }
    },

    deleteMessage(messageId: string) {
      this.messages.forEach(messages => {
        const index = messages.findIndex(m => m.id === messageId)
        if (index !== -1) {
          messages[index].isDeleted = true
        }
      })
    },

    clearMessages(chatId: string) {
      this.messages.delete(chatId)
    },

    // ===== CHATS =====
    addChat(chat: Chat) {
      this.chats.set(chat.id, chat)
      if (!this.chatList.includes(chat.id)) {
        this.chatList.push(chat.id)
      }
    },

    addChats(chats: Chat[]) {
      chats.forEach(chat => this.addChat(chat))
    },

    updateChat(chat: Chat) {
      this.chats.set(chat.id, chat)
    },

    removeChat(chatId: string) {
      this.chats.delete(chatId)
      this.chatList = this.chatList.filter(id => id !== chatId)
      this.messages.delete(chatId)
      this.unreadCounts.delete(chatId)
    },

    setCurrentChat(chatId: string | null) {
      this.currentChatId = chatId
      if (chatId) {
        // Clear unread count
        this.unreadCounts.set(chatId, 0)
      }
    },

    // ===== USERS =====
    setOnlineUsers(users: User[]) {
      this.onlineUsers.clear()
      users.forEach(user => {
        this.onlineUsers.set(user.id, user)
      })
    },

    addOnlineUser(user: User) {
      this.onlineUsers.set(user.id, user)
    },

    removeOnlineUser(userId: string) {
      this.onlineUsers.delete(userId)
    },

    // ===== TYPING INDICATORS =====
    addTypingUser(data: TypingUser) {
      this.typingUsers.set(data.userId, data)
      
      // Auto-remove after 3 seconds
      setTimeout(() => {
        this.typingUsers.delete(data.userId)
      }, 3000)
    },

    removeTypingUser(userId: string) {
      this.typingUsers.delete(userId)
    },

    // ===== TRANSLATIONS =====
    addTranslation(translation: Translation) {
      this.translations.set(translation.messageId, translation)
    },

    getTranslation(messageId: string): Translation | undefined {
      return this.translations.get(messageId)
    },

    clearTranslations() {
      this.translations.clear()
    },

    // ===== GIFTS =====
    addGift(gift: Gift) {
      this.gifts.set(gift.id, gift)
    },

    addGifts(gifts: Gift[]) {
      gifts.forEach(gift => this.addGift(gift))
    },

    getGift(giftId: string): Gift | undefined {
      return this.gifts.get(giftId)
    },

    removeGift(giftId: string) {
      this.gifts.delete(giftId)
    },

    setUserBalance(balance: number) {
      this.userBalance = balance
    },

    updateUserBalance(amount: number) {
      this.userBalance += amount
    },

    // ===== UNREAD COUNTS =====
    incrementUnreadCount(chatId: string) {
      const current = this.unreadCounts.get(chatId) || 0
      this.unreadCounts.set(chatId, current + 1)
    },

    setUnreadCount(chatId: string, count: number) {
      this.unreadCounts.set(chatId, count)
    },

    clearUnreadCount(chatId: string) {
      this.unreadCounts.set(chatId, 0)
    },

    // ===== UI STATE =====
    setLoading(loading: boolean) {
      this.isLoading = loading
    },

    setError(error: string | null) {
      this.error = error
    },

    // ===== BULK OPERATIONS =====
    reset() {
      this.messages.clear()
      this.chats.clear()
      this.chatList = []
      this.onlineUsers.clear()
      this.typingUsers.clear()
      this.translations.clear()
      this.gifts.clear()
      this.currentChatId = null
      this.isConnected = false
      this.isLoading = false
      this.error = null
      this.unreadCounts.clear()
      this.userBalance = 0
    }
  }
})

