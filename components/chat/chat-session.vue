<!-- CORRECTED FILE: components/chat/chat-session.vue -->
<!-- All imports fixed: ~ changed to @, kebab-case component names -->

<template>
  <div class="chat-session">
    <!-- Chat Header -->
    <div class="session-header">
      <div class="header-left">
        <button class="back-btn" @click="$emit('back')" v-if="isMobile">
          <icon name="arrow-left" />
        </button>
        
        <div class="chat-avatar" @click="viewProfile">
          <img 
            v-if="chat.type === 'direct'"
            :src="chat.avatar || '/default-avatar.svg'" 
            :alt="chat.name"
          />
          <div v-else class="group-avatar">
            <icon name="users" />
          </div>
          
          <div 
            v-if="chat.type === 'direct' && chat.isOnline" 
            class="online-indicator"
          ></div>
        </div>
        
        <div class="chat-info">
          <div class="chat-name">
            {{ chat.name }}
            <icon v-if="chat.isVerified" name="check-circle" class="verified-icon" />
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
          <icon name="video" />
        </button>
        <button class="header-btn" @click="startVoiceCall">
          <icon name="phone" />
        </button>
        <div class="more-menu" ref="moreMenu">
          <button class="header-btn" @click="toggleMoreMenu">
            <icon name="more-vertical" />
          </button>
          
          <div class="dropdown-menu" v-if="showMoreMenu">
            <button @click="viewProfile" class="menu-item">
              <icon name="user" />
              {{ chat.type === 'direct' ? 'View Contact' : 'Group Info' }}
            </button>
            <button @click="viewSharedMedia" class="menu-item">
              <icon name="image" />
              Media, Links, Docs
            </button>
            <button @click="toggleMute" class="menu-item">
              <icon :name="chat.isMuted ? 'volume-2' : 'volume-x'" />
              {{ chat.isMuted ? 'Unmute' : 'Mute' }}
            </button>
            <button v-if="chat.type === 'direct'" @click="blockUser" class="menu-item danger">
              <icon name="user-x" />
              Block User
            </button>
            <button @click="clearChat" class="menu-item danger">
              <icon name="trash-2" />
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
              'own-message': message.senderId === currentUser?.id,
              'system-message': message.messageType === 'system'
            }"
          >
            <message-bubble
              :message="message"
              :chat-id="chat.id"
              :isOwn="message.senderId === currentUser?.id"
              :showAvatar="shouldShowAvatar(message, group)"
              :showSenderName="shouldShowName(message, group)"
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
          <icon name="message-circle" />
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
            <icon name="corner-up-left" />
            <span>Replying to {{ replyingTo.senderName }}</span>
          </div>
          <div class="reply-message">{{ getMessagePreview(replyingTo) }}</div>
        </div>
        <button @click="cancelReply" class="cancel-reply">
          <icon name="x" />
        </button>
      </div>
      
      <!-- Editing preview -->
      <div v-if="editingMessage" class="edit-preview">
        <div class="edit-content">
          <div class="edit-header">
            <icon name="edit-3" />
            <span>Edit message</span>
          </div>
        </div>
        <button @click="cancelEdit" class="cancel-edit">
          <icon name="x" />
        </button>
      </div>
      
      <!-- Pending attachments -->
      <div v-if="pendingAttachments.length || isUploading || uploadError" class="attachment-tray">
        <span v-if="isUploading" class="attachment-chip">Uploading…</span>
        <span v-if="uploadError" class="attachment-error">{{ uploadError }}</span>
        <span
          v-for="(attachment, index) in pendingAttachments"
          :key="attachment.url"
          class="attachment-chip"
        >
          {{ attachment.name }}
          <button class="attachment-remove" @click="removeAttachment(index)">
            <icon name="x" />
          </button>
        </span>
      </div>

      <!-- Input area -->
      <div class="input-area">
        <button class="input-btn" @click="toggleEmojiPicker">
          <icon name="smile" />
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
          <icon name="paperclip" />
        </button>
        
        <button 
          v-if="messageText.trim() || hasAttachment"
          class="send-btn"
          @click="sendMessage"
          :disabled="isSending"
        >
          <icon name="send" />
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
          <icon name="mic" />
        </button>
      </div>
      
      <!-- Voice recording indicator -->
      <div v-if="isRecording" class="voice-recording">
        <div class="recording-indicator">
          <div class="recording-dot"></div>
          <span>Recording... {{ recordingDuration }}s</span>
        </div>
        <button @click="cancelVoiceRecording" class="cancel-recording">
          <icon name="x" />
        </button>
      </div>
    </div>

    <input
      ref="cameraInput"
      type="file"
      accept="image/*,video/*"
      capture="environment"
      class="hidden-input"
      @change="handleCameraCapture"
    />

    <!-- Shared media -->
    <div v-if="showSharedMedia" class="shared-media-overlay" @click.self="showSharedMedia = false">
      <div class="shared-media-panel">
        <div class="shared-media-header">
          <h3>Media, links and docs</h3>
          <button class="header-btn" @click="showSharedMedia = false"><icon name="x" /></button>
        </div>
        <p v-if="!sharedMedia.length" class="shared-media-empty">Nothing shared in this chat yet</p>
        <div v-else class="shared-media-grid">
          <a
            v-for="item in sharedMedia"
            :key="`${item.messageId}-${item.url}`"
            :href="item.url"
            target="_blank"
            rel="noopener"
            class="shared-media-item"
          >
            <img v-if="item.messageType === 'image'" :src="item.url" alt="" />
            <video v-else-if="item.messageType === 'video'" :src="item.url" />
            <span v-else class="shared-media-file"><icon name="file" /></span>
          </a>
        </div>
      </div>
    </div>

    <!-- Attachment Menu -->
    <attachment-menu
      v-if="showAttachmentMenu"
      @close="showAttachmentMenu = false"
      @selectFile="handleFileSelect"
      @selectCamera="openCamera"
      @selectLocation="shareLocation"
    />

    <!-- Emoji Picker -->
    <emoji-picker
      v-if="showEmojiPicker"
      @close="showEmojiPicker = false"
      @select="insertEmoji"
    />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSocket } from '@/composables/use-socket'
