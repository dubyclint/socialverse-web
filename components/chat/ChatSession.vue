<!-- components/chat/ChatSession.vue -->
<template>
  <div class="chat-session">
    <!-- Chat Header -->
    <div class="session-header">
      <div class="header-left">
        <button class="back-btn" @click="$emit('back')" v-if="isMobile">
          <Icon name="arrow-left" />
        </button>
        
        <div class="chat-avatar" @click="viewProfile">
          <img 
            v-if="chat.type === 'direct'"
            :src="chat.avatar || '/default-avatar.png'" 
            :alt="chat.name"
          />
          <div v-else class="group-avatar">
            <Icon name="users" />
          </div>
          
          <div 
            v-if="chat.type === 'direct' && chat.isOnline" 
            class="online-indicator"
          ></div>
        </div>
        
        <div class="chat-info">
          <div class="chat-name">
            {{ chat.name }}
            <Icon v-if="chat.isVerified" name="check-circle" class="verified-icon" />
          </div>
          <div class="chat-status">
            <span v-if="typingUsers.length > 0" class="typing-text">
              {{ getTypingText(typingUsers) }}
            </span>
            <span v-else-if="chat.type === 'direct'">
              {{ chat.isOnline ? 'Online' : `Last seen ${formatLastSeen(chat.lastSeen)}` }}
            </span>
            <span v-else>
              {{ chat.participantCount }} participants
            </span>
          </div>
        </div>
      </div>
      
      <div class="header-right">
        <button class="header-btn" @click="startVideoCall" v-if="chat.type === 'direct'">
          <Icon name="video" />
        </button>
        <button class="header-btn" @click="startVoiceCall">
          <Icon name="phone" />
        </button>
        <div class="more-menu" ref="moreMenu">
          <button class="header-btn" @click="toggleMoreMenu">
            <Icon name="more-vertical" />
          </button>
          
          <div class="dropdown-menu" v-if="showMoreMenu">
            <button @click="viewProfile" class="menu-item">
              <Icon name="user" />
              {{ chat.type === 'direct' ? 'View Contact' : 'Group Info' }}
            </button>
            <button @click="viewSharedMedia" class="menu-item">
              <Icon name="image" />
              Media, Links, Docs
            </button>
            <button @click="toggleMute" class="menu-item">
              <Icon :name="chat.isMuted ? 'volume-2' : 'volume-x'" />
              {{ chat.isMuted ? 'Unmute' : 'Mute' }}
            </button>
            <button v-if="chat.type === 'direct'" @click="blockUser" class="menu-item danger">
              <Icon name="user-x" />
              Block User
            </button>
            <button @click="clearChat" class="menu-item danger">
              <Icon name="trash-2" />
              Clear Chat
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Messages Container -->
    <div class="messages-container" ref="messagesContainer">
      <div class="messages-list">
        <!-- Date separator -->
        <div 
          v-for="(group, date) in groupedMessages" 
          :key="date"
          class="message-group"
        >
          <div class="date-separator">
            <span>{{ formatDate(date) }}</span>
          </div>
          
          <!-- Messages for this date -->
          <div 
            v-for="message in group" 
            :key="message.id"
            class="message-wrapper"
            :class="{ 
              'own-message': message.senderId === currentUser.id,
              'system-message': message.messageType === 'system'
            }"
          >
            <MessageBubble
              :message="message"
              :isOwn="message.senderId === currentUser.id"
              :showAvatar="shouldShowAvatar(message, group)"
              :showName="shouldShowName(message, group)"
              @edit="editMessage"
              @delete="deleteMessage"
              @reply="replyToMessage"
              @react="reactToMessage"
            />
          </div>
        </div>
        
        <!-- Loading indicator -->
        <div v-if="isLoading" class="loading-messages">
          <div class="loading-spinner"></div>
          <span>Loading messages...</span>
        </div>
        
        <!-- No messages -->
        <div v-if="!isLoading && messages.length === 0" class="no-messages">
          <Icon name="message-circle" />
          <p>No messages yet</p>
          <p>Send a message to start the conversation</p>
        </div>
      </div>
    </div>

    <!-- Message Input -->
    <div class="message-input-container">
      <!-- Reply preview -->
      <div v-if="replyingTo" class="reply-preview">
        <div class="reply-content">
          <div class="reply-header">
            <Icon name="corner-up-left" />
            <span>Replying to {{ replyingTo.senderName }}</span>
          </div>
          <div class="reply-message">{{ getMessagePreview(replyingTo) }}</div>
        </div>
        <button @click="cancelReply" class="cancel-reply">
          <Icon name="x" />
        </button>
      </div>
      
      <!-- Editing preview -->
      <div v-if="editingMessage" class="edit-preview">
        <div class="edit-content">
          <div class="edit-header">
            <Icon name="edit-3" />
            <span>Edit message</span>
          </div>
        </div>
        <button @click="cancelEdit" class="cancel-edit">
          <Icon name="x" />
        </button>
      </div>
      
      <!-- Input area -->
      <div class="input-area">
        <button class="input-btn" @click="toggleEmojiPicker">
          <Icon name="smile" />
        </button>
        
        <div class="text-input-container">
          <textarea
            ref="messageInput"
            v-model="messageText"
            :placeholder="getInputPlaceholder()"
            @keydown="handleKeyDown"
            @input="handleInput"
            @paste="handlePaste"
            class="message-input"
            rows="1"
          ></textarea>
        </div>
        
        <button class="input-btn" @click="toggleAttachmentMenu">
          <Icon name="paperclip" />
        </button>
        
        <button 
          v-if="messageText.trim() || hasAttachment"
          class="send-btn"
          @click="sendMessage"
          :disabled="isSending"
        >
          <Icon name="send" />
        </button>
        
        <button 
          v-else
          class="voice-btn"
          @mousedown="startVoiceRecording"
          @mouseup="stopVoiceRecording"
          @touchstart="startVoiceRecording"
          @touchend="stopVoiceRecording"
          :class="{ 'recording': isRecording }"
        >
          <Icon name="mic" />
        </button>
      </div>
      
      <!-- Voice recording indicator -->
      <div v-if="isRecording" class="voice-recording">
        <div class="recording-indicator">
          <div class="recording-dot"></div>
          <span>Recording... {{ recordingDuration }}s</span>
        </div>
        <button @click="cancelVoiceRecording" class="cancel-recording">
          <Icon name="x" />
        </button>
      </div>
    </div>

    <!-- Attachment Menu -->
    <AttachmentMenu
      v-if="showAttachmentMenu"
      @close="showAttachmentMenu = false"
      @selectFile="handleFileSelect"
      @selectCamera="openCamera"
      @selectLocation="shareLocation"
    />

    <!-- Emoji Picker -->
    <EmojiPicker
      v-if="showEmojiPicker"
      @close="showEmojiPicker = false"
      @select="insertEmoji"
    />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useSocket } from '@/composables/useSocket'
