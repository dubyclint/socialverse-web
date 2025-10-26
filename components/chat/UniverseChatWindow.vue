<template>
  <ClientOnly>
    <div class="chat-window">
      <div class="chat-header">
        <h3>💬 Universe Chat</h3>
        <div class="online-count">{{ onlineUsers }} online</div>
      </div>
      
      <div class="messages-container" ref="messagesContainer">
        <div 
          v-for="message in messages" 
          :key="message.id"
          :class="['message', { own: message.isOwn }]"
        >
          <div class="message-avatar">
            <img :src="message.avatar" :alt="message.username" />
          </div>
          <div class="message-content">
            <div class="message-header">
              <span class="username">{{ message.username }}</span>
              <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
            </div>
            <div class="message-text">{{ message.text }}</div>
          </div>
        </div>
      </div>
      
      <div class="chat-input">
        <input 
          v-model="newMessage" 
          @keyup.enter="sendMessage"
          placeholder="Type your message..."
          class="message-input"
          maxlength="500"
        />
        <button 
          @click="sendMessage" 
          :disabled="!newMessage.trim()" 
          class="send-btn"
        >
          🚀
        </button>
      </div>
      
      <div v-if="gunStatus === 'connecting'" class="status-indicator connecting">
        Connecting to chat network...
      </div>
      <div v-else-if="gunStatus === 'connected'" class="status-indicator connected">
        Connected to Universe Chat
      </div>
      <div v-else-if="gunStatus === 'offline'" class="status-indicator offline">
        Running in offline mode
      </div>
    </div>
    
    <template #fallback>
      <div class="loading-chat">
        <div class="loading-spinner"></div>
        <span>Loading Universe Chat...</span>
      </div>
    </template>
  </ClientOnly>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

// Reactive state
const messages = ref([])
const newMessage = ref('')
const messagesContainer = ref(null)
const onlineUsers = ref(Math.floor(Math.random() * 50) + 10)
const gunStatus = ref('connecting')

// Mock current user
const currentUser = {
  id: 'user_' + Math.random().toString(36).substr(2, 9),
  username: 'User' + Math.floor(Math.random() * 1000),
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + Math.random()
}

// Gun instance (will be loaded dynamically)
let gun = null

onMounted(async () => {
  try {
    // Load Gun.js dynamically only on client with proper error handling
    if (process.client) {
      const { default: Gun } = await import('gun')
      gun = Gun(['https://gun-manhattan.herokuapp.com/gun'])
      
      console.log('Gun.js loaded successfully')
      gunStatus.value = 'connected'
      
      // Listen for new messages from Gun
      gun.get('universe_chat').map().on((data, key) => {
        if (data && data.text && data.timestamp) {
          const messageExists = messages.value.find(m => m.id === key)
          if (!messageExists) {
            messages.value.push({
              id: key,
              ...data,
              isOwn: data.userId === currentUser.id
            })
            // Sort messages by timestamp
            messages.value.sort((a, b) => a.timestamp - b.timestamp)
            scrollToBottom()
          }
        }
      })
      
      // Initialize with welcome message
      setTimeout(() => {
        addSystemMessage("Welcome to Universe Chat! 🚀 Connect with people worldwide!")
      }, 1000)
    }
  } catch (error) {
    console.warn('Gun.js not available, running in offline mode:', error)
    gunStatus.value = 'offline'
    
    // Fallback to offline mode with mock messages
    setTimeout(() => {
      addSystemMessage("Welcome to Universe Chat!")
      addSystemMessage("Currently running in offline mode. Your messages will be visible to you only.")
    }, 1000)
  }
})

const addSystemMessage = (text) => {
  const message = {
    id: Date.now() + Math.random(),
    text,
    username: 'System',
    userId: 'system',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=system',
    timestamp: Date.now(),
    isOwn: false
  }
  
  messages.value.push(message)
  scrollToBottom()
}

const sendMessage = () => {
  if (!newMessage.value.trim()) return

  const messageData = {
    id: Date.now() + Math.random(),
    text: newMessage.value.trim(),
    username: currentUser.username,
    userId: currentUser.id,
    avatar: currentUser.avatar,
    timestamp: Date.now(),
    isOwn: true
  }

  // Add message to local state immediately
  messages.value.push(messageData)
  
  if (gun && gunStatus.value === 'connected') {
    // Send to Gun.js network if available
    try {
      gun.get('universe_chat').set(messageData)
    } catch (error) {
      console.warn('Failed to send message to Gun network:', error)
    }
  }
  
  newMessage.value = ''
  scrollToBottom()
  
  // Mock response in offline mode
  if (gunStatus.value === 'offline') {
    setTimeout(() => {
      if (Math.random() > 0.6) {
        const responses = [
          "Thanks for your message! 👍",
          "That's interesting! 🤔",
          "Nice to meet you! 😊",
          "How's your day going? ✨",
          "Welcome to the chat! 🎉"
        ]
        addSystemMessage(responses[Math.floor(Math.random() * responses.length)])
      }
    }, 1000 + Math.random() * 2000)
  }
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}
</script>

<style scoped>
/* ... keep all existing styles ... */
.chat-window {
  display: flex;
  flex-direction: column;
  height: 500px;
  border: 1px solid #e1e5e9;
  border-radius: 12px;
  background: white;
  overflow: hidden;
  position: relative;
}

.loading-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 500px;
  border: 1px solid #e1e5e9;
  border-radius: 12px;
  background: #f8fafc;
  color: #667eea;
  font-weight: 500;
  gap: 16px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e1e5e9;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* ... include all other existing styles ... */
</style>

