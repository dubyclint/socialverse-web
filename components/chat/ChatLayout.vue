<!-- components/chat/ChatLayout.vue (Enhanced) -->
<template>
  <div class="chat-layout">
    <!-- Chat Header -->
    <ChatHeader 
      :user="currentUser"
      :unreadCount="totalUnreadCount"
      :onlineCount="onlinePalsCount"
      @search="handleSearch"
      @openSettings="showSettings = true"
      @openStatus="showStatusCreator = true"
    />

    <!-- Chat Content -->
    <div class="chat-content">
      <!-- Chat List Sidebar -->
      <div class="chat-sidebar" :class="{ 'hidden': showChatSession }">
        <ChatSidebar
          :chats="chats"
          :selectedChatId="selectedChatId"
          :searchQuery="searchQuery"
          :onlinePals="onlinePals"
          :statusUsers="statusUsers"
          @selectChat="selectChat"
          @createGroup="showGroupCreator = true"
          @newAnnouncement="showAnnouncementCreator = true"
        />
      </div>

      <!-- Chat Session -->
      <div class="chat-session" :class="{ 'hidden': !showChatSession }">
        <ChatSession
          v-if="selectedChat"
          :chat="selectedChat"
          :currentUser="currentUser"
          :messages="messages"
          :isLoading="loadingMessages"
          @sendMessage="sendMessage"
          @editMessage="editMessage"
          @deleteMessage="deleteMessage"
          @markAsRead="markAsRead"
          @startCall="startCall"
          @back="backToList"
          @uploadFiles="handleFileUpload"
          @openMediaGallery="showMediaGallery = true"
        />
        <div v-else class="no-chat-selected">
          <div class="welcome-message">
            <h3>Welcome to SocialVerse Chat</h3>
            <p>Select a chat to start messaging</p>
          </div>
        </div>
      </div>
    </div>

    <!-- File Upload Progress -->
    <FileUploadProgress
      :uploads="uploads"
      @cancel="cancelUpload"
      @cancelAll="cancelAllUploads"
      @clearCompleted="clearCompletedUploads"
    />

    <!-- Media Gallery -->
    <MediaGallery
      :show="showMediaGallery"
      :chatId="selectedChatId"
      :mediaList="mediaGallery"
      @close="showMediaGallery = false"
    />

    <!-- Modals -->
    <GroupCreator
      v-if="showGroupCreator"
      :contacts="contacts"
      @close="showGroupCreator = false"
      @created="handleGroupCreated"
    />

    <AnnouncementCreator
      v-if="showAnnouncementCreator"
      :pals="pals"
      @close="showAnnouncementCreator = false"
      @sent="handleAnnouncementSent"
    />

    <StatusCreator
      v-if="showStatusCreator"
      @close="showStatusCreator = false"
      @created="handleStatusCreated"
    />

    <ChatSettings
      v-if="showSettings"
      :settings="userSettings"
      @close="showSettings = false"
      @updated="handleSettingsUpdated"
    />

    <!-- Call Interface -->
    <CallInterface
      v-if="activeCall"
      :call="activeCall"
      @endCall="endCall"
      @toggleMute="toggleMute"
      @toggleVideo="toggleVideo"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSocket } from '@/composables/useSocket'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'

// Components
import ChatHeader from './ChatHeader.vue'
import ChatSidebar from './ChatSidebar.vue'
import ChatSession from './ChatSession.vue'
import GroupCreator from './GroupCreator.vue'
import AnnouncementCreator from './AnnouncementCreator.vue'
import StatusCreator from './StatusCreator.vue'
import ChatSettings from './ChatSettings.vue'
import CallInterface from './CallInterface.vue'
import FileUploadProgress from './FileUploadProgress.vue'
import MediaGallery from './MediaGallery.vue'

// Stores
const chatStore = useChatStore()
const userStore = useUserStore()

// Socket
const { socket, isConnected } = useSocket()

// Reactive data
const showChatSession = ref(false)
const showGroupCreator = ref(false)
const showAnnouncementCreator = ref(false)
const showStatusCreator = ref(false)
const showSettings = ref(false)
const showMediaGallery = ref(false)
const searchQuery = ref('')
const loadingMessages = ref(false)
const activeCall = ref(null)

// Computed properties
const currentUser = computed(() => userStore.user)
const chats = computed(() => chatStore.chats)
const selectedChat = computed(() => chatStore.selectedChat)
const selectedChatId = computed(() => chatStore.selectedChatId)
const messages = computed(() => chatStore.messages)
const contacts = computed(() => chatStore.contacts)
const pals = computed(() => chatStore.pals)
const onlinePals = computed(() => chatStore.onlinePals)
const statusUsers = computed(() => chatStore.statusUsers)
const userSettings = computed(() => userStore.settings)
const uploads = computed(() => chatStore.uploads)
const mediaGallery = computed(() => chatStore.mediaGallery)

const totalUnreadCount = computed(() => {
  return chats.value.reduce((total, chat) => total + (chat.unreadCount || 0), 0)
})

const onlinePalsCount = computed(() => onlinePals.value.length)

