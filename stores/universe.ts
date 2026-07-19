// stores/universe.ts
import { defineStore } from 'pinia'
import { universeService } from '~/services/universeService'
import type { UniverseMessage, UniverseMatchedUser } from '~/types/universe'

export const useUniverseStore = defineStore('universe', {
  state: () => ({
    messages: [] as UniverseMessage[],
    onlineCount: 0,
    unreadCount: 0,
    matchedUsers: [] as UniverseMatchedUser[],
    searchQuery: ''
  }),

  getters: {
    filteredMessages(state): UniverseMessage[] {
      const q = state.searchQuery.trim().toLowerCase()
      if (!q) return state.messages
      return state.messages.filter(m => m.content.toLowerCase().includes(q))
    }
  },

  actions: {
    // Delegation: Only orchestration logic remains here
    async initConnection() {
      const { data } = await universeService.getMessageHistory()
      if (data) this.addMessages(data)
      
      universeService.subscribeToUniverse((msg) => {
        this.addMessage(msg)
      })
    },

    addMessages(messages: UniverseMessage[]) {
      this.messages = [...this.messages, ...messages]
    },

    addMessage(message: UniverseMessage) {
      this.messages.push(message)
    },

    // UI-Specific actions (like local filters or reactions) remain here
    likeMessage(messageId: string) {
       const message = this.messages.find(m => m.id === messageId)
       if (message) message.likes += 1
       // Trigger async update to backend if needed
    },

    searchMessages(query: string) {
      this.searchQuery = query
    },

    addReaction(messageId: string, emoji: string) {
      const message = this.messages.find(m => m.id === messageId)
      if (!message) return
      if (!message.reactions) message.reactions = {}
      message.reactions[emoji] = (message.reactions[emoji] ?? 0) + 1
    },

    async loadMoreMessages() {
      const { data } = await universeService.getMessageHistory()
      if (data) this.addMessages(data)
    },

    setOnlineCount(count: number) {
      this.onlineCount = count
    },

    setMatchedUsers(users: UniverseMatchedUser[]) {
      this.matchedUsers = users
    }
  }
})
