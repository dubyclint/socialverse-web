<!-- components/chat/message-bubble.vue -->
<!-- UPDATED MESSAGE BUBBLE COMPONENT -->
<!-- Integrates: New consolidated PewgiftButton component -->

<template>
  <div class="message-bubble" :class="messageClasses" @contextmenu="handleContextMenu">
    <!-- Sender Avatar (for group chats) -->
    <div v-if="showAvatar && !isOwn" class="message-avatar">
      <img :src="message.senderAvatar || '/default-avatar.png'" :alt="message.senderName" />
    </div>

    <!-- Message Content -->
    <div class="message-content">
      <!-- Sender Name (for group chats) -->
      <div v-if="showSenderName && !isOwn" class="sender-name">{{ message.senderName }}</div>

      <!-- Main Message -->
      <div class="message-text">
        <p v-if="!isTranslated">{{ message.content }}</p>
        <p v-else class="translated-text">{{ translatedContent }}</p>
        <span v-if="message.isEdited" class="edited-badge">(edited)</span>
      </div>

      <!-- Message Actions -->
      <div class="message-actions">
        <!-- Translation Button -->
        <button 
          v-if="!isTranslated && !message.isDeleted"
          @click="translateMessage"
          class="action-btn translate-btn"
          :disabled="isTranslating"
          title="Translate message"
        >
          <Icon name="globe" size="16" />
          {{ isTranslating ? 'Translating...' : 'Translate' }}
        </button>

        <!-- PewGift Button (NEW - Consolidated Component) -->
        <PewgiftButton 
          v-if="!isOwn && !message.isDeleted"
          :recipient-id="message.senderId"
          :post-id="message.chatId"
          :comment-id="message.id"
          @gift-sent="onGiftSent"
          @error="onGiftError"
          class="action-btn gift-btn"
        />

        <!-- Edit Button -->
        <button 
          v-if="isOwn && !message.isDeleted"
          @click="$emit('edit')"
          class="action-btn edit-btn"
          title="Edit message"
        >
          <Icon name="edit-2" size="16" />
        </button>

        <!-- Delete Button -->
        <button 
          v-if="isOwn && !message.isDeleted"
          @click="$emit('delete')"
          class="action-btn delete-btn"
          title="Delete message"
        >
          <Icon name="trash-2" size="16" />
        </button>
      </div>

      <!-- Timestamp -->
      <div class="message-time">{{ formatTime(message.timestamp) }}</div>
    </div>

    <!-- Context Menu -->
    <div v-if="showContextMenu" class="context-menu" :style="contextMenuPosition">
      <button @click="copyMessage" class="context-item">
        <Icon name="copy" size="16" />
        Copy
      </button>
      <button @click="replyMessage" class="context-item">
        <Icon name="reply" size="16" />
        Reply
      </button>
      <button v-if="isOwn" @click="$emit('edit')" class="context-item">
        <Icon name="edit-2" size="16" />
        Edit
      </button>
      <button v-if="isOwn" @click="$emit('delete')" class="context-item danger">
        <Icon name="trash-2" size="16" />
        Delete
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Icon from '~/components/Icon.vue'
import PewgiftButton from '~/components/PewgiftButton.vue'

interface Message {
  id: string
  chatId: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: string
  isEdited: boolean
  isDeleted: boolean
  messageType: string
}

const props = defineProps<{
  message: Message
  isOwn: boolean
  showAvatar?: boolean
  showSenderName?: boolean
}>()

const emit = defineEmits<{
  edit: []
  delete: []
  translate: [content: string]
  gift: [giftId: string, message: string]
}>()

// Reactive state
const isTranslated = ref(false)
const translatedContent = ref('')
const isTranslating = ref(false)
const showContextMenu = ref(false)
const contextMenuPosition = ref({ top: 0, left: 0 })

// Computed properties
const messageClasses = computed(() => ({
  'own-message': props.isOwn,
  'system-message': props.message.messageType === 'system',
  'deleted-message': props.message.isDeleted,
  'edited-message': props.message.isEdited,
  'translated-message': isTranslated.value
}))

// Methods
const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const translateMessage = async () => {
  isTranslating.value = true
  try {
    // TODO: Implement translation API call
    // Example: const response = await $fetch('/api/translate', { body: { text: props.message.content } })
    translatedContent.value = props.message.content // Placeholder
    isTranslated.value = true
    emit('translate', translatedContent.value)
  } catch (error) {
    console.error('Translation failed:', error)
  } finally {
    isTranslating.value = false
  }
}

const onGiftSent = (data: any) => {
  console.log('Gift sent successfully:', data)
  // Emit gift event with data
  emit('gift', data.giftId || 'pewgift', data.message || '')
}

