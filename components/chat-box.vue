<template>
  <div class="chat-container" :style="{ backgroundImage: `url(${userBackgroundImage})` }">
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
        <div class="message-content-wrapper">
          <div 
            class="message-content" 
            :class="{ 
              'own-message': message.userId === currentUser.id,
              'other-message': message.userId !== currentUser.id 
            }"
          >
            <div class="message-header">
              <strong class="sender-name">{{ message.sender }}</strong>
              <span class="message-time">{{ formatTime(message.timestamp) }}</span>
            </div>
            <p class="message-text">{{ message.text }}</p>
            
            <!-- Message Status -->
            <div class="message-status" v-if="message.userId === currentUser.id">
              <span v-if="message.status === 'typing'" class="status-typing">✏️</span>
              <span v-else-if="message.status === 'sent'" class="status-sent">✓</span>
              <span v-else-if="message.status === 'delivered'" class="status-delivered">✓✓</span>
            </div>
          </div>
          
          <!-- PewGift Button -->
          <div class="pewgift-container">
            <button 
              @click="sendPewGift(message.userId, message.id)"
              class="pewgift-button"
              :disabled="message.userId === currentUser.id"
              title="Send PewGift"
            >
              💎
            </button>
          </div>
        </div>
      </div>
      
      <!-- Typing Indicator -->
      <div v-if="showTypingIndicator" class="typing-indicator">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span class="typing-text">Someone is typing...</span>
      </div>
    </div>

    <!-- Message Input -->
    <div class="message-input-container">
      <input
        v-model="newMessage"
        @keyup.enter="sendMessage"
        @input="handleTyping"
        placeholder="Type your message..."
        class="message-input"
      />
      <button @click="sendMessage" class="send-button">
        Send
      </button>
    </div>

    <!-- PewGift Modal -->
    <div v-if="showPewGiftModal" class="pewgift-modal-overlay" @click="closePewGiftModal">
      <div class="pewgift-modal" @click.stop>
        <h3>Send PewGift</h3>
        <p>Minimum: 1.2 USDT worth of PEW</p>
        <p>Transaction fee: 1% (0.5% sender + 0.5% receiver)</p>
        <div class="pewgift-actions">
          <button @click="confirmPewGift" class="confirm-btn">Send Gift 💎</button>
          <button @click="closePewGiftModal" class="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Insufficient Balance Modal -->
    <div v-if="showInsufficientModal" class="insufficient-modal-overlay" @click="closeInsufficientModal">
      <div class="insufficient-modal" @click.stop>
        <h3>❌ Insufficient PEW Balance</h3>
        <p>You need at least 1.3 USDT worth of PEW to send a gift.</p>
        <button @click="closeInsufficientModal" class="ok-btn">OK</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed, onUnmounted } from 'vue'
import { gun } from '~/gundb/client'

const messages = ref([])
const newMessage = ref('')
const messagesContainer = ref()
const showTypingIndicator = ref(false)
const typingTimeout = ref(null)
const showPewGiftModal = ref(false)
const showInsufficientModal = ref(false)
const selectedMessageId = ref(null)
const selectedRecipientId = ref(null)

// User configuration
const currentUser = {
  id: 'user_' + Math.random().toString(36).substr(2, 9),
  name: 'User' + Math.floor(Math.random() * 1000),
  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
  pewBalance: 15.5 // Example balance in USDT equivalent
}

// Custom background image (can be user-specific)
const userBackgroundImage = ref('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23667eea;stop-opacity:0.1" /><stop offset="100%" style="stop-color:%23764ba2;stop-opacity:0.1" /></linearGradient></defs><rect width="100" height="100" fill="url(%23grad)" /></svg>')

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
          status: 'delivered',
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

  // Listen for typing indicators
  gun.get('chat_typing').on((data) => {
    if (data && data.userId !== currentUser.id) {
      showTypingIndicator.value = true
      setTimeout(() => {
        showTypingIndicator.value = false
      }, 3000)
    }
  })
})

const sendMessage = () => {
  if (!newMessage.value.trim()) return
  
  const messageData = {
    sender: currentUser.name,
    text: newMessage.value,
    timestamp: Date.now(),
    avatar: currentUser.avatar,
    userId: currentUser.id,
    status: 'sent'
  }
  
  gun.get('realtime_chat').set(messageData)
  
  // Update status to delivered after a short delay
  setTimeout(() => {
    messageData.status = 'delivered'
  }, 1000)
  
  newMessage.value = ''
}

