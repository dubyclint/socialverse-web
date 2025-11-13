<template>
  <div class="chat-layout">
    <!-- Connection Status Indicator -->
    <div v-if="!chatStore.isConnected" class="connection-banner">
      <Icon name="alert-circle" />
      <span>Connecting to chat...</span>
    </div>

    <!-- Chat Header -->
    <div class="chat-header">
      <div class="header-left">
        <h1>Messages</h1>
        <span class="online-count" v-if="chatStore.onlineUsersCount > 0">
          {{ chatStore.onlineUsersCount }} online
        </span>
      </div>
      <div class="header-right">
        <div class="balance-display" v-if="chatStore.userBalance > 0">
          <Icon name="gift" size="18" />
          <span>{{ chatStore.userBalance }} PEW</span>
        </div>
        <button @click="openNewChat" class="btn-icon" title="New Chat">
          <Icon name="plus" />
        </button>
        <button @click="openGroupCreator" class="btn-icon" title="New Group">
          <Icon name="users" />
        </button>
        <button @click="openSettings" class="btn-icon" title="Settings">
          <Icon name="settings" />
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="chat-content">
      <!-- Chat List Sidebar -->
      <div class="chat-sidebar">
        <!-- Search Bar -->
        <div class="search-bar">
          <Icon name="search" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search chats..."
            @input="filterChats"
          />
        </div>

        <!-- Chat List -->
        <div class="chat-list">
          <div v-if="filteredChats.length === 0" class="empty-state">
            <p>No chats yet. Start a conversation!</p>
          </div>

          <div 
            v-for="chat in filteredChats"
            :key="chat.id"
            class="chat-item"
            :class="{ active: chatStore.currentChatId === chat.id }"
            @click="selectChat(chat.id)"
          >
            <!-- Chat Avatar -->
            <div class="chat-avatar">
              <img 
                :src="chat.avatar || '/default-avatar.png'"
                :alt="chat.name"
              />
              <div v-if="isUserOnline(chat)" class="online-indicator"></div>
            </div>

            <!-- Chat Info -->
            <div class="chat-info">
              <div class="chat-header-row">
                <h3>{{ chat.name }}</h3>
                <span v-if="chat.lastMessageTime" class="time">
                  {{ formatTime(chat.lastMessageTime) }}
                </span>
              </div>
              <p class="last-message">{{ chat.lastMessage || 'No messages yet' }}</p>
            </div>

            <!-- Unread Badge -->
            <div v-if="chat.unreadCount > 0" class="unread-badge">
              {{ chat.unreadCount }}
            </div>
          </div>
        </div>
      </div>

      <!-- Chat Session -->
      <div class="chat-session">
        <div v-if="!chatStore.currentChatId" class="empty-chat">
          <Icon name="message-circle" size="64" />
          <h2>Select a chat to start messaging</h2>
          <p>Choose a conversation from the list or start a new one</p>
        </div>

        <ChatSession 
          v-else
          :chat="currentChat"
          :messages="chatStore.currentChatMessages"
          :typingUsers="chatStore.currentChatTypingUsers"
          :translations="chatStore.currentChatTranslations"
          :gifts="chatStore.currentChatGifts"
          @send-message="sendMessage"
          @typing="handleTyping"
          @edit-message="editMessage"
          @delete-message="deleteMessage"
          @translate-message="translateMessage"
          @send-gift="sendGift"
        />
      </div>
    </div>

    <!-- Modals -->
    <GroupCreator 
      v-if="showGroupCreator"
      @close="showGroupCreator = false"
      @create="createGroup"
    />

    <ChatSettings 
      v-if="showSettings"
      @close="showSettings = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useChatStore } from '~/stores/chat'
import { useChat } from '~/composables/use-chat'
import { useAuthStore } from '~/stores/auth'

const chatStore = useChatStore()
const authStore = useAuthStore()
const { 
  initialize, 
  sendMessage: emitMessage, 
  editMessage: emitEditMessage,
  deleteMessage: emitDeleteMessage,
  disconnect 
} = useChat()

const searchQuery = ref('')
const showGroupCreator = ref(false)
const showSettings = ref(false)
const typingTimeout = ref<NodeJS.Timeout | null>(null)

// Computed properties
const filteredChats = computed(() => {
  if (!searchQuery.value) {
    return chatStore.sortedChats
  }
  
  const query = searchQuery.value.toLowerCase()
  return chatStore.sortedChats.filter(chat =>
    chat.name.toLowerCase().includes(query) ||
    chat.lastMessage?.toLowerCase().includes(query)
  )
})

const currentChat = computed(() => {
  if (!chatStore.currentChatId) return null
  return chatStore.chats.get(chatStore.currentChatId)
})

