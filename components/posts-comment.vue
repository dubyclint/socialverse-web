<!-- components/PostComment.vue -->
<!-- ============================================================================
     POST COMMENT COMPONENT WITH PEWGIFT INTEGRATION
     ============================================================================ -->

<template>
  <div class="comment">
    <!-- Comment Header -->
    <div class="comment-header">
      <img
        :src="comment.profiles.avatar_url"
        :alt="comment.profiles.username"
        class="comment-avatar"
      />
      <div class="comment-info">
        <div class="comment-author">{{ comment.profiles.username }}</div>
        <div class="comment-time">{{ formatTime(comment.created_at) }}</div>
      </div>
    </div>

    <!-- Comment Content -->
    <div class="comment-content">
      {{ comment.content }}
    </div>

    <!-- Comment Actions -->
    <div class="comment-actions">
      <button
        @click="toggleLike"
        class="comment-action-btn"
        :class="{ active: isLiked }"
        title="Like this comment"
      >
        <Icon name="heart" size="14" :fill="isLiked" />
        <span>{{ likesCount }}</span>
      </button>
      <button
        @click="$emit('reply', comment.id)"
        class="comment-action-btn"
        title="Reply to this comment"
      >
        <Icon name="reply" size="14" />
        <span>Reply</span>
      </button>
      <button
        @click="showPewgiftModal = true"
        class="comment-action-btn pewgift-btn"
        title="Send pewgift"
      >
        <Icon name="gift" size="14" />
        <span>🎁 Pewgift</span>
      </button>
    </div>

    <!-- Pewgift Modal -->
    <div v-if="showPewgiftModal" class="modal-overlay" @click="showPewgiftModal = false">
      <div class="pewgift-modal" @click.stop>
        <div class="modal-header">
          <h4>🎁 Send Pewgift to {{ comment.profiles.username }}</h4>
          <button @click="showPewgiftModal = false" class="close-btn">
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
        <div v-if="pewgiftError" class="error-message">
          {{ pewgiftError }}
        </div>
        <div v-if="pewgiftSuccess" class="success-message">
          ✓ Pewgift sent successfully!
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Profile {
  id: string
  username: string
  avatar_url: string
}

interface Comment {
  id: string
  content: string
  created_at: string
  likes_count?: number
  profiles: Profile
}

interface Gift {
  id: string
  name: string
  emoji: string
  value: number
}

const props = defineProps<{
  comment: Comment
}>()

const emit = defineEmits<{
  reply: [commentId: string]
}>()

// State
const isLiked = ref(false)
const likesCount = ref(props.comment.likes_count || 0)
const showPewgiftModal = ref(false)
const selectedGift = ref<Gift | null>(null)
const customAmount = ref(0)
const loading = ref(false)
const pewgiftError = ref('')
const pewgiftSuccess = ref(false)

// Available gifts
const availableGifts: Gift[] = [
  { id: '1', name: 'Bronze Gift', emoji: '🥉', value: 10 },
  { id: '2', name: 'Silver Gift', emoji: '🥈', value: 50 },
  { id: '3', name: 'Gold Gift', emoji: '🥇', value: 100 },
  { id: '4', name: 'Diamond Gift', emoji: '💎', value: 500 }
]

// Computed pewgift amount
const pewgiftAmount = (): number => {
  return customAmount.value > 0 ? customAmount.value : (selectedGift.value?.value || 0)
}

// Methods
const formatTime = (date: string): string => {
  const now = new Date()
  const commentDate = new Date(date)
  const diff = now.getTime() - commentDate.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return commentDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

const toggleLike = () => {
  isLiked.value = !isLiked.value
  likesCount.value += isLiked.value ? 1 : -1
}

const sendPewgift = async () => {
  const amount = pewgiftAmount()
  
  if (!amount || amount <= 0) {
    pewgiftError.value = 'Please select a gift or enter a valid amount'
    return
  }

  loading.value = true
  pewgiftError.value = ''
  pewgiftSuccess.value = false

  try {
    const response = await fetch('/api/pewgift/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientId: props.comment.profiles.id,
        amount: amount,
        commentId: props.comment.id,
        giftType: selectedGift.value?.id
      })
    })

    if (response.ok) {
      pewgiftSuccess.value = true
      setTimeout(() => {
        showPewgiftModal.value = false
        selectedGift.value = null
        customAmount.value = 0
        pewgiftSuccess.value = false
      }, 1500)
    } else {
      pewgiftError.value = 'Failed to send pewgift. Please try again.'
    }
  } catch (error) {
    console.error('Error sending pewgift:', error)
    pewgiftError.value = 'Error sending pewgift. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.comment {
  padding: 16px;
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s ease;
}

.comment:hover {
  background-color: #f9f9f9;
}

.comment-header {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-info {
  flex: 1;
}

.comment-author {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.comment-time {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.comment-content {
  margin-bottom: 12px;
  font-size: 14px;
  line-height: 1.5;
  color: #555;
  word-wrap: break-word;
}

.comment-actions {
  display: flex;
  gap: 16px;
}

.comment-action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
  padding: 4px 0;
}

.comment-action-btn:hover {
  color: #007bff;
}

.comment-action-btn.active {
  color: #e74c3c;
}

.comment-action-btn.pewgift-btn:hover {
  color: #764ba2;
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

.pewgift-modal {
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
  color: #333;
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
  border-color: #764ba2;
  background: #f3e8ff;
}

.gift-emoji {
  font-size: 24px;
  flex-shrink: 0;
}

.gift-info {
  flex: 1;
}

.gift-name {
  font-weight: 600;
  font-size: 13px;
  color: #333;
}

.gift-value {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
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
  border-color: #764ba2;
  box-shadow: 0 0 0 3px rgba(118, 75, 162, 0.1);
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
  margin-top: 12px;
}

.success-message {
  padding: 12px;
  background: #efe;
  color: #3c3;
  border-radius: 6px;
  font-size: 13px;
  text-align: center;
  margin-top: 12px;
}
</style>
