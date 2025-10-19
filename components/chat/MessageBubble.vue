<!-- components/chat/MessageBubble.vue -->
<template>
  <div 
    class="message-bubble"
    :class="{ 
      'own-message': isOwn, 
      'system-message': message.messageType === 'system',
      'deleted-message': message.isDeleted,
      'edited-message': message.isEdited
    }"
    @contextmenu="handleContextMenu"
  >
    <!-- Sender Avatar (for group chats) -->
    <div v-if="showAvatar && !isOwn" class="message-avatar">
      <img 
        :src="message.sender?.avatar || '/default-avatar.png'" 
        :alt="message.sender?.username"
      />
    </div>

    <!-- Message Content -->
    <div class="message-content">
      <!-- Sender Name (for group chats) -->
      <div v-if="showName && !isOwn" class="sender-name">
        {{ message.sender?.username }}
      </div>

      <!-- Reply Preview -->
      <div v-if="message.replyToId && message.quotedMessage" class="reply-preview">
        <div class="reply-line"></div>
        <div class="reply-content">
          <div class="reply-sender">{{ message.quotedMessage.sender?.username }}</div>
          <div class="reply-text">{{ message.quotedMessage.content }}</div>
        </div>
      </div>

      <!-- Message Body -->
      <div class="message-body" :class="`${message.messageType}-message`">
        <!-- Text Message -->
        <div v-if="message.messageType === 'text' && !message.isDeleted" class="text-message">
          <div class="message-text" v-html="formatMessageText(message.content)"></div>
        </div>

        <!-- Image Message -->
        <div v-else-if="message.messageType === 'image'" class="image-message">
          <div class="image-container" @click="openImageViewer">
            <img 
              :src="message.mediaUrl" 
              :alt="message.mediaMetadata?.originalName"
              @load="handleImageLoad"
            />
            <div v-if="imageLoading" class="image-loading">
              <div class="loading-spinner"></div>
            </div>
          </div>
          <div v-if="message.content" class="image-caption">{{ message.content }}</div>
        </div>

        <!-- Video Message -->
        <div v-else-if="message.messageType === 'video'" class="video-message">
          <div class="video-container">
            <video 
              :src="message.mediaUrl"
              controls
              @loadedmetadata="handleVideoLoad"
            ></video>
            <div v-if="message.mediaMetadata?.duration" class="video-duration">
              {{ formatDuration(message.mediaMetadata.duration) }}
            </div>
          </div>
          <div v-if="message.content" class="video-caption">{{ message.content }}</div>
        </div>

        <!-- Audio Message -->
        <div v-else-if="message.messageType === 'audio'" class="audio-message">
          <div class="audio-player">
            <button class="play-btn" @click="toggleAudioPlayback">
              <Icon :name="isAudioPlaying ? 'pause' : 'play'" size="20" />
            </button>
            <div class="audio-waveform">
              <div class="waveform-bars">
                <div 
                  v-for="(bar, index) in audioWaveform" 
                  :key="index"
                  class="waveform-bar"
                  :style="{ height: bar + '%' }"
                ></div>
              </div>
              <div class="audio-progress" :style="{ width: audioProgress + '%' }"></div>
            </div>
            <div class="audio-duration">{{ formatDuration(message.mediaMetadata?.duration || 0) }}</div>
          </div>
        </div>

        <!-- Voice Note -->
        <div v-else-if="message.messageType === 'voice'" class="voice-note">
          <div class="audio-player">
            <button class="voice-play-btn" @click="toggleVoicePlayback">
              <Icon :name="isVoicePlaying ? 'pause' : 'play'" size="20" />
            </button>
            <div class="voice-waveform">
              <div class="voice-bars">
                <div 
                  v-for="i in 20" 
                  :key="i"
                  class="voice-bar"
                  :class="{ active: i <= (voiceProgress / 5) }"
                ></div>
              </div>
            </div>
            <div class="voice-duration">{{ formatDuration(message.mediaMetadata?.duration || 0) }}</div>
          </div>
        </div>

        <!-- File Message -->
        <div v-else-if="message.messageType === 'file'" class="file-message">
          <div class="file-container" @click="downloadFile">
            <div class="file-icon">
              <Icon :name="getFileIcon(message.mediaMetadata?.mimeType)" size="24" />
            </div>
            <div class="file-info">
              <div class="file-name">{{ message.mediaMetadata?.originalName || 'File' }}</div>
              <div class="file-size">{{ formatFileSize(message.mediaMetadata?.size) }}</div>
            </div>
            <div class="download-btn">
              <Icon name="download" size="20" />
            </div>
          </div>
        </div>

        <!-- System Message -->
        <div v-else-if="message.messageType === 'system'" class="system-message-content">
          <Icon name="info" />
          <span>{{ message.content }}</span>
        </div>
      </div>

      <!-- Deleted Message -->
      <div v-else class="deleted-message-content">
        <Icon name="trash-2" />
        <span>This message was deleted</span>
      </div>

      <!-- Message Footer -->
      <div class="message-footer">
        <div class="message-time">
          {{ formatMessageTime(message.createdAt) }}
          <span v-if="message.isEdited" class="edited-indicator">edited</span>
        </div>
        
        <!-- Message Status (for own messages) -->
        <div v-if="isOwn && !message.isDeleted" class="message-status">
          <Icon 
            v-if="message.readAt"
            name="check-check" 
            class="read-icon"
          />
          <Icon 
            v-else-if="message.deliveredAt"
            name="check" 
            class="delivered-icon"
          />
          <Icon 
            v-else
            name="clock" 
            class="pending-icon"
          />
        </div>
      </div>

      <!-- Message Reactions -->
      <div v-if="groupedReactions.length > 0" class="message-reactions">
        <div 
          v-for="reaction in groupedReactions"
          :key="reaction.emoji"
          class="reaction-item"
          :class="{ 'own-reaction': reaction.hasOwnReaction }"
          @click="toggleReaction(reaction.emoji)"
        >
          <span class="reaction-emoji">{{ reaction.emoji }}</span>
          <span class="reaction-count">{{ reaction.count }}</span>
        </div>
      </div>
    </div>

    <!-- Context Menu -->
    <ContextMenu
      v-if="contextMenu.show"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :items="contextMenu.items"
      @select="handleContextMenuSelect"
      @close="contextMenu.show = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { format } from 'date-fns'