import { useUserStore } from '@/stores/userStore'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'
import Icon from '@/components/ui/Icon.vue'
import MessageBubble from './MessageBubble.vue'
import AttachmentMenu from './AttachmentMenu.vue'
import EmojiPicker from './EmojiPicker.vue'

// Props
const props = defineProps({
  chat: Object,
  currentUser: Object,
  messages: { type: Array, default: () => [] },
  isLoading: Boolean
})

// Emits
const emit = defineEmits([
  'sendMessage', 'editMessage', 'deleteMessage', 'markAsRead', 
  'startCall', 'back'
])

// Stores and composables
const userStore = useUserStore()
const { socket } = useSocket()

// Reactive data
const messageText = ref('')
const replyingTo = ref(null)
const editingMessage = ref(null)
const showMoreMenu = ref(false)
const showAttachmentMenu = ref(false)
const showEmojiPicker = ref(false)
const isRecording = ref(false)
const recordingDuration = ref(0)
const isSending = ref(false)
const hasAttachment = ref(false)
const typingUsers = ref([])
const typingTimeout = ref(null)

// Refs
const messagesContainer = ref(null)
const messageInput = ref(null)
const moreMenu = ref(null)

// Computed
const isMobile = computed(() => window.innerWidth <= 768)

const groupedMessages = computed(() => {
  const groups = {}
  
  props.messages.forEach(message => {
    const date = format(new Date(message.createdAt), 'yyyy-MM-dd')
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
  })
  
  return groups
})

