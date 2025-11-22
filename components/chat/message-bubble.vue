<!-- components/chat/message-bubble.vue -->
<!-- UPDATED MESSAGE BUBBLE COMPONENT WITH PEWGIFT INTEGRATION -->

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
          @click="showGiftModal = true"
          class="action-btn pewgift-btn"
          title="Send pewgift to sender"
        >
          <Icon name="gift" size="16" />
          🎁 Pewgift
        </button>

        <!-- Edit Button -->
        <button 
          v-if="isOwn && !message.isDeleted"
          @click="$emit('edit')"
          class="action-btn edit-btn"
          title="Edit message"
        >
          <Icon name="edit-2" size="16" />
          Edit
        </button>

        <!-- Delete Button -->
        <button 
          v-if="isOwn && !message.isDeleted"
          @click="$emit('delete')"
          class="action-btn delete-btn"
          title="Delete message"
        >
          <Icon name="trash-2" size="16" />
          Delete
        </button>
      </div>

      <!-- Timestamp -->
      <div class="message-time">{{ formatTime(message.timestamp) }}</div>
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
              <div class="gift-emoji">{{ gift.emoji }}</div>
              <div class="gift-info">
                <div class="gift-name">{{ gift.name }}</div>
                <div class="gift-value">{{ gift.value }} PEW</div>
              </div>
            </div>
          </div>

          <!-- Custom Amount Input -->
          <div class="custom-amount-section">
            <label>Custom Pewgift Amount</label>
            <input 
              v-model.number="customAmount" 
              type="number" 
              min="1" 
              placeholder="Enter custom amount"
              class="amount-input"
            />
          </div>

          <!-- Send Button -->
          <button 
            @click="sendPewgift" 
            class="send-btn"
            :disabled="!pewgiftAmount || loading"
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
  timestamp?: string | Date
  isEdited?: boolean
  isDeleted?: boolean
}

interface Gift {
  id: string
  name: string
  emoji: string
  value: number
}

const props = defineProps<{
  message: Message
  isOwn?: boolean
  showAvatar?: boolean
  showSenderName?: boolean
}>()

const emit = defineEmits<{
  edit: []
  delete: []
}>()

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

// Available gifts
const availableGifts: Gift[] = [
  { id: '1', name: 'Bronze Gift', emoji: '🥉', value: 10 },
  { id: '2', name: 'Silver Gift', emoji: '🥈', value: 50 },
  { id: '3', name: 'Gold Gift', emoji: '🥇', value: 100 },
  { id: '4', name: 'Diamond Gift', emoji: '💎', value: 500 }
]

// Computed
const messageClasses = computed(() => ({
  'own-message': props.isOwn,
  'other-message': !props.isOwn
}))

const pewgiftAmount = computed(() => {
  return customAmount.value > 0 ? customAmount.value : (selectedGift.value?.value || 0)
})

// Methods
const formatTime = (timestamp?: string | Date): string => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const translateMessage = async () => {
  isTranslating.value = true
  try {
    // TODO: Implement translation API call
    translatedContent.value = props.message.content
    isTranslated.value = true
  } catch (error) {
    console.error('Translation error:', error)
  } finally {
    isTranslating.value = false
  }
}

const sendPewgift = async () => {
  if (!pewgiftAmount.value || pewgiftAmount.value <= 0) {
    giftError.value = 'Please select a gift or enter a valid amount'
    return
  }

  loading.value = true
  giftError.value = ''
  giftSuccess.value = false

  try {
    const response = await fetch('/api/pewgift/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientId: props.message.senderId,
        amount: pewgiftAmount.value,
        messageId: props.message.id,
        giftType: selectedGift.value?.id
      })
    })

    if (response.ok) {
      giftSuccess.value = true
      setTimeout(() => {
        showGiftModal.value = false
        selectedGift.value = null
        customAmount.value = 0
        giftSuccess.value = false
      }, 1500)
    } else {
      giftError.value = 'Failed to send pewgift. Please try again.'
    }
  } catch (error) {
    console.error('Error sending pewgift:', error)
    giftError.value = 'Error sending pewgift. Please try again.'
  } finally {
    loading.value = false
  }
}

const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  // TODO: Implement context menu
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
  color: #666;
}

.message-text {
  background: #f0f0f0;
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
  background: #007bff;
  color: white;
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
</style>

