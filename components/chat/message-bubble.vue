<!-- components/chat/message-bubble.vue -->
<!-- UPDATED MESSAGE BUBBLE COMPONENT WITH PEWGIFT INTEGRATION -->

<template>
  <div class="message-bubble" :class="messageClasses" @contextmenu="handleContextMenu">
    <!-- Sender Avatar (for group chats) -->
    <NuxtLink
      v-if="showAvatar && !isOwn"
      class="message-avatar"
      :to="message.senderId ? `/profile/${message.senderId}` : '#'"
    >
      <img :src="message.senderAvatar || '/default-avatar.svg'" :alt="message.senderName" />
    </NuxtLink>

    <!-- Message Content -->
    <div class="message-content">
      <!-- Sender Name (for group chats) -->
      <div v-if="showSenderName && !isOwn" class="sender-name">{{ message.senderName }}</div>

      <!-- Quoted message -->
      <div v-if="message.replyTo" class="quoted-message">
        <span class="quoted-bar"></span>
        <span class="quoted-text">{{ message.replyTo.content || 'Attachment' }}</span>
      </div>

      <!-- Attachments -->
      <div v-if="attachments.length" class="message-attachments">
        <template v-for="url in attachments" :key="url">
          <img v-if="message.messageType === 'image'" :src="url" alt="" class="attachment-image" />
          <video
            v-else-if="message.messageType === 'video'"
            :src="url"
            controls
            playsinline
            class="attachment-video"
          ></video>
          <audio
            v-else-if="message.messageType === 'audio'"
            :src="url"
            controls
            class="attachment-audio"
          ></audio>
          <a v-else :href="url" target="_blank" rel="noopener" class="attachment-file">
            <Icon name="paperclip" size="16" />
            {{ fileName(url) }}
          </a>
        </template>
      </div>

      <!-- Main Message -->
      <div v-if="message.content || isDeleted" class="message-text">
        <p v-if="isDeleted" class="deleted-text">This message was deleted</p>
        <p v-else-if="!isTranslated">{{ message.content }}</p>
        <p v-else class="translated-text">{{ translatedContent }}</p>
        <span v-if="isEdited" class="edited-badge">(edited)</span>
      </div>

      <!-- Reactions -->
      <div v-if="message.reactions?.length" class="message-reactions">
        <button
          v-for="reaction in message.reactions"
          :key="reaction.emoji"
          class="reaction-chip"
          :class="{ mine: reaction.reacted }"
          @click="react(reaction.emoji)"
        >
          {{ reaction.emoji }} {{ reaction.count }}
        </button>
      </div>

      <!-- Message Actions -->
      <div class="message-actions">
        <!-- Quick reactions -->
        <button
          v-for="emoji in quickReactions"
          :key="emoji"
          class="action-btn reaction-btn"
          :title="`React ${emoji}`"
          @click="react(emoji)"
        >
          {{ emoji }}
        </button>

        <!-- Reply Button -->
        <button
          v-if="!isDeleted"
          class="action-btn reply-btn"
          title="Reply"
          @click="$emit('reply', message)"
        >
          <Icon name="corner-up-left" size="16" />
          Reply
        </button>

        <!-- Translate Button -->
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

        <!-- Pewgift Button -->
        <button 
          v-if="!isOwn && !message.isDeleted"
          @click="openGiftModal"
          class="action-btn pewgift-btn"
          title="Send pewgift to sender"
        >
          <Icon name="gift" size="16" />
          🎁 Pewgift
        </button>

        <!-- Edit Button -->
        <button 
          v-if="isOwn && !message.isDeleted"
          @click="$emit('edit', message)"
          class="action-btn edit-btn"
          title="Edit message"
        >
          <Icon name="edit-2" size="16" />
          Edit
        </button>

        <!-- Delete Button -->
        <button 
          v-if="isOwn && !message.isDeleted"
          @click="message.id && $emit('delete', message.id)"
          class="action-btn delete-btn"
          title="Delete message"
        >
          <Icon name="trash-2" size="16" />
          Delete
        </button>
      </div>

      <!-- Timestamp -->
      <div class="message-time">
        <span>{{ formatTime(message.timestamp) }}</span>
        <span v-if="isOwn && message.status" class="message-status" :class="message.status" :title="statusLabel">
          <template v-if="message.status === 'sending'">🕘</template>
          <template v-else-if="message.status === 'failed'">!</template>
          <template v-else-if="message.status === 'sent'">✓</template>
          <template v-else>✓✓</template>
        </span>
      </div>
    </div>

    <!-- Pewgift Modal -->
    <div v-if="showGiftModal" class="modal-overlay" @click="showGiftModal = false">
      <div class="gift-modal" @click.stop>
        <div class="modal-header">
          <h4>🎁 Send Pewgift to {{ message.senderName }}</h4>
          <button @click="showGiftModal = false" class="close-btn">
            <Icon name="x" size="20" />
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
              <img v-if="gift.icon_url" :src="gift.icon_url" alt="" class="gift-icon" />
              <div class="gift-info">
                <div class="gift-name">{{ gift.name }}</div>
                <div class="gift-value">{{ gift.cost_credits }} PEW</div>
              </div>
            </div>
          </div>

          <p v-if="!availableGifts.length" class="gift-empty">Loading gifts…</p>

          <!-- Quantity -->
          <div class="custom-amount-section">
            <label>Quantity</label>
            <input 
              v-model.number="customAmount" 
              type="number" 
              min="1" 
              placeholder="1"
              class="amount-input"
            />
          </div>

          <!-- Send Button -->
          <button 
            @click="sendPewgift" 
            class="send-btn"
            :disabled="!selectedGift || loading"
          >
            <Icon v-if="!loading" name="send" size="16" />
            {{ loading ? 'Sending...' : 'Send Pewgift' }}
          </button>
        </div>

        <!-- Success/Error Messages -->
        <div v-if="giftError" class="error-message">
          {{ giftError }}
        </div>
        <div v-if="giftSuccess" class="success-message">
          ✓ Pewgift sent successfully!
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Message {
  id?: string
  senderId?: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp?: string | Date | number
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  messageType?: string
  attachments?: string[]
  replyTo?: { id: string, senderId: string, content: string }
  reactions?: { emoji: string, count: number, reacted: boolean }[]
  editedAt?: string
  deleted?: boolean
  isEdited?: boolean
  isDeleted?: boolean
}