const handleTyping = () => {
  // Send typing indicator
  gun.get('chat_typing').put({
    userId: currentUser.id,
    timestamp: Date.now()
  })
  
  // Clear previous timeout
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }
  
  // Set new timeout to stop typing indicator
  typingTimeout.value = setTimeout(() => {
    gun.get('chat_typing').put(null)
  }, 1000)
}

const sendPewGift = (recipientId, messageId) => {
  if (currentUser.pewBalance < 1.3) {
    showInsufficientModal.value = true
    return
  }
  
  selectedRecipientId.value = recipientId
  selectedMessageId.value = messageId
  showPewGiftModal.value = true
}

const confirmPewGift = async () => {
  try {
    // Calculate amounts
    const giftAmount = 1.2 // USDT equivalent
    const senderFee = giftAmount * 0.005 // 0.5%
    const receiverFee = giftAmount * 0.005 // 0.5%
    const totalDeduction = giftAmount + senderFee
    
    // Simulate API call to process PewGift
    const response = await fetch('/api/pewgift/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        senderId: currentUser.id,
        recipientId: selectedRecipientId.value,
        messageId: selectedMessageId.value,
        amount: giftAmount,
        senderFee: senderFee,
        receiverFee: receiverFee
      })
    })
    
    if (response.ok) {
      // Update local balance
      currentUser.pewBalance -= totalDeduction
      
      // Show success message
      gun.get('realtime_chat').set({
        sender: 'System',
        text: `💎 PewGift sent! ${giftAmount} USDT worth of PEW transferred.`,
        timestamp: Date.now(),
        avatar: '💎',
        userId: 'system',
        status: 'delivered'
      })
    }
    
    closePewGiftModal()
  } catch (error) {
    console.error('PewGift error:', error)
    closePewGiftModal()
  }
}

const closePewGiftModal = () => {
  showPewGiftModal.value = false
  selectedRecipientId.value = null
  selectedMessageId.value = null
}

const closeInsufficientModal = () => {
  showInsufficientModal.value = false
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

onUnmounted(() => {
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }
})
</script>

<style scoped>
.chat-container {
  max-width: 800px;
  height: 600px;
  margin: 0 auto;
  background: white;
  background-size: cover;
  background-position: center;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.chat-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  z-index: 1;
}

.chat-container > * {
  position: relative;
  z-index: 2;
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
  background: rgba(250, 250, 250, 0.8);
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

.message-content-wrapper {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
}

.message-content {
  flex: 1;
  padding: 0.75rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
}

.own-message {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin-left: 2rem;
}

.other-message {
  background: white;
  color: #374151;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.sender-name {
  font-size: 0.9rem;
  font-weight: 600;
}

.own-message .sender-name {
  color: rgba(255, 255, 255, 0.9);
}

.other-message .sender-name {
  color: #2563eb;
}

.message-time {
  font-size: 0.75rem;
  opacity: 0.7;
}

.message-text {
  margin: 0;
  word-wrap: break-word;
}

.message-status {
  position: absolute;
  bottom: 0.25rem;
  right: 0.5rem;
  font-size: 0.7rem;
}

.status-typing {
  color: #f59e0b;
}

.status-sent {
  color: #9ca3af;
}

.status-delivered {
  color: #10b981;
}

.pewgift-container {
  display: flex;
  align-items: center;
}

.pewgift-button {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pewgift-button:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(251, 191, 36, 0.3);
}

.pewgift-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  align-self: flex-start;
}

.typing-dots {
  display: flex;
  gap: 0.2rem;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #667eea;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.typing-text {
  font-size: 0.8rem;
  color: #6b7280;
  font-style: italic;
}

.message-input-container {
  display: flex;
  padding: 1rem;
  background: rgba(248, 250, 252, 0.9);
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
  background: rgba(255, 255, 255, 0.9);
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
  transition: all 0.2s ease;
}

.send-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* Modal Styles */
.pewgift-modal-overlay,
.insufficient-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.pewgift-modal,
.insufficient-modal {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 90%;
}

.pewgift-modal h3,
.insufficient-modal h3 {
  margin: 0 0 1rem 0;
  color: #374151;
}

.pewgift-modal p,
.insufficient-modal p {
  margin: 0.5rem 0;
  color: #6b7280;
}

.pewgift-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.confirm-btn {
  flex: 1;
  padding: 0.75rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.cancel-btn,
.ok-btn {
  flex: 1;
  padding: 0.75rem;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.confirm-btn:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

.cancel-btn:hover,
.ok-btn:hover {
  background: #4b5563;
}
</style>