import { useUserStore } from '@/stores/user'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'
import Icon from '@/components/ui/icon.vue'
import MessageBubble from './message-bubble.vue'
import AttachmentMenu from './attachment-menu.vue'
import EmojiPicker from './emoji-picker.vue'

// Props
const props = defineProps({
  chat: Object,
  currentUser: Object,
  messages: { type: Array, default: () => [] },
  // Typing state is owned by the layout (it is the socket listener), so it
  // arrives as a prop rather than being tracked twice.
  typingUsers: { type: Array, default: () => [] },
  isLoading: Boolean
})

// Emits
const emit = defineEmits([
  'sendMessage', 'editMessage', 'deleteMessage', 'reactMessage', 'markAsRead',
  'startCall', 'typing', 'membershipChanged', 'blocked', 'cleared', 'back'
])

// Stores and composables
const router = useRouter()
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
const typingTimeout = ref(null)
const pendingAttachments = ref([])
const isUploading = ref(false)
const uploadError = ref('')
const mediaRecorder = ref(null)
const recordedChunks = ref([])
const recordingTimer = ref(null)
const cameraInput = ref(null)
const showSharedMedia = ref(false)
const sharedMedia = ref([])

const hasAttachment = computed(() => pendingAttachments.value.length > 0)

// Refs
const messagesContainer = ref(null)
const messageInput = ref(null)
const moreMenu = ref(null)

// Computed
const isMobile = computed(() => window.innerWidth <= 768)

