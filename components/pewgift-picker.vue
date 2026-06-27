// components/pewgift-picker.vue - COMPLETE FIXED VERSION -->
<!-- ============================================================================
     PEWGIFT PICKER COMPONENT - FULLY FUNCTIONAL FOR ALL CONTEXTS
     ============================================================================ -->

<template>
  <div class="pewgift-picker-wrapper">
    <!-- Trigger Button -->
    <button
      @click="togglePicker"
      class="gift-trigger-btn"
      :disabled="disabled || loading"
      :title="`Send a gift (${balance?.balance || 0} PEW)`"
      :class="{ 'has-notification': unreadGifts > 0, 'loading': loading }"
    >
      <span class="gift-icon">🎁</span>
      <span v-if="unreadGifts > 0" class="notification-badge">{{ unreadGifts }}</span>
    </button>

    <!-- Gift Picker Modal -->
    <Teleport to="body" v-if="showPicker">
      <div class="gift-picker-overlay" @click="closePicker">
        <div class="gift-picker-modal" @click.stop>
          <!-- Header -->
          <div class="picker-header">
            <div class="header-content">
              <h3>🎁 Send a Gift</h3>
              <p class="header-subtitle">Spread joy with PEW gifts!</p>
            </div>
            <button @click="closePicker" class="close-btn" title="Close">✕</button>
          </div>

          <!-- Balance Display -->
          <div class="balance-section">
            <div class="balance-card">
              <div class="balance-info">
                <span class="balance-label">💰 Your Balance</span>
                <span class="balance-value">{{ balance?.balance || 0 }} PEW</span>
              </div>
              <button class="btn-topup" @click="openTopUp" title="Top up balance">
                + Add PEW
              </button>
            </div>
            <div v-if="balance && balance.balance < 10" class="low-balance-warning">
              ⚠️ Low balance. Top up to send more gifts!
            </div>
          </div>

          <!-- Category Tabs -->
          <div class="category-tabs">
            <button
              v-for="category in categories"
              :key="category"
              @click="selectedCategory = category"
              class="category-tab"
              :class="{ active: selectedCategory === category }"
            >
              {{ getCategoryEmoji(category) }} {{ category }}
            </button>
          </div>

          <!-- Gifts Grid -->
          <div class="gifts-grid">
            <div
              v-for="gift in getGiftsByCategory(selectedCategory)"
              :key="gift.id"
              class="gift-card"
              :class="{ selected: selectedGift?.id === gift.id, disabled: !canAfford(gift) }"
              @click="selectGift(gift)"
            >
              <div class="gift-image">
                <img v-if="gift.image_url" :src="gift.image_url" :alt="gift.name" />
                <span v-else class="gift-emoji">{{ gift.emoji }}</span>
              </div>
              <div class="gift-info">
                <h4>{{ gift.name }}</h4>
                <p class="gift-rarity" :class="gift.rarity">{{ gift.rarity }}</p>
                <p class="gift-price">{{ gift.price_in_credits }} PEW</p>
              </div>
              <div v-if="selectedGift?.id === gift.id" class="selected-indicator">✓</div>
            </div>
          </div>

          <!-- Quantity & Message -->
          <div v-if="selectedGift" class="gift-options">
            <div class="quantity-selector">
              <label>Quantity:</label>
              <div class="quantity-controls">
                <button @click="decreaseQuantity" :disabled="quantity <= 1">−</button>
                <input v-model.number="quantity" type="number" min="1" max="100" />
                <button @click="increaseQuantity" :disabled="quantity >= 100">+</button>
              </div>
              <span class="total-cost">Total: {{ totalCost }} PEW</span>
            </div>

            <div class="message-input">
              <label>Message (optional):</label>
              <textarea
                v-model="message"
                placeholder="Add a personal message..."
                maxlength="200"
                rows="3"
              ></textarea>
              <span class="char-count">{{ message.length }}/200</span>
            </div>

            <div class="anonymous-toggle">
              <label>
                <input v-model="isAnonymous" type="checkbox" />
                Send anonymously
              </label>
            </div>
          </div>

          <!-- Error/Success Messages -->
          <div v-if="error" class="message error-message">
            ❌ {{ error }}
          </div>
          <div v-if="success" class="message success-message">
            ✅ {{ success }}
          </div>

          <!-- Send Button -->
          <button
            v-if="selectedGift"
            @click="sendGift"
            class="btn-send"
            :disabled="!canAffordGift || loading"
            :class="{ loading }"
          >
            {{ loading ? '⏳ Sending...' : `🎁 Send Gift (${totalCost} PEW)` }}
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePewGift } from '~/composables/use-pewgift'

