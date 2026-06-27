// stores/universe.ts - UNIVERSE CHAT STATE MANAGEMENT
// ====================================================

import { defineStore } from 'pinia'

export interface UniverseMessage {
  id: string
  userId: string
  username: string
  avatar?: string
  isVerified: boolean
  rank?: string
  content: string
  country?: string
  interest?: string
  language: string
  timestamp: string
  likes: number
  replies: number
  reactions: Record<string, number>
  translated?: boolean
  translatedText?: string
  targetLanguage?: string
}

export interface UniverseUser {
  id: string
  username: string
  avatar?: string
  isVerified: boolean
  rank?: string
  matchScore?: number
  commonInterests?: number
}

export interface UniverseFilter {
  country?: string
  interest?: string
  language: string
}

export const useUniverseStore = defineStore('universe', {
  state: () => ({
    // Messages
    messages: [] as UniverseMessage[],
    
    // Users
    onlineUsers: [] as UniverseUser[],
    matchedUsers: [] as UniverseUser[],
    
    // Filters
    filters: {
      country: undefined,
      interest: undefined,
      language: 'en'
    } as UniverseFilter,
    
    // UI State
    isConnected: false,
    isLoading: false,
    error: null as string | null,
    onlineCount: 0,
    
    // User preferences
    userPreferences: {
      country: undefined,
      interest: undefined,
      language: 'en'
    }
  }),

  getters: {
    // Get filtered messages
    filteredMessages: (state) => {
      return state.messages.filter(msg => {
        if (state.filters.country && msg.country !== state.filters.country) return false
        if (state.filters.interest && msg.interest !== state.filters.interest) return false
        if (state.filters.language && msg.language !== state.filters.language) return false
        return true
      })
    },

    // Get sorted messages (newest first)
    sortedMessages: (state) => {
      return [...state.messages].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    },

    // Get message count
    messageCount: (state) => state.messages.length,

    // Get matched users count
    matchedUsersCount: (state) => state.matchedUsers.length
  },

  actions: {
    // ===== CONNECTION =====
    setConnected(connected: boolean) {
      this.isConnected = connected
    },

    setOnlineCount(count: number) {
      this.onlineCount = count
    },

    // ===== MESSAGES =====
    addMessage(message: UniverseMessage) {
      // Prevent duplicates
      if (!this.messages.find(m => m.id === message.id)) {
        this.messages.push(message)
      }
    },

    addMessages(messages: UniverseMessage[]) {
      messages.forEach(msg => this.addMessage(msg))
    },

    updateMessage(messageId: string, updates: Partial<UniverseMessage>) {
      const index = this.messages.findIndex(m => m.id === messageId)
      if (index !== -1) {
        this.messages[index] = { ...this.messages[index], ...updates }
      }
    },

    likeMessage(messageId: string) {
      const message = this.messages.find(m => m.id === messageId)
      if (message) {
        message.likes += 1
      }
    },

    addReaction(messageId: string, emoji: string) {
      const message = this.messages.find(m => m.id === messageId)
      if (message) {
        message.reactions[emoji] = (message.reactions[emoji] || 0) + 1
      }
    },

    translateMessage(messageId: string, translatedText: string, targetLanguage: string) {
      const message = this.messages.find(m => m.id === messageId)
      if (message) {
        message.translated = true
        message.translatedText = translatedText
        message.targetLanguage = targetLanguage
      }
    },

    clearMessages() {
      this.messages = []
    },

    // ===== USERS =====
    setOnlineUsers(users: UniverseUser[]) {
      this.onlineUsers = users
    },

    setMatchedUsers(users: UniverseUser[]) {
      this.matchedUsers = users
    },

    addOnlineUser(user: UniverseUser) {
      if (!this.onlineUsers.find(u => u.id === user.id)) {
        this.onlineUsers.push(user)
      }
    },

    removeOnlineUser(userId: string) {
      this.onlineUsers = this.onlineUsers.filter(u => u.id !== userId)
    },

    // ===== FILTERS =====
    setFilters(filters: Partial<UniverseFilter>) {
      this.filters = { ...this.filters, ...filters }
    },

    setUserPreferences(preferences: Partial<UniverseFilter>) {
      this.userPreferences = { ...this.userPreferences, ...preferences }
    },

    resetFilters() {
      this.filters = {
        country: undefined,
        interest: undefined,
        language: 'en'
      }
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
      this.messages = []
      this.onlineUsers = []
      this.matchedUsers = []
      this.filters = {
        country: undefined,
        interest: undefined,
        language: 'en'
      }
      this.isConnected = false
      this.isLoading = false
      this.error = null
      this.onlineCount = 0
    }
  }
})
