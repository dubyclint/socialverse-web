<template>
  <div class="trade-chat">
    <h3>Trade Chat</h3>
    <div class="messages">
      <div v-for="msg in messages" :key="msg.id" class="message">
        <strong>{{ msg.sender }}:</strong> {{ msg.text }}
        <span class="timestamp">{{ formatTime(msg.timestamp) }}</span>
      </div>
    </div>
    <div class="input-area">
      <input 
        v-model="newMessage" 
        @keyup.enter="sendMessage" 
        placeholder="Type a message..." 
        class="message-input"
      />
      <button @click="sendMessage" class="send-btn">Send</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const messages = ref([])
const newMessage = ref('')
const tradeId = 'trade123'
const user = 'Paul'

onMounted(() => {
  // Load initial messages from localStorage or API
  const savedMessages = localStorage.getItem(`trade_${tradeId}`)
  if (savedMessages) {
    messages.value = JSON.parse(savedMessages)
  }
})

function sendMessage() {
  if (!newMessage.value.trim()) return
  
  const msg = {
    id: Date.now(),
    sender: user,
    text: newMessage.value,
    timestamp: Date.now()
  }
  
  messages.value.push(msg)
  
  // Save to localStorage
  localStorage.setItem(`trade_${tradeId}`, JSON.stringify(messages.value))
  
  newMessage.value = ''
}

function formatTime(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.trade-chat {
  border: 1px solid #aaa;
  padding: 1rem;
  border-radius: 8px;
  background: #f9f9f9;
  display: flex;
  flex-direction: column;
  height: 400px;
}

.trade-chat h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #333;
}

.messages {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.message {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 0.95rem;
  line-height: 1.4;
}

.message strong {
  color: #333;
  display: block;
  margin-bottom: 0.25rem;
}

.timestamp {
  display: block;
  font-size: 0.75rem;
  color: #999;
  margin-top: 0.25rem;
}

.input-area {
  display: flex;
  gap: 0.5rem;
}

.message-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
  font-family: inherit;
}

.message-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
}

.send-btn {
  padding: 0.75rem 1.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.send-btn:hover {
  background: #0056b3;
}

.send-btn:active {
  background: #004085;
}
</style>
