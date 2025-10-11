<template>
  <div class="chat-page">
    <div class="chat-container">
      <!-- Chat Sidebar -->
      <div class="chat-sidebar" :class="{ 'sidebar-hidden': selectedChat && isMobile }">
        <div class="sidebar-header">
          <h2>Messages</h2>
          <button @click="showNewChatModal = true" class="new-chat-btn">
            <Icon name="plus" size="16" />
          </button>
        </div>

        <!-- Search -->
        <div class="search-section">
          <div class="search-box">
            <Icon name="search" size="16" />
            <input 
              v-model="searchQuery" 
              placeholder="Search conversations..."
              class="search-input"
            />
          </div>
        </div>

        <!-- Chat List -->
        <div class="chat-list">
          <div 
            v-for="chat in filteredChats" 
            :key="chat.id"
            @click="selectChat(chat)"
            :class="['chat-item', { active: selectedChat?.id === chat.id }]"
          >
            <div class="chat-avatar">
              <img 
                :src="chat.avatar || '/default-avatar.png'" 
                :alt="chat.name"
                class="avatar-img"
              />
              <div v-if="chat.isOnline" class="online-indicator"></div>
            </div>
            <div class="chat-info">
              <div class="chat-header">
                <h4 class="chat-name">{{ chat.name }}</h4>
                <span class="chat-time">{{ formatTime(chat.lastMessageTime) }}</span>
              </div>
              <div class="chat-preview">
                <p class="last-message">{{ chat.lastMessage }}</p>
                <div v-if="chat.unreadCount > 0" class="unread-badge">
                  {{ chat.unreadCount }}
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="filteredChats.length === 0" class="empty-chats">
            <Icon name="message-circle" size="48" />
            <h3>No conversations</h3>
            <p>Start a new conversation to get chatting!</p>
            <button @click="showNewChatModal = true" class="btn-primary">
              New Message
            </button>
          </div>
        </div>
      </div>

      <!-- Chat Main Area -->
      <div class="chat-main" :class="{ 'main-hidden': !selectedChat && isMobile }">
        <!-- No Chat Selected -->
        <div v-if="!selectedChat" class="no-chat-selected">
          <Icon name="message-circle" size="64" />
          <h3>Select a conversation</h3>
          <p>Choose a conversation from the sidebar to start messaging</p>
        </div>

        <!-- Chat Area -->
        <div v-else class="chat-area">
          <!-- Chat Header -->
          <div class="chat-header">
            <button 
              v-if="isMobile" 
              @click="selectedChat = null" 
              class="back-btn"
            >
              <Icon name="arrow-left" size="20" />
            </button>
            <div class="chat-user-info">
              <img 
                :src="selectedChat.avatar || '/default-avatar.png'" 
                :alt="selectedChat.name"
                class="header-avatar"
              />
              <div class="user-details">
                <h3>{{ selectedChat.name }}</h3>
                <p class="user-status">
                  {{ selectedChat.isOnline ? 'Online' : `Last seen ${formatLastSeen(selectedChat.lastSeen)}` }}
                </p>
              </div>
            </div>
            <div class="chat-actions">
              <button class="action-btn" title="Voice Call">
                <Icon name="phone" size="20" />
              </button>
              <button class="action-btn" title="Video Call">
                <Icon name="video" size="20" />
              </button>
              <button class="action-btn" title="More Options">
                <Icon name="more-vertical" size="20" />
              </button>
            </div>
          </div>

          <!-- Messages Area -->
          <div ref="messagesContainer" class="messages-container">
            <div 
              v-for="message in selectedChat.messages" 
              :key="message.id"
              :class="['message', { 'own-message': message.senderId === currentUserId }]"
            >
              <div v-if="!message.senderId === currentUserId" class="message-avatar">
                <img 
                  :src="selectedChat.avatar || '/default-avatar.png'" 
                  :alt="selectedChat.name"
                  class="sender-avatar"
                />
              </div>
              <div class="message-content">
                <div class="message-bubble">
                  <p>{{ message.content }}</p>
                  <div v-if="message.media" class="message-media">
                    <img 
                      v-if="message.media.type === 'image'"
                      :src="message.media.url" 
                      :alt="message.media.name"
                      class="media-image"
                    />
                  </div>
                </div>
                <div class="message-meta">
                  <span class="message-time">{{ formatMessageTime(message.timestamp) }}</span>
                  <div v-if="message.senderId === currentUserId" class="message-status">
                    <Icon 
                      :name="getMessageStatusIcon(message.status)" 
                      size="12"
                      :class="['status-icon', message.status]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Typing Indicator -->
            <div v-if="isTyping" class="typing-indicator">
              <div class="typing-avatar">
                <img 
                  :src="selectedChat.avatar || '/default-avatar.png'" 
                  :alt="selectedChat.name"
                  class="sender-avatar"
                />
              </div>
              <div class="typing-bubble">
                <div class="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Message Input -->
          <div class="message-input-area">
            <div class="input-container">
              <button class="attachment-btn" @click="showAttachmentMenu = !showAttachmentMenu">
                <Icon name="paperclip" size="20" />
              </button>
              
              <div class="text-input-container">
                <textarea
                  v-model="newMessage"
                  @keydown="handleKeyDown"
                  @input="handleTyping"
                  placeholder="Type a message..."
                  class="message-input"
                  rows="1"
                  ref="messageInput"
                ></textarea>
                <button class="emoji-btn" @click="showEmojiPicker = !showEmojiPicker">
                  <Icon name="smile" size="20" />
                </button>
              </div>
              
              <button 
                @click="sendMessage" 
                :disabled="!newMessage.trim()"
                class="send-btn"
              >
                <Icon name="send" size="20" />
              </button>
            </div>

            <!-- Attachment Menu -->
            <div v-if="showAttachmentMenu" class="attachment-menu">
              <button @click="selectFile('image')" class="attachment-option">
                <Icon name="image" size="16" />
                Photo
              </button>
              <button @click="selectFile('file')" class="attachment-option">
                <Icon name="file" size="16" />
                Document
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- New Chat Modal -->
    <div v-if="showNewChatModal" class="modal-overlay" @click="closeNewChatModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>New Message</h3>
          <button @click="closeNewChatModal" class="close-btn">&times;</button>
        </div>
        <div class="new-chat-content">
          <div class="search-users">
            <input 
              v-model="userSearchQuery" 
              placeholder="Search users..."
              class="search-input"
            />
          </div>
          <div class="users-list">
            <div 
              v-for="user in filteredUsers" 
              :key="user.id"
              @click="startNewChat(user)"
              class="user-item"
            >
              <img 
                :src="user.avatar || '/default-avatar.png'" 
                :alt="user.name"
                class="user-avatar"
              />
              <div class="user-info">
                <h4>{{ user.name }}</h4>
                <p>@{{ user.username }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden File Input -->
    <input 
      ref="fileInput"
      type="file" 
      @change="handleFileSelect"
      class="hidden-file-input"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'

// Page meta with authentication
definePageMeta({ 
  middleware: ['auth']
})

// Reactive data
const user = useSupabaseUser()
const currentUserId = computed(() => user.value?.id)

const selectedChat = ref(null)
const chats = ref([])
const searchQuery = ref('')
const newMessage = ref('')
const isTyping = ref(false)
const showNewChatModal = ref(false)
const showAttachmentMenu = ref(false)
const showEmojiPicker = ref(false)
const userSearchQuery = ref('')
const users = ref([])
const isMobile = ref(false)

const messagesContainer = ref(null)
const messageInput = ref(null)
const fileInput = ref(null)

// Computed properties
const filteredChats = computed(() => {
  if (!searchQuery.value) return chats.value
  
  return chats.value.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const filteredUsers = computed(() => {
  if (!userSearchQuery.value) return users.value
  
  return users.value.filter(user => 
    user.name.toLowerCase().includes(userSearchQuery.value.toLowerCase()) ||
    user.username.toLowerCase().includes(userSearchQuery.value.toLowerCase())
  )
})

// Methods
const loadChats = async () => {
  try {
    // Mock data - replace with actual API call
    chats.value = [
      {
        id: 1,
        name: 'John Doe',
        avatar: '/avatars/john.jpg',
        lastMessage: 'Hey, how are you doing?',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        unreadCount: 2,
        isOnline: true,
        lastSeen: new Date(),
        messages: [
          {
            id: 1,
            senderId: 'other',
            content: 'Hey there!',
            timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
            status: 'read'
          },
          {
            id: 2,
            senderId: currentUserId.value,
            content: 'Hi! How are you?',
            timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
            status: 'read'
          },
          {
            id: 3,
            senderId: 'other',
            content: 'I\'m doing great, thanks for asking!',
            timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
            status: 'delivered'
          }
        ]
      },
      {
        id: 2,
        name: 'Jane Smith',
        avatar: '/avatars/jane.jpg',
        lastMessage: 'Thanks for the help!',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        unreadCount: 0,
        isOnline: false,
        lastSeen: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        messages: [
          {
            id: 1,
            senderId: currentUserId.value,
            content: 'No problem! Let me know if you need anything else.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
            status: 'read'
          },
          {
            id: 2,
            senderId: 'other',
            content: 'Thanks for the help!',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
            status: 'sent'
          }
        ]
      }
    ]
  } catch (error) {
    console.error('Error loading chats:', error)
  }
}

const loadUsers = async () => {
  try {
    // Mock data - replace with actual API call
    users.value = [
      {
        id: 3,
        name: 'Mike Johnson',
        username: 'mikej',
        avatar: '/avatars/mike.jpg'
      },
      {
        id: 4,
        name: 'Sarah Wilson',
        username: 'sarahw',
        avatar: '/avatars/sarah.jpg'
      }
    ]
  } catch (error) {
    console.error('Error loading users:', error)
  }
}

const selectChat = (chat) => {
  selectedChat.value = chat
  // Mark messages as read
  chat.unreadCount = 0
  
  nextTick(() => {
    scrollToBottom()
  })
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || !selectedChat.value) return

  const message = {
    id: Date.now(),
    senderId: currentUserId.value,
    content: newMessage.value.trim(),
    timestamp: new Date(),
    status: 'sending'
  }

  selectedChat.value.messages.push(message)
  selectedChat.value.lastMessage = message.content
  selectedChat.value.lastMessageTime = message.timestamp

  newMessage.value = ''

  nextTick(() => {
    scrollToBottom()
  })

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    message.status = 'sent'
    
    // Simulate delivery
    setTimeout(() => {
      message.status = 'delivered'
    }, 2000)
  } catch (error) {
    console.error('Error sending message:', error)
    message.status = 'failed'
  }
}

const handleKeyDown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const handleTyping = () => {
  // Implement typing indicator logic
  console.log('User is typing...')
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const startNewChat = (user) => {
  // Check if chat already exists
  const existingChat = chats.value.find(chat => chat.userId === user.id)
  
  if (existingChat) {
    selectChat(existingChat)
  } else {
    // Create new chat
    const newChat = {
      id: Date.now(),
      userId: user.id,
      name: user.name,
      avatar: user.avatar,
      lastMessage: '',
      lastMessageTime: new Date(),
      unreadCount: 0,
      isOnline: false,
      lastSeen: new Date(),
      messages: []
    }
    
    chats.value.unshift(newChat)
    selectChat(newChat)
  }
  
  closeNewChatModal()
}

const selectFile = (type) => {
  if (fileInput.value) {
    fileInput.value.accept = type === 'image' ? 'image/*' : '*'
    fileInput.value.click()
  }
  showAttachmentMenu.value = false
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    // Handle file upload
    console.log('Selected file:', file)
  }
}

const closeNewChatModal = () => {
  showNewChatModal.value = false
  userSearchQuery.value = ''
}

const formatTime = (date) => {
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}d`
  return date.toLocaleDateString()
}

const formatMessageTime = (date) => {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
}

const formatLastSeen = (date) => {
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} minutes ago`
  if (hours < 24) return `${hours} hours ago`
  return date.toLocaleDateString()
}