const groupedMessages = computed(() => {
  const groups = {}
  
  props.messages.forEach(message => {
    const date = format(new Date(message.timestamp), 'yyyy-MM-dd')
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
  if (textarea) {
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
  }
  
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
  emit('typing', isTyping)
}

const sendMessage = async () => {
  if ((!messageText.value.trim() && !hasAttachment.value) || isSending.value) return
  
  isSending.value = true
  
  try {
    const attachments = pendingAttachments.value.map(item => item.url)
    const messageData = {
      chatId: props.chat.id,
      content: messageText.value.trim(),
      messageType: attachments.length ? pendingAttachments.value[0].type : 'text',
      attachments,
      replyTo: replyingTo.value
        ? {
            id: replyingTo.value.id,
            senderId: replyingTo.value.senderId,
            content: replyingTo.value.content
          }
        : undefined
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
      pendingAttachments.value = []
      cancelReply()

      if (messageInput.value) messageInput.value.style.height = 'auto'
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
  emit('reactMessage', messageId, reaction)
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

const startVoiceRecording = async () => {
  if (isRecording.value) return

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    recordedChunks.value = []
    recorder.ondataavailable = (recordEvent) => {
      if (recordEvent.data.size > 0) recordedChunks.value.push(recordEvent.data)
    }
    recorder.start()
    mediaRecorder.value = recorder
  } catch (error) {
    console.error('Microphone unavailable:', error)
    uploadError.value = 'Microphone permission is required for voice notes'
    return
  }

  isRecording.value = true
  recordingDuration.value = 0
  recordingTimer.value = setInterval(() => {
    recordingDuration.value++
    if (recordingDuration.value >= 60) stopVoiceRecording()
  }, 1000)

  socket.emit('voice_message_start', { chatId: props.chat.id })
}

const releaseRecorder = () => {
  if (recordingTimer.value) clearInterval(recordingTimer.value)
  recordingTimer.value = null
  mediaRecorder.value?.stream?.getTracks().forEach(track => track.stop())
}

const stopVoiceRecording = async () => {
  if (!isRecording.value || !mediaRecorder.value) return

  isRecording.value = false
  socket.emit('voice_message_stop', { chatId: props.chat.id })

  const recorder = mediaRecorder.value
  const stopped = new Promise(resolve => { recorder.onstop = resolve })
  recorder.stop()
  await stopped
  releaseRecorder()

  const blob = new Blob(recordedChunks.value, { type: recorder.mimeType || 'audio/webm' })
  mediaRecorder.value = null
  recordedChunks.value = []
  if (!blob.size) return

  const uploaded = await uploadBlob(blob, `voice-note-${Date.now()}.webm`)
  if (!uploaded) return

  await emit('sendMessage', {
    chatId: props.chat.id,
    content: '',
    messageType: 'audio',
    attachments: [uploaded]
  })
  scrollToBottom()
}

const cancelVoiceRecording = () => {
  if (!isRecording.value) return
  isRecording.value = false
  recordingDuration.value = 0
  mediaRecorder.value?.stop()
  mediaRecorder.value = null
  recordedChunks.value = []
  releaseRecorder()

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

const attachmentKind = (file) => {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'audio'
  return 'file'
}

/** Uploads through the shared storage endpoint and returns the public URL. */
const uploadBlob = async (blob, filename) => {
  uploadError.value = ''
  isUploading.value = true
  try {
    const form = new FormData()
    form.append('file', blob, filename)
    form.append('bucket', 'chat-media')
    const response = await $fetch('/api/upload', { method: 'POST', body: form })
    const url = response?.url || response?.data?.url
    if (!url) throw new Error('Upload returned no url')
    return url
  } catch (error) {
    console.error('Attachment upload failed:', error)
    uploadError.value = 'Could not upload that file'
    return null
  } finally {
    isUploading.value = false
  }
}

const handleFileSelect = async (fileData) => {
  showAttachmentMenu.value = false
  const file = fileData?.file ?? fileData
  if (!file) return

  const url = await uploadBlob(file, file.name || `upload-${Date.now()}`)
  if (!url) return

  pendingAttachments.value.push({
    url,
    name: file.name || 'attachment',
    type: fileData?.type || attachmentKind(file)
  })
}

const openCamera = () => {
  showAttachmentMenu.value = false
  cameraInput.value?.click()
}

const handleCameraCapture = async (changeEvent) => {
  const file = changeEvent.target.files?.[0]
  changeEvent.target.value = ''
  if (file) await handleFileSelect({ file, type: attachmentKind(file) })
}

const removeAttachment = (index) => {
  pendingAttachments.value.splice(index, 1)
}

const shareLocation = () => {
  showAttachmentMenu.value = false
  if (!navigator.geolocation) {
    uploadError.value = 'Location is not available on this device'
    return
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords
      emit('sendMessage', {
        chatId: props.chat.id,
        content: `https://www.google.com/maps?q=${latitude},${longitude}`,
        messageType: 'text'
      })
      scrollToBottom()
    },
    () => { uploadError.value = 'Location permission denied' }
  )
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
  showMoreMenu.value = false
  if (props.chat.type === 'direct' && props.chat.userId) {
    router.push(`/profile/${props.chat.userId}`)
  } else {
    router.push(`/groups/${props.chat.id}`)
  }
}

const viewSharedMedia = async () => {
  showMoreMenu.value = false
  showSharedMedia.value = true
  try {
    const response = await $fetch(`/api/chat/${props.chat.id}/media`)
    sharedMedia.value = response.data ?? []
  } catch (error) {
    console.error('Failed to load shared media:', error)
    sharedMedia.value = []
  }
}

const toggleMute = async () => {
  showMoreMenu.value = false
  try {
    const response = await $fetch(`/api/chat/${props.chat.id}/membership`, {
      method: 'PATCH',
      body: { muted: !props.chat.isMuted }
    })
    emit('membershipChanged', { chatId: props.chat.id, muted: response.muted })
  } catch (error) {
    console.error('Failed to update mute:', error)
  }
}

const blockUser = async () => {
  showMoreMenu.value = false
  if (props.chat.type !== 'direct' || !props.chat.userId) return
  try {
    await $fetch('/api/pals/block', {
      method: 'POST',
      body: { userId: props.chat.userId, action: 'block' }
    })
    emit('blocked', props.chat.userId)
  } catch (error) {
    console.error('Failed to block user:', error)
  }
}

const clearChat = async () => {
  showMoreMenu.value = false
  try {
    await $fetch(`/api/chat/${props.chat.id}/clear`, { method: 'POST' })
    emit('cleared', props.chat.id)
  } catch (error) {
    console.error('Failed to clear chat:', error)
  }
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
  socket.on('user_recording_voice', (data) => {
    if (data.chatId === props.chat.id) {
      console.log(`${data.username} is ${data.isRecording ? 'recording' : 'not recording'} voice`)
    }
  })
}

// Lifecycle
onMounted(() => {
  setupSocketListeners()
  document.addEventListener('click', handleClickOutside)
  scrollToBottom()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }
})

// Watch for new messages
watch(() => props.messages, () => {
  scrollToBottom()
}, { deep: true })
</script>
  
<style scoped>
.chat-session {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

.session-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
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
  color: var(--color-text-muted);
  transition: background-color 0.2s;
}

.back-btn:hover {
  background: var(--color-bg-tertiary);
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
  background: var(--color-bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
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
  color: var(--color-text-muted);
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
  color: var(--color-text-muted);
  transition: background-color 0.2s;
}

.header-btn:hover {
  background: var(--color-bg-tertiary);
}

.more-menu {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--color-bg-secondary);
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
  background: var(--color-bg-tertiary);
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
  background: var(--color-bg-secondary);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  color: var(--color-text-muted);
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
  color: var(--color-text-muted);
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
  color: var(--color-text-muted);
  text-align: center;
}

.no-messages svg {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.message-input-container {
  background: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border);
  padding: 16px;
}

.reply-preview,
.edit-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-bg-tertiary);
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
  color: var(--color-text-muted);
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
  color: var(--color-text-muted);
  border-radius: 4px;
  transition: background-color 0.2s;
}

.cancel-reply:hover,
.cancel-edit:hover {
  background: var(--color-bg-tertiary);
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
  color: var(--color-text-muted);
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.input-btn:hover {
  background: var(--color-bg-tertiary);
}

.text-input-container {
  flex: 1;
  background: var(--color-bg-tertiary);
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
  color: var(--color-text-muted);
  transition: all 0.2s;
  flex-shrink: 0;
}

.voice-btn:hover {
  background: var(--color-bg-tertiary);
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
  background: var(--color-bg-secondary);
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

.attachment-tray {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 12px 0;
}

.attachment-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #eef2f7;
  font-size: 12px;
}

.attachment-remove {
  border: 0;
  background: none;
  cursor: pointer;
  line-height: 1;
}

.attachment-error {
  color: #FF2E88;
  font-size: 12px;
}

.hidden-input {
  display: none;
}

.shared-media-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
}

.shared-media-panel {
  width: min(520px, 94vw);
  max-height: 80vh;
  overflow: auto;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
}

.shared-media-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.shared-media-empty {
  color: #6b7280;
  font-size: 14px;
}

.shared-media-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 12px;
}

.shared-media-item img,
.shared-media-item video {
  width: 100%;
  height: 110px;
  object-fit: cover;
  border-radius: 8px;
}

.shared-media-file {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 110px;
  border-radius: 8px;
  background: #f3f4f6;
}
</style>
