<!-- components/streaming/StreamChat.vue - Responsive for Desktop & Mobile -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useStreaming } from '~/composables/use-streaming'
  import { useauth} from '~/composables/use-auth' 
  
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
const showChatSettings = ref(false)
const typingUsers = ref([])
const messageFilter = ref('all')
const searchQuery = ref('')
const autoScroll = ref(true)
const isMobile = ref(false)
const pinnedMessage = ref(null)

// WebSocket connection
let ws = null

// Settings
const settings = ref({
  showTimestamps: true,
  showAvatars: true,
  enableSounds: true,
  fontSize: 'medium'
})

// Quick reactions
const quickReactions = ['❤️', '😂', '👏', '🔥', '😮', '👍']

// Computed
const filteredMessages = computed(() => {
  let filtered = messages.value

  if (messageFilter.value !== 'all') {
    filtered = filtered.filter(msg => msg.type === messageFilter.value)
  }

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

const canSendMessage = computed(() => {
  return isConnected.value && currentUser.value && messageInput.value.trim().length > 0
})

const chatPlaceholder = computed(() => {
  if (!isConnected.value) return 'Connecting...'
  if (!currentUser.value) return 'Login to chat'
  return 'Type a message...'
})

  const showPewgiftModal = ref(false)
const pewgiftAmount = ref(0)

const sendStreamPewgift = async () => {
  if (!pewgiftAmount.value || pewgiftAmount.value <= 0) {
    alert('Please enter a valid amount')
    return
  }
  
  try {
    const response = await fetch('/api/pewgift/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientId: props.streamerId,
        amount: pewgiftAmount.value,
        streamId: props.streamId
      })
    })
    
    if (response.ok) {
      alert('Pewgift sent successfully!')
      showPewgiftModal.value = false
      pewgiftAmount.value = 0
    }
  } catch (error) {
    console.error('Error sending pewgift:', error)
    alert('Failed to send pewgift')
  }
}


// Methods
const initializeChat = async () => {
  isLoading.value = true
  checkMobileView()
  
  try {
    const userResponse = await $fetch('/api/me')
    currentUser.value = userResponse

    const historyResponse = await $fetch(`/api/streams/${props.streamId}/chat/history`, {
      query: { limit: props.maxMessages }
    })
    messages.value = historyResponse.messages || []

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
    case 'pinned_message':
      pinnedMessage.value = data.message
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

  if (messages.value.length > props.maxMessages) {
    messages.value = messages.value.slice(-props.maxMessages)
  }

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
  if (!canSendMessage.value) return

  isSending.value = true
  const content = messageInput.value.trim()
  messageInput.value = ''

  try {
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
    messageInput.value = content
  } finally {
    isSending.value = false
  }
}

const sendReaction = async (emoji) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'reaction',
      emoji,
      streamId: props.streamId
    }))
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