// Methods
const getInputPlaceholder = () => {
  if (editingMessage.value) return 'Edit message...'
  if (props.chat.type === 'group') return `Message ${props.chat.name}`
  return `Message ${props.chat.name}`
}

const getTypingText = (users) => {
  if (users.length === 1) {
    return `${users[0].username} is typing...`
  } else if (users.length === 2) {
    return `${users[0].username} and ${users[1].username} are typing...`
  } else {
    return `${users.length} people are typing...`
  }
}

const formatLastSeen = (timestamp) => {
  if (!timestamp) return 'a while ago'
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMMM d, yyyy')
}

const shouldShowAvatar = (message, group) => {
  if (props.chat.type === 'direct') return false
  if (message.messageType === 'system') return false
  
  const messageIndex = group.findIndex(m => m.id === message.id)
  const nextMessage = group[messageIndex + 1]
  
  return !nextMessage || nextMessage.senderId !== message.senderId
}

const shouldShowName = (message, group) => {
  if (props.chat.type === 'direct') return false
  if (message.messageType === 'system') return false
  if (message.senderId === props.currentUser.id) return false
  
  const messageIndex = group.findIndex(m => m.id === message.id)
  const prevMessage = group[messageIndex - 1]
  
  return !prevMessage || prevMessage.senderId !== message.senderId
}

const getMessagePreview = (message) => {
  if (!message) return ''
  
  switch (message.messageType) {
    case 'text':
      return message.content
    case 'image':
      return '📷 Photo'
    case 'video':
      return '🎥 Video'
    case 'audio':
      return '🎵 Audio'
    case 'voice_note':
      return '🎤 Voice message'
    case 'file':
      return '📎 File'
    default:
      return 'Message'
  }
}

const handleKeyDown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  } else if (event.key === 'Escape') {
    cancelReply()
    cancelEdit()
  }
}

const handleInput = () => {
  // Auto-resize textarea
  const textarea = messageInput.value
  textarea.style.height = 'auto'
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
  
  // Send typing indicator
  if (messageText.value.trim()) {
    sendTypingIndicator(true)
    
    // Clear existing timeout
    if (typingTimeout.value) {
      clearTimeout(typingTimeout.value)
    }
    
    // Set timeout to stop typing indicator
    typingTimeout.value = setTimeout(() => {
      sendTypingIndicator(false)
    }, 2000)
  } else {
    sendTypingIndicator(false)
  }
}

const handlePaste = (event) => {
  const items = event.clipboardData.items
  
  for (let item of items) {
    if (item.type.indexOf('image') !== -1) {
      const file = item.getAsFile()
      handleFileSelect({ file, type: 'image' })
      event.preventDefault()
      break
    }
  }
}

const sendTypingIndicator = (isTyping) => {
  socket.emit('typing', {
    chatId: props.chat.id,
    isTyping
  })
}

const sendMessage = async () => {
  if ((!messageText.value.trim() && !hasAttachment.value) || isSending.value) return
  
  isSending.value = true
  
  try {
    const messageData = {
      chatId: props.chat.id,
      content: messageText.value.trim(),
      messageType: 'text',
      replyToId: replyingTo.value?.id || null,
      quotedMessage: replyingTo.value ? {
        id: replyingTo.value.id,
        content: replyingTo.value.content,
        senderName: replyingTo.value.senderName
      } : null,
      tempId: Date.now() // For optimistic updates
    }
    
    if (editingMessage.value) {
      // Edit existing message
      await emit('editMessage', editingMessage.value.id, messageText.value.trim())
      cancelEdit()
    } else {
      // Send new message
      await emit('sendMessage', messageData)
      
      // Clear input
      messageText.value = ''
      cancelReply()
      
      // Reset textarea height
      messageInput.value.style.height = 'auto'
    }
    
    // Stop typing indicator
    sendTypingIndicator(false)
    
    // Scroll to bottom
    scrollToBottom()
    
  } catch (error) {
    console.error('Error sending message:', error)
  } finally {
    isSending.value = false
  }
}

const editMessage = (message) => {
  editingMessage.value = message
  messageText.value = message.content
  messageInput.value?.focus()
}