interface Gift {
  id: string
  name: string
  cost_credits: number
  icon_url: string | null
}

const props = defineProps<{
  message: Message
  chatId?: string
  isOwn?: boolean
  showAvatar?: boolean
  showSenderName?: boolean
}>()

const emit = defineEmits<{
  edit: [message: Message]
  delete: [messageId: string]
  reply: [message: Message]
  react: [messageId: string, emoji: string]
  gifted: []
}>()

const quickReactions = ['👍', '❤️', '😂']

const attachments = computed(() => props.message.attachments ?? [])
const isDeleted = computed(() => Boolean(props.message.deleted ?? props.message.isDeleted))
const isEdited = computed(() => Boolean(props.message.editedAt ?? props.message.isEdited))

const fileName = (url: string): string => {
  const parts = url.split('/')
  return decodeURIComponent(parts[parts.length - 1] ?? 'file')
}

const react = (emoji: string): void => {
  if (!props.message.id) return
  emit('react', props.message.id, emoji)
}

// State
const isTranslated = ref(false)
const translatedContent = ref('')
const isTranslating = ref(false)
const showGiftModal = ref(false)
const selectedGift = ref<Gift | null>(null)
const customAmount = ref(0)
const loading = ref(false)
const giftError = ref('')
const giftSuccess = ref(false)

// Gift catalog, loaded from the server the first time the modal opens.
const availableGifts = ref<Gift[]>([])
const giftsLoaded = ref(false)

const loadGifts = async (): Promise<void> => {
  if (giftsLoaded.value) return
  try {
    const response = await $fetch<{ success: boolean, data: Gift[] }>('/api/pewgift/types')
    availableGifts.value = response.data ?? []
    giftsLoaded.value = true
  } catch (error) {
    console.error('Failed to load gift catalog:', error)
    giftError.value = 'Could not load gifts'
  }
}

const openGiftModal = async (): Promise<void> => {
  showGiftModal.value = true
  await loadGifts()
}

// Computed
const messageClasses = computed(() => ({
  'own-message': props.isOwn,
  'other-message': !props.isOwn
}))

const pewgiftQuantity = computed(() => (customAmount.value > 0 ? customAmount.value : 1))

// Methods
const statusLabel = computed(() => {
  switch (props.message.status) {
    case 'sending': return 'Sending'
    case 'failed': return 'Failed to send'
    case 'sent': return 'Sent'
    case 'delivered': return 'Delivered'
    case 'read': return 'Read'
    default: return ''
  }
})