const getMessageStatusIcon = (status) => {
  switch (status) {
    case 'sending': return 'clock'
    case 'sent': return 'check'
    case 'delivered': return 'check-check'
    case 'read': return 'check-check'
    case 'failed': return 'x'
    default: return 'check'
  }
}

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

// Lifecycle
onMounted(() => {
  loadChats()
  loadUsers()
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.chat-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.chat-container {
  display: flex;
  height: 100%;
  max-height: calc(100vh - 4rem);
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Sidebar */
.chat-sidebar {
  width: 320px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  background: #f9fafb;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.new-chat-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-section {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-box svg {
  position: absolute;
  left: 0.75rem;
  color: #6b7280;
}

.search-input {
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background: white;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
}

.chat-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f3f4f6;
}

.chat-item:hover {
  background: #f3f4f6;
}

.chat-item.active {
  background: #e0e7ff;
  border-right: 3px solid #3b82f6;
}

.chat-avatar {
  position: relative;
}

.avatar-img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #10b981;
  border: 2px solid white;
  border-radius: 50%;
}

.chat-info {
  flex: 1;
  min-width: 0;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.chat-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  truncate: true;
}

.chat-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.chat-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.last-message {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
  truncate: true;
}

.unread-badge {
  background: #3b82f6;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  min-width: 20px;
  text-align: center;
}

/* Main Chat Area */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.no-chat-selected {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  text-align: center;
}

.no-chat-selected h3 {
  margin: 1rem 0 0.5rem 0;
  color: #1f2937;
}

.chat-area {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: white;
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 0.5rem;
  border-radius: 0.375rem;
}

.chat-user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.header-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-details h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.user-status {
  margin: 0;
  font-size: 0.75rem;
  color: #6b7280;
}

.chat-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: none;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f3f4f6;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message {
  display: flex;
  gap: 0.75rem;
  max-width: 70%;
}

.message.own-message {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar,
.sender-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.own-message .message-content {
  align-items: flex-end;
}

.message-bubble {
  background: #f3f4f6;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  max-width: 100%;
  word-wrap: break-word;
}

.own-message .message-bubble {
  background: #3b82f6;
  color: white;
}

.message-bubble p {
  margin: 0;
  line-height: 1.4;
}

.message-media {
  margin-top: 0.5rem;
}

.media-image {
  max-width: 200px;
  border-radius: 0.5rem;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.own-message .message-meta {
  flex-direction: row-reverse;
}

.status-icon.read {
  color: #3b82f6;
}

.status-icon.failed {
  color: #ef4444;
}

.typing-indicator {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
}

.typing-bubble {
  background: #f3f4f6;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
}

.typing-dots {
  display: flex;
  gap: 0.25rem;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  background: #6b7280;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: 0s; }
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

/* Message Input */
.message-input-area {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  background: white;
  position: relative;
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
}

.attachment-btn,
.emoji-btn,
.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.attachment-btn,
.emoji-btn {
  background: #f3f4f6;
  color: #6b7280;
}

.attachment-btn:hover,
.emoji-btn:hover {
  background: #e5e7eb;
}

.send-btn {
  background: #3b82f6;
  color: white;
}

.send-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.text-input-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  padding: 0.75rem 3rem 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 1.5rem;
  resize: none;
  max-height: 120px;
  font-family: inherit;
  line-height: 1.4;
}

.emoji-btn {
  position: absolute;
  right: 0.5rem;
  bottom: 0.25rem;
  width: 32px;
  height: 32px;
}

.attachment-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
  margin-bottom: 0.5rem;
}

.attachment-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.2s;
}

.attachment-option:hover {
  background: #f3f4f6;
}

/* Modal Styles */
.modal-overlay {
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

.modal-content {
  background: white;
  border-radius: 0.75rem;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
}

.new-chat-content {
  padding: 1rem;
}

.search-users {
  margin-bottom: 1rem;
}

.users-list {
  max-height: 300px;
  overflow-y: auto;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: background-color 0.2s;
}

.user-item:hover {
  background: #f3f4f6;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.user-info p {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.empty-chats {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: #6b7280;
}

.empty-chats h3 {
  margin: 1rem 0 0.5rem 0;
  color: #1f2937;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  font-weight: 500;
  margin-top: 1rem;
}

.hidden-file-input {
  display: none;
}

/* Mobile Styles */
@media (max-width: 768px) {
  .chat-container {
    height: 100vh;
    border-radius: 0;
  }
  
  .chat-sidebar {
    width: 100%;
    position: absolute;
    z-index: 10;
    height: 100%;
  }
  
  .sidebar-hidden {
    display: none;
  }
  
  .chat-main {
    width: 100%;
  }
  
  .main-hidden {
    display: none;
  }
  
  .message {
    max-width: 85%;
  }
  
  .chat-actions {
    display: none;
  }
}
</style>