import Icon from '@/components/ui/Icon.vue'
import ContextMenu from '@/components/ui/ContextMenu.vue'

// Props
const props = defineProps({
  message: Object,
  isOwn: Boolean,
  showAvatar: Boolean,
  showName: Boolean
})

// Emits
const emit = defineEmits(['edit', 'delete', 'reply', 'react'])

// Store
const userStore = useUserStore()

// Reactive data
const imageLoading = ref(true)
const isAudioPlaying = ref(false)
const isVoicePlaying = ref(false)
const audioProgress = ref(0)
const voiceProgress = ref(0)
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  items: []
})

// Audio elements
let audioElement = null
let voiceElement = null

// Computed properties
const audioWaveform = computed(() => {
  // Generate random waveform for demo
  return Array.from({ length: 30 }, () => Math.random() * 100)
})

const groupedReactions = computed(() => {
  if (!props.message.reactions) return []
  
  const grouped = {}
  props.message.reactions.forEach(reaction => {
    if (!grouped[reaction.emoji]) {
      grouped[reaction.emoji] = {
        emoji: reaction.emoji,
        count: 0,
        hasOwnReaction: false,
        users: []
      }
    }
    grouped[reaction.emoji].count++
    grouped[reaction.emoji].users.push(reaction.user)
    
    if (reaction.userId === userStore.user?.id) {
      grouped[reaction.emoji].hasOwnReaction = true
    }
  })
  
  return Object.values(grouped)
})

// Methods
const formatMessageText = (text) => {
  if (!text) return ''
  
  // Convert URLs to links
  const urlRegex = /(https?:\/\/[^\s]+)/g
  text = text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
  
  // Convert line breaks to <br>
  text = text.replace(/\n/g, '<br>')
  
  // Convert emojis (basic implementation)
  text = text.replace(/:(\w+):/g, '<span class="emoji">$1</span>')
  
  return text
}

const formatMessageTime = (timestamp) => {
  return format(new Date(timestamp), 'HH:mm')
}

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

const getFileIcon = (mimeType) => {
  if (!mimeType) return 'file'
  
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'music'
  if (mimeType.includes('pdf')) return 'file-text'
  if (mimeType.includes('word')) return 'file-text'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'file-spreadsheet'
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'archive'
  
  return 'file'
}

const handleImageLoad = () => {
  imageLoading.value = false
}

const handleVideoLoad = () => {
  console.log('Video loaded')
}

const openImageViewer = () => {
  // Open image in full screen viewer
  console.log('Open image viewer for:', props.message.mediaUrl)
}

const downloadFile = () => {
  // Download file
  const link = document.createElement('a')
  link.href = props.message.mediaUrl
  link.download = props.message.mediaMetadata?.originalName || 'file'
  link.click()
}