const formatTime = (timestamp?: string | Date | number): string => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const translateMessage = async () => {
  isTranslating.value = true
  try {
    const response = await $fetch<{ success: boolean, data?: { translated: string } }>(
      '/api/chat/translate',
      {
        method: 'POST',
        body: {
          text: props.message.content,
          targetLanguage: navigator.language?.split('-')[0] || 'en'
        }
      }
    )
    translatedContent.value = response.data?.translated ?? props.message.content
    isTranslated.value = Boolean(response.data?.translated)
  } catch (error) {
    console.error('Translation error:', error)
  } finally {
    isTranslating.value = false
  }
}

const sendPewgift = async () => {
  if (!selectedGift.value) {
    giftError.value = 'Please select a gift'
    return
  }
  if (!props.chatId || !props.message.senderId) {
    giftError.value = 'This conversation cannot receive gifts'
    return
  }

  loading.value = true
  giftError.value = ''
  giftSuccess.value = false

  try {
    await $fetch('/api/pewgift/send-to-chat', {
      method: 'POST',
      body: {
        chatId: props.chatId,
        recipientId: props.message.senderId,
        giftTypeId: selectedGift.value.id,
        quantity: pewgiftQuantity.value
      }
    })

    giftSuccess.value = true
    emit('gifted')
    setTimeout(() => {
      showGiftModal.value = false
      selectedGift.value = null
      customAmount.value = 0
      giftSuccess.value = false
    }, 1500)
  } catch (error: unknown) {
    const detail = (error as { data?: { statusMessage?: string } })?.data?.statusMessage
    giftError.value = detail || 'Failed to send pewgift. Please try again.'
  } finally {
    loading.value = false
  }
}

const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  emit('reply', props.message)
}
</script>

<style scoped>
.message-bubble {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-avatar {
  flex-shrink: 0;
}

.message-avatar img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.message-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sender-name {
  font-weight: 600;
  font-size: 12px;
  color: var(--color-text-muted);
}

.message-text {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  padding: 10px 12px;
  border-radius: 8px;
  word-wrap: break-word;
}

.message-text p {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
}

.translated-text {
  font-style: italic;
  color: #555;
}

.edited-badge {
  font-size: 11px;
  color: #999;
  margin-left: 4px;
}

.own-message .message-text {
  background: var(--color-primary);
  color: #ffffff;
}

.message-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
}

.action-btn:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #999;
  color: #333;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.message-time {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.message-status.read { color: #3b82f6; }
.message-status.failed { color: #ef4444; font-weight: 700; }

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

.gift-modal {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 450px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: #333;
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
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.gift-item:hover {
  border-color: #007bff;
  background: #f8f9fa;
}

.gift-item.selected {
  border-color: #007bff;
  background: #e7f1ff;
}

.gift-emoji {
  font-size: 24px;
}

.gift-info {
  flex: 1;
}

.gift-name {
  font-weight: 600;
  font-size: 13px;
}

.gift-value {
  font-size: 12px;
  color: #666;
}

.custom-amount-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.custom-amount-section label {
  font-weight: 600;
  font-size: 13px;
  color: #333;
}

.amount-input {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.amount-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  padding: 12px;
  background: #fee;
  color: #c33;
  border-radius: 6px;
  font-size: 13px;
  text-align: center;
}

.success-message {
  padding: 12px;
  background: #efe;
  color: #3c3;
  border-radius: 6px;
  font-size: 13px;
  text-align: center;
}

.quoted-message {
  display: flex;
  gap: 8px;
  align-items: stretch;
  margin-bottom: 4px;
  padding: 6px 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 13px;
  opacity: 0.85;
}

.quoted-bar {
  width: 3px;
  border-radius: 2px;
  background: var(--color-aurora-mint, #6FFFD4);
}

.message-attachments {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 6px;
}

.attachment-image,
.attachment-video {
  max-width: min(320px, 70vw);
  border-radius: 12px;
}

.attachment-audio {
  width: min(280px, 70vw);
}

.attachment-file {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: underline;
  word-break: break-all;
}

.message-reactions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.reaction-chip {
  border: 1px solid var(--color-border, #1F2937);
  background: transparent;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
  cursor: pointer;
}

.reaction-chip.mine {
  border-color: var(--color-aurora-mint, #6FFFD4);
}

.deleted-text {
  font-style: italic;
  opacity: 0.6;
}
</style>
