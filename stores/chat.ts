// stores/chat.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { chatService } from '~/services/chatService'
import { chatCacheService } from '~/services/chatCacheService'
import type { ChatMessage, Chat, User, Translation, Gift, TypingUser } from '~/types/chat'

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
    isCached: false
  }),

  getters: {
    currentChatMessages: (state) => state.currentChatId ? (state.messages.get(state.currentChatId) || []) : [],
    onlineUsersCount: (state) => state.onlineUsers.size,
    currentChatTypingUsers: (state) => Array.from(state.typingUsers.values()),
    currentChatTranslations: (state) => Array.from(state.translations.values()),
    currentChatGifts: (state) => Array.from(state.gifts.values()),
    sortedChats: (state) => state.chatList
      .map(id => state.chats.get(id))
      .filter((c): c is Chat => !!c)
      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || (b.lastMessageTime || 0) - (a.lastMessageTime || 0)),
    totalUnreadCount: (state) => Array.from(state.unreadCounts.values()).reduce((a, b) => a + b, 0)
  },

  actions: {
    // --- Data Persistence ---
    async cacheChatState() {
      chatCacheService.save('chat_state_cache', {
        chatList: this.chatList,
        chats: Object.fromEntries(this.chats),
        currentChatId: this.currentChatId,
        userBalance: this.userBalance,
        unreadCounts: Object.fromEntries(this.unreadCounts)
      })
      this.isCached = true
    },

    async restoreChatState() {
      const cached = chatCacheService.load('chat_state_cache')
      if (!cached) return
      this.chatList = cached.chatList || []
      this.chats = new Map(Object.entries(cached.chats))
      this.currentChatId = cached.currentChatId
      this.userBalance = cached.userBalance
      this.unreadCounts = new Map(Object.entries(cached.unreadCounts))
      this.isCached = true
    },

    // --- Network Actions (Delegated to Services) ---
    async loadMessages(chatId: string) {
      this.isLoading = true
      try {
        const messages = await chatService.getMessages(chatId)
        this.addMessages(chatId, messages)
      } catch (err: any) {
        this.error = err.message
      } finally {
        this.isLoading = false
      }
    },

    async sendMessage(chatId: string, content: string) {
      return await chatService.sendMessage(chatId, content)
    },

    // --- State Mutations ---
    addMessage(message: ChatMessage) {
      // message.chatId can be undefined in some edge cases; guard it so TS and runtime are safe
      const chatId = message.chatId as string | undefined
      if (!chatId) {
        // ignore malformed messages that lack a chatId
        return
      }
      const msgs = this.messages.get(chatId) || []
      this.messages.set(chatId, [...msgs, message].sort((a, b) => a.timestamp - b.timestamp))
      this.cacheChatState()
    },

    addMessages(chatId: string, messages: ChatMessage[]) {
      this.messages.set(chatId, messages.sort((a, b) => a.timestamp - b.timestamp))
      this.cacheChatState()
    },

    setLoading(value: boolean) {
      this.isLoading = value
    },

    setError(message: string | null) {
      this.error = message
    },

    setCurrentChat(chatId: string | null) {
      this.currentChatId = chatId
    },

    updateUserBalance(delta: number) {
      this.userBalance += delta
    },

    addChat(chat: Chat) {
      this.chats.set(chat.id, chat)
      if (!this.chatList.includes(chat.id)) this.chatList = [chat.id, ...this.chatList]
      this.cacheChatState()
    },

    addChats(chats: Chat[]) {
      for (const chat of chats) {
        this.chats.set(chat.id, chat)
        if (!this.chatList.includes(chat.id)) this.chatList.push(chat.id)
      }
      this.cacheChatState()
    },

    updateMessage(chatId: string, messageId: string, patch: Partial<ChatMessage>) {
      const msgs = this.messages.get(chatId)
      if (!msgs) return
      this.messages.set(
        chatId,
        msgs.map(m => (m.id === messageId ? { ...m, ...patch } : m))
      )
    },

    reset() {
      this.$reset()
      chatCacheService.remove('chat_state_cache')
    }
  }
})

export const recentEmojis = ref<string[]>(JSON.parse(localStorage.getItem('recentEmojis') || '[]'))
export const addRecentEmoji = (emoji: string) => {
  recentEmojis.value = [emoji, ...recentEmojis.value.filter(e => e !== emoji)].slice(0, 20)
  localStorage.setItem('recentEmojis', JSON.stringify(recentEmojis.value))
}

// Add a map for trade-specific drafts or history
export const tradeMessages = ref<Record<string, any[]>>({})
export const saveTradeMessages = (id: string, msgs: any[]) => {
  tradeMessages.value[id] = msgs
  localStorage.setItem(`trade_${id}`, JSON.stringify(msgs))
}