const toggleChatSettings = () => {
  showChatSettings.value = !showChatSettings.value
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

const checkMobileView = () => {
  isMobile.value = window.innerWidth < 768
}

const handleResize = () => {
  checkMobileView()
}

onMounted(() => {
  initializeChat()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (ws) {
    ws.close()
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="stream-chat" :class="{ 'is-mobile': isMobile }">
    <!-- Chat Header -->
    <div class="chat-header">
      <div class="header-left">
        <button @click="toggleChat" class="toggle-btn">
          <span v-if="isMobile">{{ isChatVisible ? '▼' : '▶' }}</span>
          <span v-else>💬</span>
          <span class="header-title">Live Chat</span>
        </button>
        <span class="online-badge">{{ onlineUsers.length }}</span>
      </div>
      <div class="header-right">
        <button @click="toggleUserList" class="header-btn" :class="{ active: showUserList }" title="Users">
          👥
        </button>
        <button @click="toggleChatSettings" class="header-btn" :class="{ active: showChatSettings }" title="Settings">
          ⚙️
        </button>
        <button @click="clearChat" class="header-btn" title="Clear">
          🗑️
        </button>
      </div>
    </div>

    <!-- Chat Content -->
    <div v-show="isChatVisible" class="chat-content">
      <!-- User List Sidebar -->
      <div v-if="showUserList" class="user-list-panel" :class="{ 'mobile-sidebar': isMobile }">
        <div class="panel-header">
          <h4>Online Users ({{ onlineUsers.length }})</h4>
          <button @click="toggleUserList" class="close-btn">✕</button>
        </div>
        <div class="user-list">
          <div v-for="user in onlineUsers" :key="user.id" class="user-item">
            <img :src="user.avatar" :alt="user.username" class="user-avatar">
            <span class="user-name">{{ user.username }}</span>
            <div class="user-badges">
              <span v-if="user.isModerator" class="badge moderator-badge">MOD</span>
              <span v-if="user.isStreamer" class="badge streamer-badge">LIVE</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Settings Panel -->
      <div v-if="showChatSettings" class="settings-panel" :class="{ 'mobile-sidebar': isMobile }">
        <div class="panel-header">
          <h4>Chat Settings</h4>
          <button @click="toggleChatSettings" class="close-btn">✕</button>
        </div>
        <div class="settings-content">
          <label class="setting-item">
            <input v-model="settings.showTimestamps" type="checkbox">
            <span>Show Timestamps</span>
          </label>
          <label class="setting-item">
            <input v-model="settings.showAvatars" type="checkbox">
            <span>Show Avatars</span>
          </label>
          <label class="setting-item">
            <input v-model="settings.enableSounds" type="checkbox">
            <span>Enable Sounds</span>
          </label>
          <div class="setting-item">
            <label>Font Size:</label>
            <select v-model="settings.fontSize" class="font-size-select">
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Messages Container -->
      <div 
        ref="chatContainer"
        class="messages-container"
        @scroll="handleScroll"
      >
        <!-- Pinned Message -->
        <div v-if="pinnedMessage" class="pinned-message">
          <span class="pin-icon">📌</span>
          <div class="pin-content">
            <strong>{{ pinnedMessage.username }}:</strong>
            {{ pinnedMessage.content }}
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading chat...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredMessages.length === 0" class="empty-state">
          <p>No messages yet. Start the conversation!</p>
        </div>

        <!-- Messages List -->
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
              <img v-if="settings.showAvatars" :src="message.avatar" :alt="message.username" class="msg-avatar">
              <div class="msg-content">
                <div class="msg-header">
                  <span class="msg-username">{{ message.username }}</span>
                  <div class="msg-badges">
                    <span v-if="message.isStreamer" class="badge streamer-badge">STREAMER</span>
                    <span v-if="message.isModerator" class="badge moderator-badge">MOD</span>
                  </div>
                  <span v-if="settings.showTimestamps" class="msg-time">{{ formatTime(message.timestamp) }}</span>
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

      <!-- Message Input Area -->
      <div class="input-area">
        <!-- Filter Bar (Desktop) -->
        <div v-if="!isMobile" class="filter-bar">
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

        <!-- Quick Reactions (Desktop) -->
        <div v-if="!isMobile" class="quick-reactions">
          <button 
            v-for="emoji in quickReactions"
            :key="emoji"
            @click="sendReaction(emoji)"
            class="reaction-btn"
            :title="`React with ${emoji}`"
          >
            {{ emoji }}
          </button>
        </div>

        <button 
  @click="showPewgiftModal = true"
  class="action-btn pewgift-btn"
  title="Send pewgift"
>
  🎁 Pewgift
</button>

<!-- Pewgift Modal -->
<div v-if="showPewgiftModal" class="modal-overlay" @click="showPewgiftModal = false">
  <div class="pewgift-modal" @click.stop>
    <div class="modal-header">
      <h4>Send Pewgift</h4>
      <button @click="showPewgiftModal = false" class="close-btn">✕</button>
    </div>
    <div class="modal-body">
      <input 
        v-model.number="pewgiftAmount" 
        type="number" 
        min="1" 
        placeholder="Enter pewgift amount"
        class="amount-input"
      />
      <button @click="sendStreamPewgift" class="send-btn" :disabled="!pewgiftAmount">
        Send Pewgift
      </button>
    </div>
  </div>
</div>
  
        <!-- Message Input -->
        <div class="input-wrapper">
          <button @click="toggleEmojiPicker" class="emoji-btn" title="Emoji">😊</button>
          <textarea
            v-model="messageInput"
            @keydown="handleKeydown"
            @input="notifyTyping"
            :placeholder="chatPlaceholder"
            class="message-input"
            :class="{ 'font-small': settings.fontSize === 'small', 'font-large': settings.fontSize === 'large' }"
            rows="1"
          ></textarea>
          <button 
            @click="sendMessage"
            :disabled="!canSendMessage"
            class="send-btn"
            title="Send"
          >
            {{ isSending ? '...' : '📤' }}
          </button>
        </div>

        <!-- Emoji Picker -->
        <div v-if="showEmojiPicker" class="emoji-picker">
          <div class="emoji-grid">
            <button 
              v-for="emoji in ['😀', '😂', '😍', '🔥', '👍', '👎', '🎉', '💯', '❤️', '😢', '😡', '🤔', '😎', '🤗', '😴', '🤮']"
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
.stream-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a1a;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* ===== HEADER ===== */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #0a0a0a;
  border-bottom: 1px solid #333;
  gap: 0.5rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.toggle-btn {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  font-weight: bold;
  padding: 0.25rem 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-title {
  font-size: 0.95rem;
}

.online-badge {
  background: #ff0000;
  color: #fff;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
}

.header-right {
  display: flex;
  gap: 0.25rem;
}

.header-btn {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.header-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.header-btn.active {
  background: rgba(255, 255, 255, 0.2);
}

/* ===== CONTENT ===== */
.chat-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* ===== SIDEBARS ===== */
.user-list-panel,
.settings-panel {
  width: 200px;
  background: #0a0a0a;
  border-right: 1px solid #333;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid #333;
}

.panel-header h4 {
  margin: 0;
  font-size: 0.9rem;
}

.close-btn {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0;
}

.user-list {
  flex: 1;
  overflow-y: auto;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-bottom: 1px solid #222;
  font-size: 0.85rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.user-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-badges {
  display: flex;
  gap: 0.25rem;
}

.badge {
  font-size: 0.65rem;
  padding: 0.15rem 0.35rem;
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

/* ===== SETTINGS PANEL ===== */
.settings-content {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  cursor: pointer;
}

.setting-item input[type="checkbox"] {
  cursor: pointer;
}

.font-size-select {
  background: #222;
  border: 1px solid #333;
  color: #fff;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

/* ===== MESSAGES ===== */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pinned-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #222;
  border-left: 3px solid #ff0000;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.pin-icon {
  font-size: 1rem;
}

.pin-content {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  font-size: 0.9rem;
}

.msg-avatar {
  width: 32px;
  height: 32px;
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
  flex-wrap: wrap;
}

.msg-username {
  font-weight: bold;
  color: #fff;
}

.msg-badges {
  display: flex;
  gap: 0.25rem;
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

/* ===== INPUT AREA ===== */
.input-area {
  background: #0a0a0a;
  border-top: 1px solid #333;
  padding: 0.75rem;
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
  padding: 0.4rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

.search-input {
  flex: 1;
}

.quick-reactions {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.reaction-btn {
  background: #222;
  border: 1px solid #333;
  color: #fff;
  cursor: pointer;
  padding: 0.4rem 0.6rem;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.reaction-btn:hover {
  background: #333;
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
  font-size: 1.1rem;
  padding: 0.4rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.emoji-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.message-input {
  flex: 1;
  background: #222;
  border: 1px solid #333;
  color: #fff;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
  resize: none;
  max-height: 100px;
  font-family: inherit;
}

.message-input.font-small {
  font-size: 0.8rem;
}

.message-input.font-large {
  font-size: 1rem;
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
  transition: background 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: #cc0000;
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
  grid-template-columns: repeat(8, 1fr);
  gap: 0.25rem;
}

.emoji-btn-item {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.emoji-btn-item:hover {
  background: #333;
}

.connection-status {
  background: #ff6600;
  color: #fff;
  padding: 0.5rem;
  text-align: center;
  font-size: 0.85rem;
  font-weight: bold;
}

/* ===== SCROLLBAR ===== */
.messages-container::-webkit-scrollbar,
.user-list::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track,
.user-list::-webkit-scrollbar-track {
  background: #1a1a1a;
}

.messages-container::-webkit-scrollbar-thumb,
.user-list::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover,
.user-list::-webkit-scrollbar-thumb:hover {
  background: #666;
}

/* ===== MOBILE RESPONSIVE ===== */
@media (max-width: 767px) {
  .stream-chat.is-mobile {
    height: 100%;
  }

  .chat-header {
    padding: 0.5rem;
  }

  .header-title {
    font-size: 0.85rem;
  }

  .online-badge {
    font-size: 0.7rem;
    padding: 0.2rem 0.4rem;
  }

  .header-btn {
    padding: 0.35rem;
    font-size: 0.9rem;
  }

  .user-list-panel.mobile-sidebar,
  .settings-panel.mobile-sidebar {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    max-width: 250px;
    height: 100%;
    z-index: 100;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.5);
  }

  .messages-container {
    padding: 0.5rem;
    gap: 0.35rem;
  }

  .user-item {
    padding: 0.5rem;
    font-size: 0.8rem;
  }

  .user-avatar {
    width: 28px;
    height: 28px;
  }

  .msg-avatar {
    width: 28px;
    height: 28px;
  }

  .user-msg {
    font-size: 0.85rem;
  }

  .msg-content {
    padding: 0.4rem;
  }

  .msg-header {
    font-size: 0.8rem;
  }

  .msg-username {
    font-size: 0.8rem;
  }

  .msg-time {
    display: none;
  }

  .input-area {
    padding: 0.5rem;
    gap: 0.35rem;
  }

  .filter-bar {
    display: none;
  }

  .quick-reactions {
    display: none;
  }

  .filter-select,
  .search-input {
    font-size: 0.8rem;
    padding: 0.3rem 0.4rem;
  }

  .message-input {
    font-size: 0.85rem;
    padding: 0.4rem;
  }

  .emoji-grid {
    grid-template-columns: repeat(6, 1fr);
  }

  .emoji-btn-item {
    font-size: 1rem;
  }

  .send-btn {
    padding: 0.4rem 0.6rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .header-title {
    display: none;
  }

  .online-badge {
    font-size: 0.65rem;
  }

  .messages-container {
    padding: 0.35rem;
  }

  .msg-content {
    padding: 0.35rem;
  }

  .input-area {
    padding: 0.35rem;
  }

  .emoji-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