const onGiftError = (error: string) => {
  console.error('Gift error:', error)
  // Handle error - could show toast notification
}

const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  showContextMenu.value = true
  contextMenuPosition.value = {
    top: event.clientY,
    left: event.clientX
  }
  
  // Close context menu when clicking elsewhere
  const closeMenu = () => {
    showContextMenu.value = false
    document.removeEventListener('click', closeMenu)
  }
  document.addEventListener('click', closeMenu)
}

const copyMessage = () => {
  navigator.clipboard.writeText(props.message.content)
  showContextMenu.value = false
}

const replyMessage = () => {
  // TODO: Implement reply functionality
  console.log('Reply to message:', props.message.id)
  showContextMenu.value = false
}
</script>

<style scoped>
/* Message Bubble Container */
.message-bubble {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  animation: slideIn 0.3s ease;
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

/* Avatar */
.message-avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  background: #f0f0f0;
}

.message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Message Content */
.message-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Sender Name */
.sender-name {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: capitalize;
}

/* Message Text */
.message-text {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 10px 14px;
  background: #f0f0f0;
  border-radius: 12px;
  word-break: break-word;
}

.message-text p {
  margin: 0;
  font-size: 14px;
  color: #333;
  line-height: 1.4;
}

.message-text .translated-text {
  color: #667eea;
  font-style: italic;
}

.message-text .edited-badge {
  font-size: 11px;
  color: #999;
  margin-left: auto;
  white-space: nowrap;
}

/* Own Message Styling */
.own-message .message-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.own-message .message-text p {
  color: white;
}

.own-message .message-text .translated-text {
  color: #e0e0ff;
}

/* System Message Styling */
.system-message .message-text {
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  text-align: center;
  font-size: 12px;
  color: #999;
}

/* Deleted Message Styling */
.deleted-message .message-text {
  background: #ffebee;
  color: #c62828;
  font-style: italic;
}

.deleted-message .message-text p::before {
  content: '[Deleted] ';
}

/* Edited Message Styling */
.edited-message .message-text .edited-badge {
  display: inline;
}

/* Message Actions */
.message-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  font-size: 12px;
}

.message-bubble:hover .message-actions {
  opacity: 1;
}

/* Action Buttons */
.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  color: #666;
  transition: all 0.2s ease;
}

.action-btn:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #667eea;
  color: #667eea;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.translate-btn {
  color: #2196f3;
}

.action-btn.translate-btn:hover:not(:disabled) {
  border-color: #2196f3;
  background: #e3f2fd;
}

.action-btn.gift-btn {
  color: #ff9800;
}

.action-btn.gift-btn:hover:not(:disabled) {
  border-color: #ff9800;
  background: #fff3e0;
}

.action-btn.edit-btn {
  color: #4caf50;
}

.action-btn.edit-btn:hover:not(:disabled) {
  border-color: #4caf50;
  background: #e8f5e9;
}

.action-btn.delete-btn {
  color: #f44336;
}

.action-btn.delete-btn:hover:not(:disabled) {
  border-color: #f44336;
  background: #ffebee;
}

/* Message Time */
.message-time {
  font-size: 11px;
  color: #999;
  padding: 0 14px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.message-bubble:hover .message-time {
  opacity: 1;
}

/* Context Menu */
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 150px;
  overflow: hidden;
}

.context-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  transition: background 0.2s ease;
  text-align: left;
}

.context-item:hover {
  background: #f5f5f5;
}

.context-item.danger {
  color: #f44336;
}

.context-item.danger:hover {
  background: #ffebee;
}

/* Responsive Design */
@media (max-width: 640px) {
  .message-bubble {
    gap: 8px;
  }

  .message-avatar {
    width: 32px;
    height: 32px;
  }

  .message-text {
    padding: 8px 12px;
    font-size: 13px;
  }

  .message-actions {
    gap: 4px;
  }

  .action-btn {
    padding: 3px 6px;
    font-size: 11px;
  }
}

/* Dark Mode Support (Optional) */
@media (prefers-color-scheme: dark) {
  .message-text {
    background: #2a2a2a;
    color: #e0e0e0;
  }

  .message-text p {
    color: #e0e0e0;
  }

  .action-btn {
    background: #1a1a1a;
    border-color: #444;
    color: #999;
  }

  .action-btn:hover:not(:disabled) {
    background: #2a2a2a;
    border-color: #667eea;
    color: #667eea;
  }

  .context-menu {
    background: #2a2a2a;
    border-color: #444;
  }

  .context-item {
    color: #e0e0e0;
  }

  .context-item:hover {
    background: #3a3a3a;
  }
}
</style>
