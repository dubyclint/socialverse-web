<template>
  <ClientOnly>
    <div class="universe-chat-window">
      <div class="chat-header">
        <h3>💬 Universe Chat</h3>
        <div class="header-info">
          <span class="online-count">{{ onlineUsers }} online</span>
          <div :class="['status-indicator', gunStatus]">
            {{ statusText }}
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="chat-filters">
        <select v-model="selectedCountry" class="filter-select">
          <option value="">All Countries</option>
          <option value="US">United States</option>
          <option value="UK">United Kingdom</option>
          <option value="CA">Canada</option>
          <option value="AU">Australia</option>
          <option value="IN">India</option>
          <option value="BR">Brazil</option>
        </select>

        <select v-model="selectedInterest" class="filter-select">
          <option value="">All Interests</option>
          <option value="tech">Technology</option>
          <option value="gaming">Gaming</option>
          <option value="music">Music</option>
          <option value="sports">Sports</option>
          <option value="travel">Travel</option>
          <option value="art">Art</option>
        </select>

        <select v-model="selectedLanguage" class="filter-select">
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="zh">Chinese</option>
          <option value="ja">Japanese</option>
        </select>

        <button @click="applyFilters" class="filter-btn">
          🔍 Filter
        </button>
      </div>

      <!-- Messages Container -->
      <div class="messages-container" ref="messagesContainer">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <span>Loading messages...</span>
        </div>

        <div v-else-if="messages.length === 0" class="empty-state">
          <span>No messages yet. Be the first to say something! 🚀</span>
        </div>

        <div v-else>
          <div
            v-for="message in messages"
            :key="message.id"
            :class="['message-item', { 'own-message': message.user_id === currentUserId }]"
          >
            <div class="message-avatar">
              <img
                :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=${message.user_id}`"
                :alt="message.username || 'User'"
                class="avatar-img"
              />
            </div>

            <div class="message-content">
              <div class="message-header">
                <span class="username">{{ message.username || 'Anonymous' }}</span>
                <span class="timestamp">{{ formatTime(message.created_at) }}</span>
              </div>

              <div class="message-metadata" v-if="message.country || message.interest">
                <span v-if="message.country" class="badge country">{{ message.country }}</span>
                <span v-if="message.interest" class="badge interest">{{ message.interest }}</span>
              </div>

              <div class="message-text">{{ message.content }}</div>

              <div class="message-actions">
                <button @click="likeMessage(message.id)" class="action-btn">
                  👍 {{ message.likes || 0 }}
                </button>
                <button @click="toggleReplyForm(message.id)" class="action-btn">
                  💬 {{ message.replies || 0 }}
                </button>
                <button v-if="message.user_id === currentUserId" @click="deleteMessage(message.id)" class="action-btn delete">
                  🗑️
                </button>
              </div>

              <!-- Reply Form -->
              <div v-if="replyingTo === message.id" class="reply-form">
                <input
                  v-model="replyContent"
                  type="text"
                  placeholder="Write a reply..."
                  class="reply-input"
                  @keyup.enter="submitReply(message.id)"
                />
                <button @click="submitReply(message.id)" class="reply-btn">Send</button>
                <button @click="toggleReplyForm(null)" class="cancel-btn">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="chat-input-area">
        <textarea
          v-model="newMessage"
          placeholder="Share your thoughts with the universe... (max 500 chars)"
          class="message-input"
          maxlength="500"
          @keyup.ctrl.enter="sendMessage"
          @keyup.meta.enter="sendMessage"
        ></textarea>

        <div class="input-actions">
          <span class="char-count">{{ newMessage.length }}/500</span>
          <button
            @click="sendMessage"
            :disabled="!newMessage.trim() || loading"
            class="send-btn"
          >
            🚀 Send
          </button>
        </div>
      </div>

      <!-- Status Indicator -->
      <div v-if="error" class="error-message">
        ⚠️ {{ error }}
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

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { useUniverseMessage } from '~/composables/use-universe-message'
import { useAuth } from '~/composables/use-auth'

// Composables
const { fetchMessages, postMessage, likeMessage, deleteMessage, replyToMessage, messages, loading, error } = useUniverseMessage()
const { user } = useAuth()

// Reactive state
const newMessage = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const onlineUsers = ref(Math.floor(Math.random() * 150) + 50)
const gunStatus = ref<'connecting' | 'connected' | 'offline'>('connecting')

// Filter state
const selectedCountry = ref('')
const selectedInterest = ref('')
const selectedLanguage = ref('en')

// Reply state
const replyingTo = ref<string | null>(null)
const replyContent = ref('')

// Current user
const currentUserId = computed(() => user.value?.id || null)

// Status text
const statusText = computed(() => {
  switch (gunStatus.value) {
    case 'connecting':
      return 'Connecting...'
    case 'connected':
      return 'Connected'
    case 'offline':
      return 'Offline Mode'
    default:
      return 'Unknown'
  }
})

// Load messages on mount
onMounted(async () => {
  try {
    gunStatus.value = 'connecting'
    
    // Fetch initial messages
    await fetchMessages({
      country: selectedCountry.value || undefined,
      interest: selectedInterest.value || undefined,
      language: selectedLanguage.value
    })

    gunStatus.value = 'connected'

    // Simulate online users update
    setInterval(() => {
      onlineUsers.value = Math.floor(Math.random() * 150) + 50
    }, 5000)

  } catch (err) {
    console.error('Failed to load messages:', err)
    gunStatus.value = 'offline'
  }
})

// Send message
const sendMessage = async () => {
  if (!newMessage.value.trim()) return

  try {
    await postMessage(newMessage.value, {
      country: selectedCountry.value || undefined,
      interest: selectedInterest.value || undefined,
      language: selectedLanguage.value
    })

    newMessage.value = ''
    scrollToBottom()
  } catch (err) {
    console.error('Failed to send message:', err)
  }
}

// Apply filters
const applyFilters = async () => {
  try {
    await fetchMessages({
      country: selectedCountry.value || undefined,
      interest: selectedInterest.value || undefined,
      language: selectedLanguage.value
    })
    scrollToBottom()
  } catch (err) {
    console.error('Failed to apply filters:', err)
  }
}

// Like message
const likeMessageHandler = async (messageId: string) => {
  try {
    await likeMessage(messageId)
  } catch (err) {
    console.error('Failed to like message:', err)
  }
}

// Delete message
const deleteMessageHandler = async (messageId: string) => {
  if (confirm('Are you sure you want to delete this message?')) {
    try {
      await deleteMessage(messageId)
    } catch (err) {
      console.error('Failed to delete message:', err)
    }
  }
}

// Reply handlers
const toggleReplyForm = (messageId: string | null) => {
  replyingTo.value = messageId
  replyContent.value = ''
}

const submitReply = async (messageId: string) => {
  if (!replyContent.value.trim()) return

  try {
    await replyToMessage(messageId, replyContent.value)
    replyingTo.value = null
    replyContent.value = ''
  } catch (err) {
    console.error('Failed to reply:', err)
  }
}

// Utility functions
const formatTime = (timestamp: string) => {
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
.universe-chat-window {
  display: flex;
  flex-direction: column;
  height: 600px;
  border: 1px solid #e1e5e9;
  border-radius: 12px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom: 2px solid #667eea;
}

.chat-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.online-count {
  font-size: 14px;
  opacity: 0.9;
}

.status-indicator {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
}

.status-indicator.connected {
  background: #4caf50;
}

.status-indicator.offline {
  background: #ff9800;
}

.chat-filters {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: white;
  border-bottom: 1px solid #e1e5e9;
  flex-wrap: wrap;
}

.filter-select,
.filter-btn {
  padding: 8px 12px;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  background: white;
  transition: all 0.3s ease;
}

.filter-select:hover,
.filter-btn:hover {
  border-color: #667eea;
  background: #f5f7fa;
}

.filter-btn {
  background: #667eea;
  color: white;
  border: none;
  font-weight: 600;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: white;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  gap: 12px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.message-item:hover {
  background: #f0f0f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.message-item.own-message {
  flex-direction: row-reverse;
  background: #e3f2fd;
}

.message-avatar {
  flex-shrink: 0;
}

.avatar-img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.username {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.timestamp {
  font-size: 12px;
  color: #999;
}

.message-metadata {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.badge.country {
  background: #e1f5fe;
  color: #01579b;
}

.badge.interest {
  background: #f3e5f5;
  color: #4a148c;
}

.message-text {
  color: #333;
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
  margin-bottom: 8px;
}

.message-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: #f5f5f5;
  border-color: #667eea;
}

.action-btn.delete:hover {
  background: #ffebee;
  border-color: #f44336;
}

.reply-form {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #ddd;
}

.reply-input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
}

.reply-btn,
.cancel-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 600;
}

.reply-btn {
  background: #667eea;
  color: white;
}

.cancel-btn {
  background: #f5f5f5;
  color: #333;
}

.chat-input-area {
  padding: 12px;
  background: white;
  border-top: 1px solid #e1e5e9;
}

.message-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 60px;
  max-height: 120px;
  margin-bottom: 8px;
}

.message-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.char-count {
  font-size: 12px;
  color: #999;
}

.send-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  padding: 8px 12px;
  background: #ffebee;
  color: #c62828;
  font-size: 12px;
  border-top: 1px solid #ef5350;
}

.loading-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 600px;
  gap: 12px;
  color: #999;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Scrollbar styling */
.messages-container::-webkit-scrollbar {
  width: 8px;
}

.messages-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
