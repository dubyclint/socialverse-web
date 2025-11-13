<template>
  <div class="universe-chat">
    <!-- Filters -->
    <div class="filters">
      <select v-model="filters.country" @change="applyFilters">
        <option value="">All Countries</option>
        <!-- Add countries -->
      </select>
      <select v-model="filters.interest" @change="applyFilters">
        <option value="">All Interests</option>
        <!-- Add interests -->
      </select>
      <select v-model="filters.language" @change="applyFilters">
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <!-- Add languages -->
      </select>
    </div>

    <!-- Messages -->
    <UniverseChatWindow 
      :messages="universeStore.filteredMessages"
      :onlineCount="universeStore.onlineCount"
      :matchedUsers="universeStore.matchedUsers"
      @send-message="sendMessage"
      @like-message="likeMessage"
      @add-reaction="addReaction"
      @translate-message="translateMessage"
      @send-gift="sendGift"
    />

    <!-- Input -->
    <div class="message-input">
      <input 
        v-model="messageContent"
        @keyup.enter="sendMessage"
        placeholder="Type a message..."
      />
      <button @click="sendMessage">Send</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useUniverseStore } from '~/stores/universe'
import { useSocket } from '~/composables/use-socket'


const universeStore = useUniverseStore()
const { socket } = useSocket()
const messageContent = ref('')
const filters = ref({
  country: undefined,
  interest: undefined,
  language: 'en'
})

onMounted(() => {
  // Join universe
  socket?.emit('universe:join', filters.value)
  
  // Listen for messages
  socket?.on('universe:message', (message) => {
    universeStore.addMessage(message)
  })
  
  socket?.on('universe:online-count', (data) => {
    universeStore.setOnlineCount(data.count)
  })
  
  socket?.on('universe:matched-users', (data) => {
    universeStore.setMatchedUsers(data.users)
  })
})

onUnmounted(() => {
  socket?.emit('universe:leave', {})
})

const sendMessage = () => {
  if (!messageContent.value.trim()) return
  
  socket?.emit('universe:send-message', {
    content: messageContent.value,
    ...filters.value
  })
  
  messageContent.value = ''
}

const likeMessage = (messageId: string) => {
  socket?.emit('universe:like-message', { messageId })
  universeStore.likeMessage(messageId)
}

const addReaction = (messageId: string, emoji: string) => {
  socket?.emit('universe:add-reaction', { messageId, emoji })
  universeStore.addReaction(messageId, emoji)
}

const translateMessage = (messageId: string, text: string, targetLang: string) => {
  socket?.emit('universe:translate-message', { messageId, text, targetLang })
}

const sendGift = (recipientId: string, giftId: string, amount: number, message: string, messageId: string) => {
  socket?.emit('universe:send-gift', { recipientId, giftId, giftAmount: amount, message, messageId })
}

const applyFilters = () => {
  universeStore.setFilters(filters.value)
  socket?.emit('universe:filter-messages', filters.value)
}
</script>

<style scoped>
.universe-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.filters {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.filters select {
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
}

.message-input {
  display: flex;
  gap: 8px;
  padding: 16px;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.message-input input {
  flex: 1;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
}

.message-input button {
  padding: 12px 24px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.message-input button:hover {
  background: #1976d2;
}
</style>