// Methods
const selectChat = async (chatId) => {
  showChatSession.value = true
  loadingMessages.value = true
  
  try {
    await chatStore.selectChat(chatId)
    await Promise.all([
      chatStore.loadMessages(chatId),
      chatStore.loadMediaGallery(chatId)
    ])
    
    // Join chat room via socket
    socket.emit('join_chat', { chatId })
    
    // Mark messages as read
    await markAsRead(chatId)
  } catch (error) {
    console.error('Error selecting chat:', error)
  } finally {
    loadingMessages.value = false
  }
}

const backToList = () => {
  showChatSession.value = false
  chatStore.clearSelectedChat()
}

const sendMessage = async (messageData) => {
  try {
    await chatStore.sendMessage(messageData)
  } catch (error) {
    console.error('Error sending message:', error)
  }
}

const editMessage = async (messageId, content) => {
  try {
    await chatStore.editMessage(messageId, content)
  } catch (error) {
    console.error('Error editing message:', error)
  }
}

const deleteMessage = async (messageId) => {
  try {
    await chatStore.deleteMessage(messageId)
  } catch (error) {
    console.error('Error deleting message:', error)
  }
}

const markAsRead = async (chatId) => {
  try {
    await chatStore.markAsRead(chatId)
    socket.emit('mark_messages_read', { chatId })
  } catch (error) {
    console.error('Error marking as read:', error)
  }
}

const handleFileUpload = async (files) => {
  if (!selectedChatId.value) return
  
  try {
    await chatStore.uploadFiles(files, selectedChatId.value)
  } catch (error) {
    console.error('Error uploading files:', error)
  }
}

const cancelUpload = (uploadId) => {
  chatStore.cancelUpload(uploadId)
}

const cancelAllUploads = () => {
  chatStore.cancelAllUploads()
}

const clearCompletedUploads = () => {
  chatStore.clearCompletedUploads()
}

const handleSearch = (query) => {
  searchQuery.value = query
}

const handleGroupCreated = (group) => {
  chatStore.addChat(group)
  showGroupCreator.value = false
}

const handleAnnouncementSent = () => {
  showAnnouncementCreator.value = false
}

const handleStatusCreated = (status) => {
  chatStore.addStatus(status)
  showStatusCreator.value = false
}

const handleSettingsUpdated = (settings) => {
  userStore.updateSettings(settings)
  showSettings.value = false
}

const startCall = (callData) => {
  activeCall.value = callData
  socket.emit('initiate_call', callData)
}

const endCall = () => {
  if (activeCall.value) {
    socket.emit('end_call', { callId: activeCall.value.id })
    activeCall.value = null
  }
}

const toggleMute = () => {
  if (activeCall.value) {
    activeCall.value.isMuted = !activeCall.value.isMuted
  }
}

const toggleVideo = () => {
  if (activeCall.value) {
    activeCall.value.isVideoEnabled = !activeCall.value.isVideoEnabled
  }
}

// Socket event handlers
const setupSocketListeners = () => {
  socket.on('new_message', (message) => {
    chatStore.addMessage(message)
  })

  socket.on('message_edited', (data) => {
    chatStore.updateMessage(data.messageId, { 
      content: data.content, 
      isEdited: true, 
      editedAt: data.editedAt 
    })
  })

  socket.on('message_deleted', (data) => {
    chatStore.updateMessage(data.messageId, { 
      isDeleted: true, 
      deletedAt: data.deletedAt 
    })
  })

  socket.on('user_typing', (data) => {
    chatStore.setTypingUser(data.chatId, data.userId, data.isTyping)
  })

  socket.on('messages_read', (data) => {
    chatStore.markMessagesAsRead(data.chatId, data.readBy.id)
  })

  socket.on('pal_online_status', (data) => {
    chatStore.updateUserOnlineStatus(data.userId, data.isOnline)
  })

  socket.on('incoming_call', (data) => {
    activeCall.value = {
      ...data,
      isIncoming: true,
      isActive: false
    }
  })

  socket.on('call_accepted', (data) => {
    if (activeCall.value && activeCall.value.callId === data.callId) {
      activeCall.value.isActive = true
    }
  })

  socket.on('call_rejected', (data) => {
    if (activeCall.value && activeCall.value.callId === data.callId) {
      activeCall.value = null
    }
  })

  socket.on('call_ended', (data) => {
    if (activeCall.value && activeCall.value.callId === data.callId) {
      activeCall.value = null
    }
  })
}

// Lifecycle
onMounted(async () => {
  try {
    // Load initial data
    await Promise.all([
      chatStore.loadChats(),
      chatStore.loadContacts(),
      chatStore.loadOnlinePals(),
      chatStore.loadStatusUsers()
    ])

    // Setup socket listeners
    if (isConnected.value) {
      setupSocketListeners()
    }
  } catch (error) {
    console.error('Error initializing chat:', error)
  }
})

onUnmounted(() => {
  // Clean up socket listeners
  socket.off('new_message')
  socket.off('message_edited')
  socket.off('message_deleted')
  socket.off('user_typing')
  socket.off('messages_read')
  socket.off('pal_online_status')
  socket.off('incoming_call')
  socket.off('call_accepted')
  socket.off('call_rejected')
  socket.off('call_ended')
})
</script>

<style scoped>
/* Same styles as before */
</style>

