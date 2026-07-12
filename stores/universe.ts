// stores/universe.ts
import { defineStore } from 'pinia'
import { universeService } from '~/services/universeService'

export const useUniverseStore = defineStore('universe', {
  state: () => ({
    messages: [] as UniverseMessage[],
    // ... keep other states like onlineUsers, filters
  }),

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
    }
  }
})