const toggleAudioPlayback = () => {
  if (!audioElement) {
    audioElement = new Audio(props.message.mediaUrl)
    audioElement.addEventListener('timeupdate', updateAudioProgress)
    audioElement.addEventListener('ended', () => {
      isAudioPlaying.value = false
      audioProgress.value = 0
    })
  }
  
  if (isAudioPlaying.value) {
    audioElement.pause()
  } else {
    audioElement.play()
  }
  
  isAudioPlaying.value = !isAudioPlaying.value
}

const toggleVoicePlayback = () => {
  if (!voiceElement) {
    voiceElement = new Audio(props.message.mediaUrl)
    voiceElement.addEventListener('timeupdate', updateVoiceProgress)
    voiceElement.addEventListener('ended', () => {
      isVoicePlaying.value = false
      voiceProgress.value = 0
    })
  }
  
  if (isVoicePlaying.value) {
    voiceElement.pause()
  } else {
    voiceElement.play()
  }
  
  isVoicePlaying.value = !isVoicePlaying.value
}

const updateAudioProgress = () => {
  if (audioElement) {
    audioProgress.value = (audioElement.currentTime / audioElement.duration) * 100
  }
}

const updateVoiceProgress = () => {
  if (voiceElement) {
    voiceProgress.value = (voiceElement.currentTime / voiceElement.duration) * 100
  }
}

const handleContextMenu = (event) => {
  if (props.message.messageType === 'system') return
  
  event.preventDefault()
  
  const items = []
  
  // Reply option
  items.push({
    id: 'reply',
    label: 'Reply',
    icon: 'corner-up-left'
  })
  
  // Copy option for text messages
  if (props.message.messageType === 'text' && !props.message.isDeleted) {
    items.push({
      id: 'copy',
      label: 'Copy',
      icon: 'copy'
    })
  }
  
  // Edit option (own messages, within 35 minutes)
  if (props.isOwn && !props.message.isDeleted && canEditMessage()) {
    items.push({
      id: 'edit',
      label: 'Edit',
      icon: 'edit-3'
    })
  }
  
  // Delete option (own messages)
  if (props.isOwn && !props.message.isDeleted) {
    items.push({
      id: 'delete',
      label: 'Delete',
      icon: 'trash-2',
      danger: true
    })
  }
  
  // Forward option
  if (!props.message.isDeleted) {
    items.push({
      id: 'forward',
      label: 'Forward',
      icon: 'share'
    })
  }
  
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    items
  }
}

const handleContextMenuSelect = (itemId) => {
  switch (itemId) {
    case 'reply':
      emit('reply', props.message)
      break
    case 'copy':
      navigator.clipboard.writeText(props.message.content)
      break
    case 'edit':
      emit('edit', props.message)
      break
    case 'delete':
      emit('delete', props.message.id)
      break
    case 'forward':
      // Handle forward
      console.log('Forward message:', props.message.id)
      break
  }
  
  contextMenu.value.show = false
}

const canEditMessage = () => {
  if (props.message.messageType !== 'text') return false
  
  const editWindow = 35 * 60 * 1000 // 35 minutes
  const timeSinceCreation = Date.now() - new Date(props.message.createdAt).getTime()
  
  return timeSinceCreation <= editWindow
}

const toggleReaction = (emoji) => {
  emit('react', props.message.id, emoji)
}

// Lifecycle
onUnmounted(() => {
  if (audioElement) {
    audioElement.pause()
    audioElement = null
  }
  if (voiceElement) {
    voiceElement.pause()
    voiceElement = null
  }
})
</script>

<style scoped>
.message-bubble {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  max-width: 70%;
}

.message-bubble.own-message {
  margin-left: auto;
  flex-direction: row-reverse;
}

.message-bubble.system-message {
  justify-content: center;
  max-width: 100%;
}

