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
    messages: new Map<string, ChatMessage[]>(),
    chats: new Map<string, Chat>(),
    chatList: [] as string[],
    onlineUsers: new Map<string, User>(),
    typingUsers: new Map<string, TypingUser>(),
    translations: new Map<string, Translation>(),
    gifts: new Map<string, Gift>(),
    userBalance: 0,
    currentChatId: null as string | null,
    isConnected: false,
    isLoading: false,
    error: null as string | null,
    unreadCounts: new Map<string, number>(),
    isCached: false,
    lastCacheTime: 0
  }),

  getters: {
    currentChatMessages: (state) => {
      if (!state.currentChatId) return []
      return state.messages.get(state.currentChatId) || []
    },

    sortedChats: (state) => {
      return state.chatList
        .map(id => state.chats.get(id))
        .filter(Boolean)
        .sort((a, b) => {
          if (a?.isPinned !== b?.isPinned) {
            return (b?.isPinned ? 1 : 0) - (a?.isPinned ? 1 : 0)
          }
          return (b?.lastMessageTime || 0) - (a?.lastMessageTime || 0)
        })
    },

    totalUnreadCount: (state) => {
      let total = 0
      state.unreadCounts.forEach(count => {
        total += count
      })
      return total
    },

    onlineUsersCount: (state) => {
      return state.onlineUsers.size
    },

    currentChatTypingUsers: (state) => {
      if (!state.currentChatId) return []
      return Array.from(state.typingUsers.values()).filter(
        user => user.roomId === state.currentChatId
      )
    },

    currentChatTranslations: (state) => {
      if (!state.currentChatId) return []
      const messages = state.messages.get(state.currentChatId) || []
      return messages
        .map(msg => state.translations.get(msg.id))
        .filter(Boolean)
    },

    currentChatGifts: (state) => {
      if (!state.currentChatId) return []
      return Array.from(state.gifts.values()).filter(
        gift => gift.messageId && state.messages.get(state.currentChatId)?.some(m => m.id === gift.messageId)
      )
    }
  },

  actions: {
    setConnected(connected: boolean) {
      this.isConnected = connected
      console.log('[ChatStore] Connection status:', connected ? '✅ Connected' : '❌ Disconnected')
    },

    addMessage(message: ChatMessage) {
      if (!this.messages.has(message.chatId)) {
        this.messages.set(message.chatId, [])
      }
      const messages = this.messages.get(message.chatId)!
      
      if (!messages.find(m => m.id === message.id)) {
        messages.push(message)
        messages.sort((a, b) => a.timestamp - b.timestamp)
      }
      
      this.cacheChatState()
    },

    addMessages(chatId: string, messages: ChatMessage[]) {
      this.messages.set(chatId, messages.sort((a, b) => a.timestamp - b.timestamp))
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
      
      this.cacheChatState()
    },

    deleteMessage(messageId: string) {
      this.messages.forEach(messages => {
        const index = messages.findIndex(m => m.id === messageId)
        if (index !== -1) {
          messages[index].isDeleted = true
        }
      })
      
      this.cacheChatState()
    },

    clearMessages(chatId: string) {
      this.messages.delete(chatId)
      this.cacheChatState()
    },

    addChat(chat: Chat) {
      this.chats.set(chat.id, chat)
      if (!this.chatList.includes(chat.id)) {
        this.chatList.push(chat.id)
      }
      
      this.cacheChatState()
    },

    addChats(chats: Chat[]) {
      chats.forEach(chat => this.addChat(chat))
    },

    updateChat(chat: Chat) {
      this.chats.set(chat.id, chat)
      this.cacheChatState()
    },

    removeChat(chatId: string) {
      this.chats.delete(chatId)
      this.chatList = this.chatList.filter(id => id !== chatId)
      this.messages.delete(chatId)
      this.unreadCounts.delete(chatId)
      
      this.cacheChatState()
    },

    setCurrentChat(chatId: string | null) {
      this.currentChatId = chatId
      if (chatId) {
        this.unreadCounts.set(chatId, 0)
      }
      
      this.cacheChatState()
    },

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

    addTranslation(translation: Translation) {
      this.translations.set(translation.messageId, translation)
    },

    addGift(gift: Gift) {
      this.gifts.set(gift.id, gift)
      this.cacheChatState()
    },

    setUserBalance(balance: number) {
      this.userBalance = balance
      this.cacheChatState()
    },

    setUnreadCount(chatId: string, count: number) {
      this.unreadCounts.set(chatId, count)
      this.cacheChatState()
    },

    incrementUnreadCount(chatId: string) {
      const current = this.unreadCounts.get(chatId) || 0
      this.unreadCounts.set(chatId, current + 1)
      this.cacheChatState()
    },

    setLoading(loading: boolean) {
      this.isLoading = loading
    },

    setError(error: string | null) {
      this.error = error
      if (error) {
        console.error('[ChatStore] Error:', error)
      }
    },

    cacheChatState() {
      if (!process.client) return

      try {
        const cacheKey = 'chat_state_cache'
        
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

    restoreChatState() {
      if (!process.client) return

      try {
        const cacheKey = 'chat_state_cache'
        const cached = localStorage.getItem(cacheKey)

        if (cached) {
          const cacheData = JSON.parse(cached)
          
          this.chatList = cacheData.chatList || []
          
          if (cacheData.chats) {
            this.chats = new Map(Object.entries(cacheData.chats))
          }
          
          this.currentChatId = cacheData.currentChatId || null
          this.userBalance = cacheData.userBalance || 0
          
          if (cacheData.unreadCounts) {
            this.unreadCounts = new Map(Object.entries(cacheData.unreadCounts))
          }
          
          this.isCached = true
          console.log('[ChatStore] ✅ Chat state restored from cache')
        }
      } catch (err) {
        console.error('[ChatStore] ❌ Failed to restore chat state:', err)
        try {
          localStorage.removeItem('chat_state_cache')
        } catch (e) {
          // Ignore
        }
      }
    },

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
      
      this.clearChatCache()
      
      console.log('[ChatStore] ✅ Chat store reset')
    }
  }
})
