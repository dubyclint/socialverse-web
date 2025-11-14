<!-- components/streaming/mobile-stream-chat.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

// Props
const props = defineProps({
  streamId: {
    type: String,
    required: true
  },
  streamerId: {
    type: String,
    required: true
  },
  maxMessages: {
    type: Number,
    default: 100
  }
})

// Emits
const emit = defineEmits(['message-sent', 'user-joined', 'user-left'])

// Refs
const chatContainer = ref(null)
const messageInput = ref('')
const messages = ref([])
const isLoading = ref(false)
const isChatVisible = ref(true)
const isConnected = ref(false)
const currentUser = ref(null)
const onlineUsers = ref([])
const isSending = ref(false)
const showEmojiPicker = ref(false)
const showUserList = ref(false)
const typingUsers = ref([])
const messageFilter = ref('all') // all, system, user
const searchQuery = ref('')
const autoScroll = ref(true)

// WebSocket connection
let ws = null

// Computed
const filteredMessages = computed(() => {
  let filtered = messages.value

  // Filter by type
  if (messageFilter.value !== 'all') {
    filtered = filtered.filter(msg => msg.type === messageFilter.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    filtered = filtered.filter(msg =>
      msg.content.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      msg.username.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  return filtered
})

const typingIndicator = computed(() => {
  if (typingUsers.value.length === 0) return ''
  if (typingUsers.value.length === 1) return `${typingUsers.value[0]} is typing...`
  if (typingUsers.value.length === 2) return `${typingUsers.value[0]} and ${typingUsers.value[1]} are typing...`
  return `${typingUsers.value.length} users are typing...`
})

// Methods
const initializeChat = async () => {
  isLoading.value = true
  try {
    // Load current user
    const userResponse = await $fetch('/api/me')
    currentUser.value = userResponse

    // Load chat history
    const historyResponse = await $fetch(`/api/streams/${props.streamId}/chat/history`, {
      query: { limit: props.maxMessages }
    })
    messages.value = historyResponse.messages || []

    // Connect WebSocket
    connectWebSocket()
  } catch (error) {
    console.error('Failed to initialize chat:', error)
  } finally {
    isLoading.value = false
  }
}

const connectWebSocket = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${protocol}//${window.location.host}/api/streams/${props.streamId}/chat/ws`

  ws = new WebSocket(wsUrl)

  ws.onopen = () => {
    isConnected.value = true
    console.log('Chat WebSocket connected')
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    handleWebSocketMessage(data)
  }

  ws.onerror = (error) => {
    console.error('WebSocket error:', error)
    isConnected.value = false
  }

  ws.onclose = () => {
    isConnected.value = false
    console.log('Chat WebSocket disconnected')
    // Attempt to reconnect after 3 seconds
    setTimeout(connectWebSocket, 3000)
  }
}

const handleWebSocketMessage = (data) => {
  switch (data.type) {
    case 'message':
      addMessage(data.message)
      break
    case 'user_joined':
      onlineUsers.value.push(data.user)
      addSystemMessage(`${data.user.username} joined the chat`)
      emit('user-joined', data.user)
      break
    case 'user_left':
      onlineUsers.value = onlineUsers.value.filter(u => u.id !== data.userId)
      addSystemMessage(`${data.username} left the chat`)
      emit('user-left', data.userId)
      break
    case 'user_typing':
      if (!typingUsers.value.includes(data.username)) {
        typingUsers.value.push(data.username)
        setTimeout(() => {
          typingUsers.value = typingUsers.value.filter(u => u !== data.username)
        }, 3000)
      }
      break
    case 'online_users':
      onlineUsers.value = data.users
      break
  }
}

const addMessage = (message) => {
  messages.value.push({
    id: message.id || Date.now(),
    username: message.username,
    userId: message.userId,
    content: message.content,
    timestamp: message.timestamp || new Date(),
    type: message.type || 'user',
    avatar: message.avatar,
    isModerator: message.isModerator || false,
    isStreamer: message.isStreamer || false,
    badges: message.badges || []
  })

  // Keep only maxMessages
  if (messages.value.length > props.maxMessages) {
    messages.value = messages.value.slice(-props.maxMessages)
  }

  // Auto scroll to bottom
  if (autoScroll.value) {
    nextTick(() => {
      scrollToBottom()
    })
  }
}

const addSystemMessage = (content) => {
  addMessage({
    id: `system-${Date.now()}`,
    username: 'System',
    userId: 'system',
    content,
    type: 'system',
    isModerator: false,
    isStreamer: false
  })
}

const sendMessage = async () => {
  if (!messageInput.value.trim() || isSending.value || !isConnected.value) return

  isSending.value = true
  const content = messageInput.value.trim()
  messageInput.value = ''

  try {
    // Send via WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'message',
        content,
        streamId: props.streamId
      }))
    }

    emit('message-sent', { content, timestamp: new Date() })
  } catch (error) {
    console.error('Failed to send message:', error)
    messageInput.value = content // Restore message on error
  } finally {
    isSending.value = false
  }
}