.message-avatar {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.message-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.sender-name {
  font-size: 12px;
  font-weight: 600;
  color: #1976d2;
  margin-bottom: 4px;
}

.reply-preview {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  padding: 8px;
  background: rgba(25, 118, 210, 0.1);
  border-radius: 8px;
  border-left: 3px solid #1976d2;
}

.reply-line {
  width: 2px;
  background: #1976d2;
  border-radius: 1px;
}

.reply-content {
  flex: 1;
}

.reply-sender {
  font-size: 12px;
  font-weight: 600;
  color: #1976d2;
  margin-bottom: 2px;
}

.reply-text {
  font-size: 13px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-body {
  background: white;
  border-radius: 16px;
  padding: 12px 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  position: relative;
}

.own-message .message-body {
  background: #1976d2;
  color: white;
}

.system-message .message-body {
  background: #f5f5f5;
  color: #666;
  text-align: center;
  border-radius: 20px;
  padding: 8px 16px;
}

.deleted-message .message-body {
  background: #f5f5f5;
  color: #999;
  font-style: italic;
}

.text-message .message-text {
  word-wrap: break-word;
  line-height: 1.4;
}

.text-message .message-text :deep(a) {
  color: inherit;
  text-decoration: underline;
}

.own-message .text-message .message-text :deep(a) {
  color: #bbdefb;
}

.image-message .image-container {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  max-width: 300px;
}

.image-message img {
  width: 100%;
  height: auto;
  display: block;
}

.image-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.image-caption,
.video-caption {
  margin-top: 8px;
  font-size: 14px;
}

.video-message .video-container {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  max-width: 300px;
}

.video-message video {
  width: 100%;
  height: auto;
  display: block;
}

.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.audio-message,
.voice-note {
  min-width: 200px;
}

.audio-player,
.voice-player {
  display: flex;
  align-items: center;
  gap: 12px;
}

.play-btn,
.voice-play-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #1976d2;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.own-message .play-btn,
.own-message .voice-play-btn {
  background: white;
  color: #1976d2;
}

.play-btn:hover,
.voice-play-btn:hover {
  background: #1565c0;
}

.own-message .play-btn:hover,
.own-message .voice-play-btn:hover {
  background: #f5f5f5;
}

.audio-waveform {
  flex: 1;
  height: 30px;
  position: relative;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 15px;
  overflow: hidden;
}

.own-message .audio-waveform {
  background: rgba(255, 255, 255, 0.2);
}

.waveform-bars {
  display: flex;
  align-items: end;
  height: 100%;
  gap: 1px;
  padding: 4px;
}

.waveform-bar {
  flex: 1;
  background: #1976d2;
  border-radius: 1px;
  min-height: 2px;
}

.own-message .waveform-bar {
  background: white;
}

.audio-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(25, 118, 210, 0.3);
  transition: width 0.1s;
}

.own-message .audio-progress {
  background: rgba(255, 255, 255, 0.3);
}

.voice-waveform {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 2px;
  height: 20px;
}

.voice-bars {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 100%;
}

.voice-bar {
  width: 3px;
  height: 4px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 2px;
  transition: all 0.2s;
}

.voice-bar.active {
  height: 16px;
  background: #1976d2;
}

.own-message .voice-bar {
  background: rgba(255, 255, 255, 0.4);
}

.own-message .voice-bar.active {
  background: white;
}

.audio-duration,
.voice-duration {
  font-size: 12px;
  color: #666;
  flex-shrink: 0;
}

.own-message .audio-duration,
.own-message .voice-duration {
  color: rgba(255, 255, 255, 0.8);
}

.file-message .file-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.file-container:hover {
  background: rgba(0, 0, 0, 0.05);
}

.own-message .file-container:hover {
  background: rgba(255, 255, 255, 0.1);
}

.file-icon {
  width: 40px;
  height: 40px;
  background: #e0e0e0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  flex-shrink: 0;
}

.own-message .file-icon {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.own-message .file-size {
  color: rgba(255, 255, 255, 0.8);
}

.download-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  flex-shrink: 0;
}

.own-message .download-btn {
  color: rgba(255, 255, 255, 0.8);
}

.system-message-content,
.deleted-message-content {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.message-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  gap: 8px;
}

.message-time {
  font-size: 11px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 4px;
}

.own-message .message-time {
  color: rgba(255, 255, 255, 0.7);
}

.edited-indicator {
  font-style: italic;
  opacity: 0.7;
}

.message-status {
  display: flex;
  align-items: center;
}

.read-icon {
  color: #4caf50;
  width: 14px;
  height: 14px;
}

.delivered-icon {
  color: rgba(255, 255, 255, 0.7);
  width: 14px;
  height: 14px;
}

.pending-icon {
  color: rgba(255, 255, 255, 0.5);
  width: 14px;
  height: 14px;
}

.message-reactions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.reaction-item {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 2px 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
}

.reaction-item:hover {
  background: rgba(0, 0, 0, 0.1);
}

.reaction-item.own-reaction {
  background: #e3f2fd;
  border-color: #1976d2;
  color: #1976d2;
}

.reaction-emoji {
  font-size: 14px;
}

.reaction-count {
  font-weight: 500;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .message-bubble {
    max-width: 85%;
  }
  
  .image-message .image-container,
  .video-message .video-container {
    max-width: 250px;
  }
  
  .audio-message,
  .voice-note {
    min-width: 150px;
  }
}
</style>
