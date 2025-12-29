 FIXED FILE 4: /stores/chat.ts (EXTENDED)
# ============================================================================
# CHAT STORE - FIXED: Proper localStorage management for chat state
# ============================================================================
# ✅ FIXED: Added cacheChatState() method
# ✅ FIXED: Added restoreChatState() method
# ✅ FIXED: Centralized localStorage access for chat data
# ✅ FIXED: Proper hydration handling
# ============================================================================

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
    unreadCounts: new Map<string, number>(), // chatId -> unread count
    
    // ✅ FIXED: Cache state
    isCached: false,
    lastCacheTime: 0
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
      console.log('[ChatStore] Connection status:', connected ? '✅ Connected' : '❌ Disconnected')
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
      
      // ✅ Cache after adding message
      this.cacheChatState()
    },

    addMessages(chatId: string, messages: ChatMessage[]) {
      this.messages.set(chatId, messages.sort((a, b) => a.timestamp - b.timestamp))
      
      // ✅ Cache after adding messages
      this.cacheChatState()
    },

    updateMessage(message: ChatMessage) {
      const messages = this.messages.get(message.chatId)
      if (messages) {
        const index = messages.findIndex(m => m.id === message.id)
        if (index !== -1) {
          messages[index] = message
        }
      }
      
      // ✅ Cache after updating message
      this.cacheChatState()
    },

    deleteMessage(messageId: string) {
      this.messages.forEach(messages => {
        const index = messages.findIndex(m => m.id === messageId)
        if (index !== -1) {
          messages[index].isDeleted = true
        }
      })
      
      // ✅ Cache after deleting message
      this.cacheChatState()
    },

    clearMessages(chatId: string) {
      this.messages.delete(chatId)
      
      // ✅ Cache after clearing messages
      this.cacheChatState()
    },

    // ===== CHATS =====
    addChat(chat: Chat) {
      this.chats.set(chat.id, chat)
      if (!this.chatList.includes(chat.id)) {
        this.chatList.push(chat.id)
      }
      
      // ✅ Cache after adding chat
      this.cacheChatState()
    },

    addChats(chats: Chat[]) {
      chats.forEach(chat => this.addChat(chat))
    },

    updateChat(chat: Chat) {
      this.chats.set(chat.id, chat)
      
      // ✅ Cache after updating chat
      this.cacheChatState()
    },

    removeChat(chatId: string) {
      this.chats.delete(chatId)
      this.chatList = this.chatList.filter(id => id !== chatId)
      this.messages.delete(chatId)
      this.unreadCounts.delete(chatId)
      
      // ✅ Cache after removing chat
      this.cacheChatState()
    },

    setCurrentChat(chatId: string | null) {
      this.currentChatId = chatId
      if (chatId) {
        // Clear unread count
        this.unreadCounts.set(chatId, 0)
      }
      
      // ✅ Cache after setting current chat
      this.cacheChatState()
    },

    // ===== USERS =====
    setOnlineUser(user: User) {
      this.onlineUsers.set(user.id, user)
    },

    removeOnlineUser(userId: string) {
      this.onlineUsers.delete(userId)
    },

    setTypingUser(userId: string, isTyping: boolean) {
      if (isTyping) {
        this.typingUsers.set(userId, {
          userId,
          username: userId,
          roomId: this.currentChatId || ''
        })
      } else {
        this.typingUsers.delete(userId)
      }
    },

    // ===== TRANSLATIONS =====
    addTranslation(translation: Translation) {
      this.translations.set(translation.messageId, translation)
    },

    // ===== GIFTS =====
    addGift(gift: Gift) {
      this.gifts.set(gift.id, gift)
      
      // ✅ Cache after adding gift
      this.cacheChatState()
    },

    setUserBalance(balance: number) {
      this.userBalance = balance
      
      // ✅ Cache after updating balance
      this.cacheChatState()
    },

    // ===== UNREAD COUNTS =====
    setUnreadCount(chatId: string, count: number) {
      this.unreadCounts.set(chatId, count)
      
      // ✅ Cache after updating unread count
      this.cacheChatState()
    },

    incrementUnreadCount(chatId: string) {
      const current = this.unreadCounts.get(chatId) || 0
      this.unreadCounts.set(chatId, current + 1)
      
      // ✅ Cache after incrementing unread count
      this.cacheChatState()
    },

    // ===== LOADING & ERROR =====
    setLoading(loading: boolean) {
      this.isLoading = loading
    },

    setError(error: string | null) {
      this.error = error
      if (error) {
        console.error('[ChatStore] Error:', error)
      }
    },

    // ============================================================================
    // ✅ FIXED: Cache Chat State to localStorage
    // ============================================================================
    cacheChatState() {
      if (!process.client) return

      try {
        const cacheKey = 'chat_state_cache'
        
        // Convert Maps to objects for JSON serialization
        const cacheData = {
          chatList: this.chatList,
          chats: Object.fromEntries(this.chats),
          currentChatId: this.currentChatId,
          userBalance: this.userBalance,
          unreadCounts: Object.fromEntries(this.unreadCounts),
          timestamp: Date.now()
        }

        localStorage.setItem(cacheKey, JSON.stringify(cacheData))
        this.isCached = true
        this.lastCacheTime = Date.now()
        console.log('[ChatStore] ✅ Chat state cached to localStorage')
      } catch (err) {
        console.error('[ChatStore] ❌ Failed to cache chat state:', err)
      }
    },

    // ============================================================================
    // ✅ FIXED: Restore Chat State from localStorage
    // ============================================================================
    restoreChatState() {
      if (!process.client) return

      try {
        const cacheKey = 'chat_state_cache'
        const cached = localStorage.getItem(cacheKey)

        if (cached) {
          const cacheData = JSON.parse(cached)
          
          // Restore chat list
          this.chatList = cacheData.chatList || []
          
          // Restore chats
          if (cacheData.chats) {
            this.chats = new Map(Object.entries(cacheData.chats))
          }
          
          // Restore current chat
          this.currentChatId = cacheData.currentChatId || null
          
          // Restore user balance
          this.userBalance = cacheData.userBalance || 0
          
          // Restore unread counts
          if (cacheData.unreadCounts) {
            this.unreadCounts = new Map(Object.entries(cacheData.unreadCounts))
          }
          
          this.isCached = true
          console.log('[ChatStore] ✅ Chat state restored from cache')
        }
      } catch (err) {
        console.error('[ChatStore] ❌ Failed to restore chat state:', err)
        // Clear corrupted cache
        try {
          localStorage.removeItem('chat_state_cache')
        } catch (e) {
          // Ignore
        }
      }
    },

    // ============================================================================
    // ✅ FIXED: Clear Chat Cache
    // ============================================================================
    clearChatCache() {
      if (!process.client) return

      try {
        localStorage.removeItem('chat_state_cache')
        this.isCached = false
        console.log('[ChatStore] ✅ Chat cache cleared')
      } catch (err) {
        console.error('[ChatStore] ❌ Failed to clear chat cache:', err)
      }
    },

    // ===== RESET =====
    reset() {
      this.messages.clear()
      this.chats.clear()
      this.chatList = []
      this.onlineUsers.clear()
      this.typingUsers.clear()
      this.translations.clear()
      this.gifts.clear()
      this.unreadCounts.clear()
      this.currentChatId = null
      this.isConnected = false
      this.isLoading = false
      this.error = null
      this.userBalance = 0
      
      // ✅ Clear cache
      this.clearChatCache()
      
      console.log('[ChatStore] ✅ Chat store reset')
    }
  }
})