const notifyTyping = () => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'typing',
      streamId: props.streamId
    }))
  }
}

const scrollToBottom = () => {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

const handleScroll = () => {
  if (chatContainer.value) {
    const isAtBottom = chatContainer.value.scrollHeight - chatContainer.value.scrollTop - chatContainer.value.clientHeight < 50
    autoScroll.value = isAtBottom
  }
}

const toggleChat = () => {
  isChatVisible.value = !isChatVisible.value
}

const toggleUserList = () => {
  showUserList.value = !showUserList.value
}

const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value
}

const addEmoji = (emoji) => {
  messageInput.value += emoji
  showEmojiPicker.value = false
}

const clearChat = () => {
  if (confirm('Are you sure you want to clear the chat?')) {
    messages.value = []
  }
}

const getMessageClass = (message) => {
  const classes = ['message-item']
  if (message.type === 'system') classes.push('system-message')
  if (message.isStreamer) classes.push('streamer-message')
  if (message.isModerator) classes.push('moderator-message')
  if (message.userId === currentUser.value?.id) classes.push('own-message')
  return classes
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const handleKeydown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

onMounted(() => {
  initializeChat()
})

onUnmounted(() => {
  if (ws) {
    ws.close()
  }
})
</script>

<template>
  <div class="mobile-stream-chat">
    <!-- Chat Header -->
    <div class="chat-header-mobile">
      <div class="header-left">
        <button @click="toggleChat" class="toggle-btn">
          {{ isChatVisible ? '▼' : '▶' }} Chat
        </button>
        <span class="online-count">{{ onlineUsers.length }} online</span>
      </div>
      <div class="header-right">
        <button @click="toggleUserList" class="header-btn" :class="{ active: showUserList }">
          👥
        </button>
        <button @click="clearChat" class="header-btn">
          🗑️
        </button>
      </div>
    </div>

    <!-- Chat Content -->
    <div v-show="isChatVisible" class="chat-content-mobile">
      <!-- User List Sidebar -->
      <div v-if="showUserList" class="user-list-sidebar">
        <div class="user-list-header">
          <h4>Online Users ({{ onlineUsers.length }})</h4>
          <button @click="toggleUserList" class="close-btn">✕</button>
        </div>
        <div class="user-list">
          <div v-for="user in onlineUsers" :key="user.id" class="user-item">
            <img :src="user.avatar" :alt="user.username" class="user-avatar">
            <span class="user-name">{{ user.username }}</span>
            <span v-if="user.isModerator" class="badge moderator-badge">MOD</span>
            <span v-if="user.isStreamer" class="badge streamer-badge">LIVE</span>
          </div>
        </div>
      </div>

      <!-- Messages Container -->
      <div 
        ref="chatContainer"
        class="messages-container"
        @scroll="handleScroll"
      >
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading chat...</p>
        </div>

        <div v-else-if="filteredMessages.length === 0" class="empty-state">
          <p>No messages yet. Start the conversation!</p>
        </div>

        <div v-else class="messages-list">
          <div 
            v-for="message in filteredMessages" 
            :key="message.id"
            :class="getMessageClass(message)"
          >
            <!-- System Message -->
            <div v-if="message.type === 'system'" class="system-msg">
              <span class="system-text">{{ message.content }}</span>
            </div>

            <!-- User Message -->
            <div v-else class="user-msg">
              <img :src="message.avatar" :alt="message.username" class="msg-avatar">
              <div class="msg-content">
                <div class="msg-header">
                  <span class="msg-username">{{ message.username }}</span>
                  <span v-if="message.isStreamer" class="badge streamer-badge">STREAMER</span>
                  <span v-if="message.isModerator" class="badge moderator-badge">MOD</span>
                  <span class="msg-time">{{ formatTime(message.timestamp) }}</span>
                </div>
                <div class="msg-text">{{ message.content }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Typing Indicator -->
        <div v-if="typingIndicator" class="typing-indicator">
          <span>{{ typingIndicator }}</span>
          <div class="typing-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>

      <!-- Message Input -->
      <div class="input-area-mobile">
        <!-- Filter/Search Bar -->
        <div class="filter-bar">
          <select v-model="messageFilter" class="filter-select">
            <option value="all">All</option>
            <option value="user">Messages</option>
            <option value="system">System</option>
          </select>
          <input 
            v-model="searchQuery"
            type="text"
            placeholder="Search..."
            class="search-input"
          >
        </div>

        <!-- Message Input -->
        <div class="input-wrapper">
          <button @click="toggleEmojiPicker" class="emoji-btn">😊</button>
          <textarea
            v-model="messageInput"
            @keydown="handleKeydown"
            @input="notifyTyping"
            placeholder="Type a message..."
            class="message-input"
            rows="1"
          ></textarea>
          <button 
            @click="sendMessage"
            :disabled="!messageInput.trim() || isSending || !isConnected"
            class="send-btn"
          >
            {{ isSending ? '...' : '📤' }}
          </button>
        </div>

        <!-- Emoji Picker -->
        <div v-if="showEmojiPicker" class="emoji-picker">
          <div class="emoji-grid">
            <button 
              v-for="emoji in ['😀', '😂', '😍', '🔥', '👍', '👎', '🎉', '💯', '❤️', '😢', '😡', '🤔']"
              :key="emoji"
              @click="addEmoji(emoji)"
              class="emoji-btn-item"
            >
              {{ emoji }}
            </button>
          </div>
        </div>
      </div>

      <!-- Connection Status -->
      <div v-if="!isConnected" class="connection-status">
        ⚠️ Reconnecting...
      </div>
    </div>
  </div>
</template>

<style scoped>
.mobile-stream-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a1a;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.chat-header-mobile {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #0a0a0a;
  border-bottom: 1px solid #333;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toggle-btn {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  font-weight: bold;
  padding: 0.25rem 0.5rem;
}

.online-count {
  font-size: 0.75rem;
  color: #888;
}

.header-right {
  display: flex;
  gap: 0.5rem;
}

.header-btn {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem 0.5rem;
}

.header-btn.active {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.chat-content-mobile {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.user-list-sidebar {
  width: 150px;
  background: #0a0a0a;
  border-right: 1px solid #333;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-bottom: 1px solid #333;
}

.user-list-header h4 {
  margin: 0;
  font-size: 0.875rem;
}

.close-btn {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 1rem;
}

.user-list {
  flex: 1;
  overflow-y: auto;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-bottom: 1px solid #222;
  font-size: 0.75rem;
}

.user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge {
  font-size: 0.625rem;
  padding: 0.125rem 0.25rem;
  border-radius: 2px;
  font-weight: bold;
}

.streamer-badge {
  background: #ff0000;
  color: #fff;
}

.moderator-badge {
  background: #00aa00;
  color: #fff;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #888;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #333;
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.message-item {
  display: flex;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.system-msg {
  text-align: center;
  padding: 0.5rem;
}

.system-text {
  font-size: 0.75rem;
  color: #888;
  font-style: italic;
}

.user-msg {
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.msg-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.msg-content {
  flex: 1;
  background: #222;
  border-radius: 8px;
  padding: 0.5rem;
}

.msg-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.msg-username {
  font-weight: bold;
  color: #fff;
}

.msg-time {
  font-size: 0.7rem;
  color: #888;
  margin-left: auto;
}

.msg-text {
  word-wrap: break-word;
  color: #ddd;
}

.own-message .msg-content {
  background: #1a4d1a;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #888;
  padding: 0.5rem;
}

.typing-dots {
  display: flex;
  gap: 0.25rem;
}

.typing-dots span {
  width: 4px;
  height: 4px;
  background: #888;
  border-radius: 50%;
  animation: bounce 1.4s infinite;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 80%, 100% { opacity: 0.5; }
  40% { opacity: 1; }
}

.input-area-mobile {
  background: #0a0a0a;
  border-top: 1px solid #333;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-bar {
  display: flex;
  gap: 0.5rem;
}

.filter-select,
.search-input {
  background: #222;
  border: 1px solid #333;
  color: #fff;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.search-input {
  flex: 1;
}

.input-wrapper {
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
}

.emoji-btn {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
}

.message-input {
  flex: 1;
  background: #222;
  border: 1px solid #333;
  color: #fff;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  resize: none;
  max-height: 80px;
  font-family: inherit;
}

.message-input::placeholder {
  color: #888;
}

.send-btn {
  background: #ff0000;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: bold;
}

.send-btn:disabled {
  background: #666;
  cursor: not-allowed;
}

.emoji-picker {
  background: #222;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 0.5rem;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.25rem;
}

.emoji-btn-item {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0.25rem;
  border-radius: 4px;
}

.emoji-btn-item:hover {
  background: #333;
}

.connection-status {
  background: #ff6600;
  color: #fff;
  padding: 0.5rem;
  text-align: center;
  font-size: 0.875rem;
  font-weight: bold;
}

/* Scrollbar Styling */
.messages-container::-webkit-scrollbar,
.user-list::-webkit-scrollbar {
  width: 4px;
}

.messages-container::-webkit-scrollbar-track,
.user-list::-webkit-scrollbar-track {
  background: #1a1a1a;
}

.messages-container::-webkit-scrollbar-thumb,
.user-list::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 2px;
}

.messages-container::-webkit-scrollbar-thumb:hover,
.user-list::-webkit-scrollbar-thumb:hover {
  background: #666;
}
</style>