// Methods
const loadChats = async () => {
  try {
    chatStore.setLoading(true)
    const response = await $fetch('/api/chat/list')
    if (response.success) {
      chatStore.addChats(response.data)
    }
  } catch (error) {
    console.error('Failed to load chats:', error)
    chatStore.setError('Failed to load chats')
  } finally {
    chatStore.setLoading(false)
  }
}

const selectChat = async (chatId: string) => {
  chatStore.setCurrentChat(chatId)
  try {
    const response = await $fetch(`/api/chat/${chatId}/messages`)
    if (response.success) {
      chatStore.addMessages(chatId, response.data)
    }
  } catch (error) {
    console.error('Failed to load messages:', error)
    chatStore.setError('Failed to load messages')
  }
}

const sendMessage = async (content: string, recipientId?: string) => {
  if (!chatStore.currentChatId || !content.trim()) return

  try {
    emitMessage(chatStore.currentChatId, {
      content: content.trim(),
      recipientId,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('Failed to send message:', error)
    chatStore.setError('Failed to send message')
  }
}

const editMessage = async (messageId: string, content: string) => {
  if (!chatStore.currentChatId) return

  try {
    emitEditMessage(chatStore.currentChatId, messageId, content)
  } catch (error) {
    console.error('Failed to edit message:', error)
    chatStore.setError('Failed to edit message')
  }
}

const deleteMessage = async (messageId: string) => {
  if (!chatStore.currentChatId) return

  try {
    emitDeleteMessage(chatStore.currentChatId, messageId)
  } catch (error) {
    console.error('Failed to delete message:', error)
    chatStore.setError('Failed to delete message')
  }
}

const translateMessage = async (messageId: string, text: string, targetLang: string) => {
  if (!chatStore.currentChatId) return

  try {
    const response = await $fetch('/api/chat/translate', {
      method: 'POST',
      body: {
        text,
        targetLang,
        messageId,
        chatId: chatStore.currentChatId
      }
    })

    if (response.success) {
      chatStore.updateMessage(chatStore.currentChatId, messageId, {
        translatedText: response.data.translatedText,
        translatedLang: targetLang
      })
    }
  } catch (error) {
    console.error('Failed to translate message:', error)
    chatStore.setError('Failed to translate message')
  }
}

const sendGift = async (recipientId: string, giftAmount: number, message: string, messageId: string) => {
  try {
    await $fetch('/api/pewgift/send', {
      method: 'POST',
      body: {
        recipientId: recipientId || '',
        recipientId,
        amount: giftAmount,
        message,
        messageId,
        timestamp: Date.now()
      }
    })

    // Update balance
    chatStore.updateUserBalance(-giftAmount)
  } catch (error) {
    console.error('Failed to send gift:', error)
    chatStore.setError('Failed to send gift')
  }
}

const handleTyping = (isTyping: boolean) => {
  if (!chatStore.currentChatId) return

  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }

  if (isTyping) {
    typingTimeout.value = setTimeout(() => {
      // Emit typing stopped
    }, 3000)
  }
}

const createGroup = async (groupData: any) => {
  try {
    const response = await $fetch('/api/group-chat/create', {
      method: 'POST',
      body: groupData
    })

    if (response.success) {
      chatStore.addChat(response.data)
      showGroupCreator.value = false
    }
  } catch (error) {
    console.error('Failed to create group:', error)
    chatStore.setError('Failed to create group')
  }
}

const openNewChat = () => {
  showGroupCreator.value = true
}

// Lifecycle
onMounted(async () => {
  // Initialize WebSocket/Realtime connection
  await initialize()
  
  // Load chats
  await loadChats()
})

onUnmounted(() => {
  disconnect()
})
</script>

<style scoped>
.chat-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.connection-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fff3cd;
  color: #856404;
  font-size: 14px;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.online-count {
  font-size: 12px;
  color: #666;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.balance-display {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #f0f0f0;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  color: #ff6b6b;
}

.btn-icon {
  width: 40px;
  height: 40px;
  border: none;
  background: #f0f0f0;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.btn-icon:hover {
  background: #e0e0e0;
}

.chat-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.chat-sidebar {
  width: 320px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
}

.search-bar input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  text-align: center;
  padding: 20px;
}

.chat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.chat-item:hover {
  background: #f9f9f9;
}

.chat-item.active {
  background: #e3f2fd;
}

.chat-avatar {
  position: relative;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.chat-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.online-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background: #4caf50;
  border: 2px solid white;
  border-radius: 50%;
}

.chat-info {
  flex: 1;
  min-width: 0;
}

.chat-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.chat-header-row h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time {
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
  margin-left: 8px;
}

.last-message {
  margin: 0;
  font-size: 13px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unread-badge {
  width: 24px;
  height: 24px;
  background: #2196f3;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.chat-session {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  text-align: center;
}

.empty-chat h2 {
  margin: 16px 0 8px;
  font-size: 18px;
}

.empty-chat p {
  margin: 0;
  font-size: 14px;
}
</style>
