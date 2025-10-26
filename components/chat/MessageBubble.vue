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

      <!-- Translation Button -->
      <div class="message-actions">
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

        <!-- PewGift Button -->
        <button 
          v-if="!isOwn && !message.isDeleted"
          @click="showGiftModal = true"
          class="action-btn gift-btn"
          title="Send gift to sender"
        >
          <Icon name="gift" size="16" />
          Gift
        </button>

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

    <!-- Gift Modal -->
    <div v-if="showGiftModal" class="modal-overlay" @click="showGiftModal = false">
      <div class="gift-modal" @click.stop>
        <div class="modal-header">
          <h4>Send Gift to {{ message.senderName }}</h4>
          <button @click="showGiftModal = false" class="close-btn">
            <Icon name="x" />
          </button>
        </div>

        <div class="modal-body">
          <!-- Gift Selection -->
          <div class="gift-selection">
            <div 
              v-for="gift in availableGifts"
              :key="gift.id"
              class="gift-item"
              :class="{ selected: selectedGift?.id === gift.id }"
              @click="selectedGift = gift"
            >
              <div class="gift-emoji">{{ gift.emoji }}</div>
              <div class="gift-info">
                <div class="gift-name">{{ gift.name }}</div>
                <div class="gift-cost">{{ gift.cost }} PEW</div>
              </div>
            </div>
          </div>

          <!-- Message Input -->
          <textarea 
            v-model="giftMessage"
            placeholder="Add a message with your gift..."
            class="gift-message"
            rows="3"
          ></textarea>

          <!-- Balance Info -->
          <div class="balance-info">
            Your balance: <strong>{{ userBalance }} PEW</strong>
          </div>

          <!-- Send Button -->
          <button 
            @click="sendGift"
            :disabled="!selectedGift || isSendingGift || (selectedGift?.cost || 0) > userBalance"
            class="send-gift-btn"
          >
            {{ isSendingGift ? 'Sending...' : 'Send Gift' }}
          </button>
        </div>
      </div>
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

interface Gift {
  id: string
  name: string
  emoji: string
  cost: number
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

const isTranslated = ref(false)
const translatedContent = ref('')
const isTranslating = ref(false)
const showGiftModal = ref(false)
const selectedGift = ref<Gift | null>(null)
const giftMessage = ref('')
const isSendingGift = ref(false)
const userBalance = ref(1000) // TODO: Get from store
const showContextMenu = ref(false)
const contextMenuPosition = ref({ top: 0, left: 0 })

const availableGifts: Gift[] = [
  { id: '1', name: 'Rose', emoji: '🌹', cost: 10 },
  { id: '2', name: 'Heart', emoji: '❤️', cost: 20 },
  { id: '3', name: 'Diamond', emoji: '💎', cost: 50 },
  { id: '4', name: 'Crown', emoji: '👑', cost: 100 }
]

const messageClasses = computed(() => ({
  'own-message': props.isOwn,
  'system-message': props.message.messageType === 'system',
  'deleted-message': props.message.isDeleted,
  'edited-message': props.message.isEdited,
  'translated-message': isTranslated.value
}))

const translateMessage = async () => {
  try {
    isTranslating.value = true
    const response = await $fetch('/api/chat/translate', {
      method: 'POST',
      body: {
        text: props.message.content,
        targetLang: 'es', // TODO: Get from user preferences
        messageId: props.message.id
      }
    })

    if (response.success) {
      translatedContent.value = response.data.translatedText
      isTranslated.value = true
    }
  } catch (error) {
    console.error('Translation failed:', error)
  } finally {
    isTranslating.value = false
  }
}

const sendGift = async () => {
  if (!selectedGift.value) return

  try {
    isSendingGift.value = true
    const response = await $fetch('/api/chat/gift', {
      method: 'POST',
      body: {
        recipientId: props.message.senderId,
        giftId: selectedGift.value.id,
        giftAmount: selectedGift.value.cost,
        message: giftMessage.value,
        messageId: props.message.id
      }
    })

    if (response.success) {
      emit('gift', selectedGift.value.id, giftMessage.value)
      showGiftModal.value = false
      selectedGift.value = null
      giftMessage.value = ''
    }
  } catch (error) {
    console.error('Failed to send gift:', error)
  } finally {
    isSendingGift.value = false
  }
}

const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  showContextMenu.value = true
  contextMenuPosition.value = {
    top: event.clientY,
    left: event.clientX
  }
}

const copyMessage = () => {
  navigator.clipboard.writeText(props.message.content)
  showContextMenu.value = false
}

const replyMessage = () => {
  emit('edit') // TODO: Implement reply
  showContextMenu.value = false
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.message-bubble {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
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

.message-bubble.own-message {
  flex-direction: row-reverse;
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
  max-width: 60%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-bubble.own-message .message-content {
  align-items: flex-end;
}

.sender-name {
  font-size: 12px;
  font-weight: 600;
  color: #666;
}

.message-text {
  background: #f0f0f0;
  padding: 12px 16px;
  border-radius: 12px;
  word-wrap: break-word;
}

.message-bubble.own-message .message-text {
  background: #2196f3;
  color: white;
}

.message-text p {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
}

.translated-text {
  font-style: italic;
  opacity: 0.9;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.edited-badge {
  font-size: 11px;
  opacity: 0.7;
  margin-left: 4px;
}

.message-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.message-bubble:hover .message-actions {
  opacity: 1;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #f0f0f0;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: #e0e0e0;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.translate-btn {
  color: #2196f3;
}

.gift-btn {
  color: #ff6b6b;
}

.edit-btn {
  color: #ffa500;
}

.delete-btn {
  color: #ff6b6b;
}

.message-time {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

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

.gift-modal {
  background: white;
  border-radius: 12px;
  padding: 20px;
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.modal-header h4 {
  margin: 0;
  font-size: 16px;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.gift-selection {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.gift-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.gift-item:hover {
  border-color: #2196f3;
  background: #f5f5f5;
}

.gift-item.selected {
  border-color: #2196f3;
  background: #e3f2fd;
}

.gift-emoji {
  font-size: 32px;
}

.gift-info {
  flex: 1;
}

.gift-name {
  font-weight: 600;
  font-size: 14px;
}

.gift-cost {
  font-size: 12px;
  color: #666;
}

.gift-message {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
}

.balance-info {
  font-size: 13px;
  color: #666;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.send-gift-btn {
  padding: 12px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.send-gift-btn:hover:not(:disabled) {
  background: #1976d2;
}

.send-gift-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  min-width: 150px;
}

.context-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.context-item:hover {
  background: #f5f5f5;
}

.context-item.danger {
  color: #ff6b6b;
}

.deleted-message .message-text {
  opacity: 0.5;
  font-style: italic;
}

.system-message .message-text {
  background: #f5f5f5;
  color: #666;
  text-align: center;
}
</style>