interface Props {
  recipientId?: string
  postId?: string
  commentId?: string
  streamId?: string
  chatId?: string
  targetType?: 'post' | 'comment' | 'stream' | 'chat'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<{
  'gift-sent': [data: any]
  'error': [error: string]
}>()

const {
  giftTypes,
  balance,
  loading,
  selectedGift,
  quantity,
  message,
  isAnonymous,
  error,
  success,
  loadGiftTypes,
  loadBalance,
  sendGiftToPost,
  sendGiftToComment,
  sendGiftToStream,
  sendGiftToChat,
  categories,
  getGiftsByCategory,
  canAffordGift,
  totalCost,
  resetForm,
  clearMessages
} = usePewGift()

const showPicker = ref(false)
const selectedCategory = ref('')
const unreadGifts = ref(0)

onMounted(async () => {
  await loadGiftTypes()
  await loadBalance()
  if (categories.value.length > 0) {
    selectedCategory.value = categories.value[0]
  }
})

const togglePicker = () => {
  showPicker.value = !showPicker.value
  if (showPicker.value) {
    clearMessages()
  }
}

const closePicker = () => {
  showPicker.value = false
  resetForm()
  clearMessages()
}

const selectGift = (gift: any) => {
  selectedGift.value = gift
}

const increaseQuantity = () => {
  if (quantity.value < 100) quantity.value++
}

const decreaseQuantity = () => {
  if (quantity.value > 1) quantity.value--
}

const canAfford = (gift: any) => {
  return balance.value && balance.value.balance >= gift.price_in_credits
}

const openTopUp = () => {
  // Navigate to wallet/topup page
  navigateTo('/wallet/topup')
}

const getCategoryEmoji = (category: string) => {
  const emojiMap: Record<string, string> = {
    'love': '❤️',
    'celebration': '🎉',
    'funny': '😂',
    'nature': '🌿',
    'animals': '🐾',
    'food': '🍕',
    'sports': '⚽',
    'music': '🎵',
    'tech': '💻',
    'other': '✨'
  }
  return emojiMap[category] || '🎁'
}

const sendGift = async () => {
  if (!selectedGift.value) return

  try {
    let success = false

    if (props.targetType === 'post' && props.postId && props.recipientId) {
      success = await sendGiftToPost(props.postId, props.recipientId)
    } else if (props.targetType === 'comment' && props.commentId && props.recipientId && props.postId) {
      success = await sendGiftToComment(props.commentId, props.recipientId, props.postId)
    } else if (props.targetType === 'stream' && props.streamId && props.recipientId) {
      success = await sendGiftToStream(props.streamId, props.recipientId)
    } else if (props.targetType === 'chat' && props.chatId && props.recipientId) {
      success = await sendGiftToChat(props.chatId, props.recipientId)
    } else {
      throw new Error('Invalid target type or missing required parameters')
    }

    if (success) {
      emit('gift-sent', {
        giftId: selectedGift.value.id,
        quantity: quantity.value,
        message: message.value,
        isAnonymous: isAnonymous.value
      })
      setTimeout(() => closePicker(), 1500)
    }
  } catch (err: any) {
    emit('error', err.message)
  }
}
</script>

<style scoped>
.pewgift-picker-wrapper {
  display: inline-block;
}

.gift-trigger-btn {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid #e0e0e0;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: all 0.3s ease;
}

.gift-trigger-btn:hover:not(:disabled) {
  border-color: #ff6b6b;
  background: #fff5f5;
  transform: scale(1.1);
}

.gift-trigger-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.gift-trigger-btn.loading {
  animation: pulse 1s infinite;
}

.notification-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ff6b6b;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.gift-picker-overlay {
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
  animation: fadeIn 0.3s ease;
}

.gift-picker-modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.header-content h3 {
  margin: 0 0 5px 0;
  font-size: 20px;
  color: #333;
}

.header-subtitle {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #333;
}

.balance-section {
  padding: 15px 20px;
  background: #f9f9f9;
  border-bottom: 1px solid #e0e0e0;
}

.balance-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.balance-info {
  display: flex;
  flex-direction: column;
}

.balance-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.balance-value {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.btn-topup {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.btn-topup:hover {
  background: #45a049;
}

.low-balance-warning {
  background: #fff3cd;
  border: 1px solid #ffc107;
  color: #856404;
  padding: 10px;
  border-radius: 6px;
  font-size: 13px;
}

.category-tabs {
  display: flex;
  gap: 8px;
  padding: 15px 20px;
  border-bottom: 1px solid #e0e0e0;
  overflow-x: auto;
}

.category-tab {
  background: #f0f0f0;
  border: 2px solid transparent;
  padding: 8px 12px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
  transition: all 0.2s;
}

.category-tab:hover {
  background: #e0e0e0;
}

.category-tab.active {
  background: #ff6b6b;
  color: white;
  border-color: #ff6b6b;
}

.gifts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
  padding: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.gift-card {
  position: relative;
  background: #f9f9f9;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.gift-card:hover:not(.disabled) {
  border-color: #ff6b6b;
  background: #fff5f5;
  transform: translateY(-2px);
}

.gift-card.selected {
  border-color: #ff6b6b;
  background: #ffe0e0;
}

.gift-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.gift-image {
  font-size: 32px;
  margin-bottom: 8px;
}

.gift-emoji {
  display: inline-block;
}

.gift-info h4 {
  margin: 8px 0 4px 0;
  font-size: 12px;
  color: #333;
}

.gift-rarity {
  margin: 4px 0;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
}

.gift-rarity.common {
  color: #666;
}

.gift-rarity.rare {
  color: #4CAF50;
}

.gift-rarity.epic {
  color: #2196F3;
}

.gift-rarity.legendary {
  color: #ff6b6b;
}

.gift-price {
  margin: 4px 0 0 0;
  font-size: 12px;
  font-weight: bold;
  color: #ff6b6b;
}

.selected-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #ff6b6b;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.gift-options {
  padding: 20px;
  border-top: 1px solid #e0e0e0;
}

.quantity-selector,
.message-input,
.anonymous-toggle {
  margin-bottom: 15px;
}

.quantity-selector label,
.message-input label,
.anonymous-toggle label {
  display: block;
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quantity-controls button {
  width: 32px;
  height: 32px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.quantity-controls button:hover:not(:disabled) {
  border-color: #ff6b6b;
  background: #fff5f5;
}

.quantity-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-controls input {
  width: 60px;
  padding: 6px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
}

.total-cost {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.message-input textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-family: inherit;
  font-size: 13px;
  resize: vertical;
}

.char-count {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: #999;
}

.anonymous-toggle input {
  margin-right: 8px;
}

.message {
  padding: 12px;
  margin: 0 20px;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 15px;
}

.error-message {
  background: #ffebee;
  border: 1px solid #ef5350;
  color: #c62828;
}

.success-message {
  background: #e8f5e9;
  border: 1px solid #66bb6a;
  color: #2e7d32;
}

.btn-send {
  width: calc(100% - 40px);
  margin: 0 20px 20px 20px;
  padding: 12px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-send:hover:not(:disabled) {
  background: #ff5252;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-send.loading {
  animation: pulse 1s infinite;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@media (max-width: 600px) {
  .gift-picker-modal {
    width: 95%;
    max-height: 95vh;
  }

  .gifts-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }

  .category-tabs {
    flex-wrap: wrap;
  }
}
</style>
