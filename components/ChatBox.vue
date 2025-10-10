<template>
  <div class="chat-container">
    <div class="chat-header">
      <h3>💬 Real-time Chat</h3>
      <div class="connection-status">
        <span class="status-indicator connected"></span>
        Connected via Gun.js
      </div>
    </div>

    <!-- Messages Area -->
    <div class="messages-container" ref="messagesContainer">
      <div v-for="message in sortedMessages" :key="message.id" class="message-item">
        <img :src="message.avatar" :alt="message.sender" class="message-avatar" />
        <div class="message-content">
          <div class="message-header">
            <strong class="sender-name">{{ message.sender }}</strong>
            <span class="message-time">{{ formatTime(message.timestamp) }}</span>
          </div>
          <p class="message-text">{{ message.text }}</p>
        </div>
      </div>
    </div>

    <!-- Message Input -->
    <div class="message-input-container">
      <input
        v-model="newMessage"
        @keyup.enter="sendMessage"
        placeholder="Type your message..."
        class="message-input"
      />
      <button @click="sendMessage" class="send-button">
        Send
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { gun } from '~/gundb/client'

const messages = ref([])
const newMessage = ref('')
const messagesContainer = ref()

// Generate a user for demo
const currentUser = {
  id: 'user_' + Math.random().toString(36).substr(2, 9),
  name: 'User' + Math.floor(Math.random() * 1000),
  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`
}

const sortedMessages = computed(() => {
  return messages.value.sort((a, b) => a.timestamp - b.timestamp)
})

onMounted(() => {
  // Listen for new messages
  gun.get('realtime_chat').map().on((msg, id) => {
    if (msg && msg.text && msg.timestamp) {
      const existingMessage = messages.value.find(m => m.id === id)
      if (!existingMessage) {
        messages.value.push({ 
          id, 
          ...msg,
          avatar: msg.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender}`
        })
        
        // Auto-scroll to bottom
        nextTick(() => {
          if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
          }
        })
      }
    }
  })
})

const sendMessage = () => {
  if (!newMessage.value.trim()) return
  
  gun.get('realtime_chat').set({
    sender: currentUser.name,
    text: newMessage.value,
    timestamp: Date.now(),
    avatar: currentUser.avatar,
    userId: currentUser.id
  })
  
  newMessage.value = ''
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}
</script>

<style scoped>
/* Same styles as before */
.chat-container {
  max-width: 800px;
  height: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #fafafa;
}

.message-item {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  background: white;
  padding: 0.75rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.message-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.sender-name {
  color: #2563eb;
  font-size: 0.9rem;
  font-weight: 600;
}

.message-time {
  color: #9ca3af;
  font-size: 0.75rem;
}

.message-text {
  color: #374151;
  margin: 0;
  word-wrap: break-word;
}

.message-input-container {
  display: flex;
  padding: 1rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  gap: 0.5rem;
}

.message-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
}

.message-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.send-button {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.send-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
</style>