const deleteMessage = async (messageId) => {
  try {
    await emit('deleteMessage', messageId)
  } catch (error) {
    console.error('Error deleting message:', error)
  }
}

const replyToMessage = (message) => {
  replyingTo.value = message
  messageInput.value?.focus()
}

const reactToMessage = (messageId, reaction) => {
  socket.emit('add_reaction', {
    messageId,
    reaction
  })
}

const cancelReply = () => {
  replyingTo.value = null
}

const cancelEdit = () => {
  editingMessage.value = null
  messageText.value = ''
  messageInput.value.style.height = 'auto'
}

const startVoiceCall = () => {
  emit('startCall', {
    targetUserId: props.chat.type === 'direct' ? props.chat.userId : null,
    chatId: props.chat.id,
    callType: 'voice'
  })
}

const startVideoCall = () => {
  emit('startCall', {
    targetUserId: props.chat.type === 'direct' ? props.chat.userId : null,
    chatId: props.chat.id,
    callType: 'video'
  })
}

const startVoiceRecording = () => {
  isRecording.value = true
  recordingDuration.value = 0
  
  // Start recording timer
  const recordingInterval = setInterval(() => {
    recordingDuration.value++
    if (recordingDuration.value >= 60) {
      stopVoiceRecording()
    }
  }, 1000)
  
  // Store interval for cleanup
  window.recordingInterval = recordingInterval
  
  // Emit recording start
  socket.emit('voice_message_start', { chatId: props.chat.id })
}

const stopVoiceRecording = () => {
  if (!isRecording.value) return
  
  isRecording.value = false
  clearInterval(window.recordingInterval)
  
  // Emit recording stop
  socket.emit('voice_message_stop', { chatId: props.chat.id })
  
  // Process voice recording (implement actual recording logic)
  console.log('Voice recording stopped, duration:', recordingDuration.value)
}

const cancelVoiceRecording = () => {
  isRecording.value = false
  recordingDuration.value = 0
  clearInterval(window.recordingInterval)
  
  socket.emit('voice_message_stop', { chatId: props.chat.id })
}

const toggleMoreMenu = () => {
  showMoreMenu.value = !showMoreMenu.value
}

const toggleAttachmentMenu = () => {
  showAttachmentMenu.value = !showAttachmentMenu.value
}

const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value
}

const handleFileSelect = (fileData) => {
  console.log('File selected:', fileData)
  hasAttachment.value = true
  showAttachmentMenu.value = false
  
  // Process file upload
  // This would integrate with your file upload service
}

const openCamera = () => {
  console.log('Open camera')
  showAttachmentMenu.value = false
}

const shareLocation = () => {
  console.log('Share location')
  showAttachmentMenu.value = false
}

const insertEmoji = (emoji) => {
  const cursorPos = messageInput.value.selectionStart
  const textBefore = messageText.value.substring(0, cursorPos)
  const textAfter = messageText.value.substring(cursorPos)
  
  messageText.value = textBefore + emoji + textAfter
  
  // Set cursor position after emoji
  nextTick(() => {
    messageInput.value.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length)
    messageInput.value.focus()
  })
  
  showEmojiPicker.value = false
}

const viewProfile = () => {
  console.log('View profile/group info')
}

const viewSharedMedia = () => {
  console.log('View shared media')
}

const toggleMute = () => {
  console.log('Toggle mute')
}

const blockUser = () => {
  console.log('Block user')
}

