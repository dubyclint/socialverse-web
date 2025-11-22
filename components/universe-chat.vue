<!-- components/universe-chat.vue -->
<!-- ============================================================================
     UNIVERSE CHAT - Global chat interface with filtering and real-time messaging
     ============================================================================ -->

<template>
  <div class="universe-chat-container">
    <!-- Header -->
    <universe-chat-header 
      :online-count="onlineCount"
      :unread-count="unreadCount"
      @search="handleSearch"
      @filter-change="handleFilterChange"
    />

    <!-- Chat Window -->
    <universe-chat-window 
      :messages="filteredMessages"
      :online-count="onlineCount"
      :matched-users="matchedUsers"
      :loading="loading"
      :error="error"
      @send-message="sendMessage"
      @like-message="likeMessage"
      @add-reaction="addReaction"
      @translate-message="translateMessage"
      @send-gift="sendGift"
      @load-more="loadMoreMessages"
    />

    <!-- Message Input -->
    <div class="message-input-section">
      <div class="input-wrapper">
        <textarea 
          v-model="messageContent"
          @keydown.enter.ctrl="sendMessage"
          placeholder="Type a message... (Ctrl+Enter to send)"
          class="message-input"
          rows="3"
        ></textarea>
        <div class="input-actions">
          <button 
            @click="attachFile"
            class="action-btn"
            title="Attach file"
          >
            📎
          </button>
          <button 
            @click="showEmojiPicker = !showEmojiPicker"
            class="action-btn"
            title="Add emoji"
          >
            😊
          </button>
          <button 
            @click="sendMessage"
            class="send-btn"
            :disabled="!messageContent.trim() || sending"
          >
            {{ sending ? '⏳' : '📤' }} Send
          </button>
        </div>
      </div>
      <div v-if="showEmojiPicker" class="emoji-picker">
        <span 
          v-for="emoji in commonEmojis" 
          :key="emoji"
          @click="insertEmoji(emoji)"
          class="emoji"
        >
          {{ emoji }}
        </span>
      </div>
    </div>

    <!-- File Input (Hidden) -->
    <input 
      ref="fileInput"
      type="file"
      @change="handleFileUpload"
      class="hidden-input"
      accept="image/*,video/*"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUniverseStore } from '~/stores/universe'
import { useSocket } from '~/composables/use-socket'
import UniverseChatHeader from '@/components/chat/universe-chat-header.vue'
import UniverseChatWindow from '@/components/chat/universe-chat-window.vue'

// Stores & Composables
const universeStore = useUniverseStore()
const { socket, isConnected } = useSocket()

// State
const messageContent = ref('')
const sending = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const showEmojiPicker = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const filters = ref({
  country: '',
  interest: '',
  language: 'en'
})

const commonEmojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🔥', '💯', '🎉', '😎', '🤗']

// Computed
const onlineCount = computed(() => universeStore.onlineCount)
const unreadCount = computed(() => universeStore.unreadCount)
const matchedUsers = computed(() => universeStore.matchedUsers)
const filteredMessages = computed(() => universeStore.filteredMessages)

// Methods
const handleSearch = (query: string): void => {
  universeStore.searchMessages(query)
}

const handleFilterChange = (newFilters: any): void => {
  filters.value = { ...filters.value, ...newFilters }
  socket?.emit('universe:filter-messages', filters.value)
}

const sendMessage = async (): Promise<void> => {
  if (!messageContent.value.trim() || sending.value) return

  sending.value = true
  error.value = null

  try {
    socket?.emit('universe:send-message', {
      content: messageContent.value,
      ...filters.value,
      timestamp: new Date().toISOString()
    })

    messageContent.value = ''
  } catch (err: any) {
    error.value = err.message || 'Failed to send message'
    console.error('Send message error:', err)
  } finally {
    sending.value = false
  }
}

const likeMessage = (messageId: string): void => {
  socket?.emit('universe:like-message', { messageId })
  universeStore.likeMessage(messageId)
}

const addReaction = (messageId: string, emoji: string): void => {
  socket?.emit('universe:add-reaction', { messageId, emoji })
  universeStore.addReaction(messageId, emoji)
}

const translateMessage = (messageId: string, text: string, targetLang: string): void => {
  socket?.emit('universe:translate-message', { messageId, text, targetLang })
}

const sendGift = (recipientId: string, giftId: string, amount: number, message: string, messageId: string): void => {
  socket?.emit('universe:send-gift', { 
    recipientId, 
    giftId, 
    giftAmount: amount, 
    message, 
    messageId 
  })
}

const loadMoreMessages = async (): Promise<void> => {
  loading.value = true
  try {
    await universeStore.loadMoreMessages()
  } catch (err) {
    console.error('Load more error:', err)
  } finally {
    loading.value = false
  }
}

const attachFile = (): void => {
  fileInput.value?.click()
}

const handleFileUpload = async (event: Event): Promise<void> => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    // Upload file and send as message
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await $fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    if (response.success) {
      socket?.emit('universe:send-message', {
        content: `[File: ${file.name}]`,
        fileUrl: response.data.url,
        fileType: file.type,
        ...filters.value,
        timestamp: new Date().toISOString()
      })
    }
  } catch (err) {
    console.error('File upload error:', err)
  }
}

const insertEmoji = (emoji: string): void => {
  messageContent.value += emoji
}

// Lifecycle
onMounted(() => {
  if (!isConnected.value) {
    error.value = 'Not connected to chat server'
    return
  }

  // Join universe chat
  socket?.emit('universe:join', filters.value)

  // Listen for messages
  socket?.on('universe:message', (message) => {
    universeStore.addMessage(message)
  })

  // Listen for online count
  socket?.on('universe:online-count', (data) => {
    universeStore.setOnlineCount(data.count)
  })

  // Listen for matched users
  socket?.on('universe:matched-users', (data) => {
    universeStore.setMatchedUsers(data.users)
  })

  // Listen for reactions
  socket?.on('universe:reaction-added', (data) => {
    universeStore.addReaction(data.messageId, data.emoji)
  })

  // Listen for likes
  socket?.on('universe:message-liked', (data) => {
    universeStore.likeMessage(data.messageId)
  })
})

onUnmounted(() => {
  socket?.emit('universe:leave', {})
})
</script>

<style scoped>
.universe-chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Message Input Section */
.message-input-section {
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
  background: #fafafa;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  transition: all 0.3s;
}

.message-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: #f0f0f0;
  border-color: #667eea;
}

.send-btn {
  flex: 1;
  padding: 10px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Emoji Picker */
.emoji-picker {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(32px, 1fr));
  gap: 8px;
  padding: 8px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  max-height: 150px;
  overflow-y: auto;
}

.emoji {
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji:hover {
  background: #f0f0f0;
  transform: scale(1.2);
}

.hidden-input {
  display: none;
}

/* Responsive */
@media (max-width: 640px) {
  .message-input-section {
    padding: 0.75rem;
  }

  .message-input {
    font-size: 16px; /* Prevent zoom on iOS */
  }

  .emoji-picker {
    grid-template-columns: repeat(auto-fit, minmax(28px, 1fr));
  }
}
</style>