const clearChat = () => {
  console.log('Clear chat')
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const handleClickOutside = (event) => {
  if (moreMenu.value && !moreMenu.value.contains(event.target)) {
    showMoreMenu.value = false
  }
}

// Socket event handlers
const setupSocketListeners = () => {
  socket.on('user_typing', (data) => {
    if (data.chatId === props.chat.id && data.userId !== props.currentUser.id) {
      const existingUser = typingUsers.value.find(user => user.userId === data.userId)
      
      if (data.isTyping && !existingUser) {
        typingUsers.value.push({
          userId: data.userId,
          username: data.username
        })
      } else if (!data.isTyping && existingUser) {
        typingUsers.value = typingUsers.value.filter(user => user.userId !== data.userId)
      }
    }
  })
  
  socket.on('user_recording_voice', (data) => {
    if (data.chatId === props.chat.id) {
      console.log(`${data.username} is ${data.isRecording ? 'recording' : 'stopped recording'} voice message`)
    }
  })
}

// Watchers
watch(() => props.messages, () => {
  scrollToBottom()
}, { deep: true })

watch(() => props.chat.id, () => {
  // Clear typing users when switching chats
  typingUsers.value = []
  cancelReply()
  cancelEdit()
  messageText.value = ''
})

// Lifecycle
onMounted(() => {
  setupSocketListeners()
  scrollToBottom()
  document.addEventListener('click', handleClickOutside)
  
  // Mark messages as read when component mounts
  emit('markAsRead', props.chat.id)
})

onUnmounted(() => {
  // Clean up socket listeners
  socket.off('user_typing')
  socket.off('user_recording_voice')
  
  // Clear timeouts
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }
  if (window.recordingInterval) {
    clearInterval(window.recordingInterval)
  }
  
  // Send stop typing indicator
  sendTypingIndicator(false)
  
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.chat-session {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f5f5;
}

.session-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  min-height: 64px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.back-btn {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  color: #666;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background: #f5f5f5;
}

.chat-avatar {
  position: relative;
  width: 40px;
  height: 40px;
  cursor: pointer;
  flex-shrink: 0;
}

.chat-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.group-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
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

.chat-name {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  font-size: 16px;
  color: #333;
  margin-bottom: 2px;
}

.verified-icon {
  width: 14px;
  height: 14px;
  color: #1976d2;
  flex-shrink: 0;
}

.chat-status {
  font-size: 13px;
  color: #666;
}

.typing-text {
  color: #1976d2;
  font-style: italic;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-btn {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  color: #666;
  transition: background-color 0.2s;
}

.header-btn:hover {
  background: #f5f5f5;
}

.more-menu {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  z-index: 1000;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-item.danger {
  color: #f44336;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message-group {
  margin-bottom: 24px;
}

.date-separator {
  text-align: center;
  margin: 16px 0;
}

.date-separator span {
  background: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  color: #666;
  border: 1px solid #e0e0e0;
}

.message-wrapper {
  margin-bottom: 8px;
}

.message-wrapper.own-message {
  display: flex;
  justify-content: flex-end;
}

.message-wrapper.system-message {
  display: flex;
  justify-content: center;
}

.loading-messages {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: #666;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e0e0e0;
  border-top: 2px solid #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #666;
  text-align: center;
}

.no-messages svg {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.message-input-container {
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 16px;
}

.reply-preview,
.edit-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f5f5f5;
  border-left: 3px solid #1976d2;
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 4px;
}

.reply-content,
.edit-content {
  flex: 1;
}

.reply-header,
.edit-header {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #1976d2;
  font-weight: 500;
  margin-bottom: 2px;
}

.reply-message {
  font-size: 13px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cancel-reply,
.cancel-edit {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #666;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.cancel-reply:hover,
.cancel-edit:hover {
  background: #e0e0e0;
}

.input-area {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.input-btn {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  color: #666;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.input-btn:hover {
  background: #f5f5f5;
}

.text-input-container {
  flex: 1;
  background: #f5f5f5;
  border-radius: 20px;
  padding: 8px 16px;
}

.message-input {
  width: 100%;
  border: none;
  background: none;
  outline: none;
  resize: none;
  font-size: 14px;
  line-height: 1.4;
  max-height: 120px;
  overflow-y: auto;
}

.send-btn {
  background: #1976d2;
  border: none;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  color: white;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  background: #1565c0;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.voice-btn {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
  flex-shrink: 0;
}

.voice-btn:hover {
  background: #f5f5f5;
}

.voice-btn.recording {
  background: #f44336;
  color: white;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.voice-recording {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f44336;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  margin-top: 8px;
}

.recording-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.recording-dot {
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
}

.cancel-recording {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

/* Scrollbar styling */
.messages-container::-webkit-scrollbar {
  width: 4px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 2px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .session-header {
    padding: 8px 12px;
  }
  
  .messages-container {
    padding: 12px;
  }
  
  .message-input-container {
    padding: 12px;
  }
  
  .header-right .header-btn:not(.more-menu .header-btn) {
    display: none;
  }
}
</style>
