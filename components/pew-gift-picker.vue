<!-- components/pew-gift-picker.vue -->
<!-- ============================================================================
     PEWGIFT PICKER COMPONENT - Select and send gifts with full functionality
     ============================================================================ -->

<template>
  <div class="pewgift-picker">
    <!-- Trigger Button -->
    <button
      @click="showPicker = !showPicker"
      class="gift-trigger-btn"
      :disabled="disabled"
      title="Send a gift"
      :class="{ 'has-notification': unreadGifts > 0 }"
    >
      <span class="gift-icon">🎁</span>
      <span v-if="unreadGifts > 0" class="notification-badge">{{ unreadGifts }}</span>
    </button>

    <!-- Gift Picker Modal -->
    <div v-if="showPicker" class="gift-picker-modal" @click="closePicker">
      <div class="gift-picker-content" @click.stop>
        <!-- Header -->
        <div class="picker-header">
          <div class="header-title">
            <h3>Send a Gift</h3>
            <p class="header-subtitle">Spread joy with PEW gifts!</p>
          </div>
          <button @click="closePicker" class="close-btn" title="Close">
            ✕
          </button>
        </div>

        <!-- Balance Display -->
        <div class="balance-display">
          <div class="balance-item">
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
            {{ getCategoryIcon(category) }} {{ capitalizeCategory(category) }}
          </button>
        </div>

        <!-- Gifts Grid -->
        <div class="gifts-grid">
          <button
            v-for="gift in getGiftsByCategory(selectedCategory)"
            :key="gift.id"
            @click="selectGift(gift)"
            class="gift-card"
            :class="{ 
              selected: selectedGift?.id === gift.id,
              disabled: gift.price_in_credits > (balance?.balance || 0)
            }"
            :disabled="gift.price_in_credits > (balance?.balance || 0)"
            :title="gift.description"
          >
            <div class="gift-emoji">{{ gift.emoji }}</div>
            <div class="gift-name">{{ gift.name }}</div>
            <div class="gift-price">{{ gift.price_in_credits }} PEW</div>
            <div class="gift-rarity" :class="gift.rarity.toLowerCase()">
              {{ gift.rarity }}
            </div>
          </button>
        </div>

        <!-- Empty State -->
        <div v-if="getGiftsByCategory(selectedCategory).length === 0" class="empty-state">
          <span class="empty-icon">🎁</span>
          <p>No gifts in this category</p>
        </div>

        <!-- Selected Gift Details -->
        <div v-if="selectedGift" class="selected-gift-details">
          <!-- Gift Preview -->
          <div class="gift-preview">
            <span class="preview-emoji">{{ selectedGift.emoji }}</span>
            <div class="preview-info">
              <h4>{{ selectedGift.name }}</h4>
              <p class="preview-description">{{ selectedGift.description }}</p>
            </div>
          </div>

          <!-- Quantity -->
          <div class="detail-group">
            <label>Quantity</label>
            <div class="quantity-control">
              <button 
                @click="quantity = Math.max(1, quantity - 1)" 
                class="qty-btn"
                type="button"
              >
                −
              </button>
              <input 
                v-model.number="quantity" 
                type="number" 
                min="1" 
                max="100"
                class="qty-input" 
              />
              <button 
                @click="quantity = Math.min(100, quantity + 1)" 
                class="qty-btn"
                type="button"
              >
                +
              </button>
            </div>
          </div>

          <!-- Message -->
          <div class="detail-group">
            <label>Message (Optional)</label>
            <textarea
              v-model="message"
              placeholder="Add a personal message... (max 100 chars)"
              class="message-input"
              maxlength="100"
              rows="3"
            ></textarea>
            <div class="char-count">{{ message.length }}/100</div>
          </div>

          <!-- Anonymous -->
          <div class="detail-group">
            <label class="checkbox-label">
              <input v-model="isAnonymous" type="checkbox" />
              <span>Send anonymously</span>
            </label>
          </div>

          <!-- Total Cost -->
          <div class="total-cost">
            <div class="cost-breakdown">
              <span>{{ selectedGift.name }} × {{ quantity }}</span>
              <span class="cost-value">{{ totalCost }} PEW</span>
            </div>
            <div v-if="!canAffordGift" class="insufficient-balance">
              ⚠️ Insufficient balance
            </div>
          </div>

          <!-- Send Button -->
          <button
            @click="sendGift"
            class="send-btn"
            :disabled="!canAffordGift || sending"
            type="button"
          >
            <span v-if="sending" class="loading-spinner">⏳</span>
            {{ sending ? 'Sending...' : 'Send Gift' }}
          </button>

          <!-- Error Message -->
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
            <button @click="errorMessage = ''" class="btn-close" type="button">✕</button>
          </div>

          <!-- Success Message -->
          <div v-if="successMessage" class="success-message">
            {{ successMessage }}
          </div>
        </div>

        <!-- No Selection State -->
        <div v-else class="no-selection-state">
          <span class="selection-icon">👆</span>
          <p>Select a gift to send</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePewGift } from '~/composables/use-pewgift'
import { useAuthStore } from '~/stores/auth'

interface Props {
  postId?: string
  commentId?: string
  recipientId?: string
  disabled?: boolean
}

interface Emits {
  'gift-sent': [success: boolean, giftData?: any]
  'error': [error: string]
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<Emits>()

// Stores & Composables
const authStore = useAuthStore()
const {
  giftTypes,
  balance,
  loadGiftTypes,
  loadBalance,
  sendGiftToPost,
  getGiftsByCategory,
  categories
} = usePewGift()

// Reactive State
const showPicker = ref(false)
const selectedCategory = ref('love')
const selectedGift = ref<any>(null)
const quantity = ref(1)
const message = ref('')
const isAnonymous = ref(false)
const sending = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const unreadGifts = ref(0)

// Computed
const totalCost = computed(() => {
  if (!selectedGift.value) return 0
  return selectedGift.value.price_in_credits * quantity.value
})

const canAffordGift = computed(() => {
  if (!balance.value) return false
  return totalCost.value > 0 && totalCost.value <= balance.value.balance
})

// Methods
const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    love: '❤️',
    support: '🤝',
    celebration: '🎉',
    funny: '😂',
    nature: '🌿',
    food: '🍕',
    achievement: '🏆',
    gratitude: '🙏'
  }
  return icons[category] || '🎁'
}

const capitalizeCategory = (category: string): string => {
  return category.charAt(0).toUpperCase() + category.slice(1)
}

const selectGift = (gift: any): void => {
  selectedGift.value = gift
  quantity.value = 1
  message.value = ''
  isAnonymous.value = false
  errorMessage.value = ''
  successMessage.value = ''
}

const sendGift = async (): Promise<void> => {
  if (!selectedGift.value || !canAffordGift.value) {
    errorMessage.value = 'Cannot send this gift'
    return
  }

  sending.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const giftData = {
      giftId: selectedGift.value.id,
      quantity: quantity.value,
      message: message.value || null,
      isAnonymous: isAnonymous.value,
      postId: props.postId || null,
      commentId: props.commentId || null,
      recipientId: props.recipientId || null,
      sentAt: new Date().toISOString()
    }

    // Call API to send gift
    const response = await $fetch('/api/gifts/send', {
      method: 'POST',
      body: giftData
    })

    if (response.success) {
      successMessage.value = `🎉 Gift sent successfully!`
      emit('gift-sent', true, response.data)

      // Reset form
      setTimeout(() => {
        selectedGift.value = null
        quantity.value = 1
        message.value = ''
        isAnonymous.value = false
        showPicker.value = false
        successMessage.value = ''
        
        // Reload balance
        loadBalance()
      }, 1500)
    } else {
      errorMessage.value = response.message || 'Failed to send gift'
      emit('error', errorMessage.value)
    }
  } catch (error: any) {
    errorMessage.value = error.message || 'An error occurred while sending the gift'
    emit('error', errorMessage.value)
    console.error('Send gift error:', error)
  } finally {
    sending.value = false
  }
}

const closePicker = (): void => {
  showPicker.value = false
  // Reset form when closing
  setTimeout(() => {
    selectedGift.value = null
    quantity.value = 1
    message.value = ''
    isAnonymous.value = false
    errorMessage.value = ''
    successMessage.value = ''
  }, 300)
}

const openTopUp = (): void => {
  // Navigate to top-up page or open modal
  window.location.href = '/account/billing'
}

// Lifecycle
onMounted(async () => {
  await loadGiftTypes()
  await loadBalance()
  
  // Optional: Load unread gifts count
  try {
    const response = await $fetch('/api/gifts/unread-count')
    if (response.success) {
      unreadGifts.value = response.count || 0
    }
  } catch (error) {
    console.error('Failed to load unread gifts:', error)
  }
})
</script>

<style scoped>
.pewgift-picker {
  position: relative;
  display: inline-block;
}

/* Trigger Button */
.gift-trigger-btn {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 12px;
  color: #6b7280;
  border-radius: 8px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  gap: 4px;
}

.gift-trigger-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #f59e0b;
  transform: scale(1.1);
}

.gift-trigger-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.gift-trigger-btn.has-notification {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.notification-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  border: 2px solid white;
}

/* Modal */
.gift-picker-modal {
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
  padding: 16px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.gift-picker-content {
  background: white;
  border-radius: 16px;
  max-width: 550px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
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

/* Header */
.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px;
  border-bottom: 2px solid #f0f0f0;
  flex-shrink: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px 16px 0 0;
}

.header-title h3 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 700;
}

.header-subtitle {
  margin: 0;
  font-size: 12px;
  opacity: 0.9;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  cursor: pointer;
  padding: 8px 12px;
  color: white;
  border-radius: 8px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Balance Display */
.balance-display {
  padding: 16px 24px;
  background: linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 100%);
  border-bottom: 1px solid #bfdbfe;
  flex-shrink: 0;
}

.balance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.balance-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.balance-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.balance-value {
  font-size: 18px;
  font-weight: 700;
  color: #2563eb;
}

.btn-topup {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 12px;
  transition: all 0.3s;
  flex-shrink: 0;
}

.btn-topup:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.low-balance-warning {
  margin-top: 8px;
  padding: 8px 12px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

/* Category Tabs */
.category-tabs {
  display: flex;
  gap: 8px;
  padding: 12px 24px;
  border-bottom: 1px solid #e5e7eb;
  overflow-x: auto;
  flex-shrink: 0;
  scroll-behavior: smooth;
}

.category-tabs::-webkit-scrollbar {
  height: 4px;
}

.category-tabs::-webkit-scrollbar-track {
  background: #f0f0f0;
}

.category-tabs::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 2px;
}

.category-tab {
  background: white;
  border: 2px solid #e5e7eb;
  cursor: pointer;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  transition: all 0.3s;
  white-space: nowrap;
  flex-shrink: 0;
}

.category-tab:hover {
  border-color: #667eea;
  color: #667eea;
  background: #f0f7ff;
}

.category-tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: white;
}

/* Gifts Grid */
.gifts-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 24px;
  flex: 1;
  overflow-y: auto;
  min-height: 200px;
}

.gifts-grid::-webkit-scrollbar {
  width: 6px;
}

.gifts-grid::-webkit-scrollbar-track {
  background: #f0f0f0;
}

.gifts-grid::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 3px;
}

.gift-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  font-family: inherit;
}

.gift-card:hover:not(:disabled) {
  border-color: #667eea;
  background: #f0f7ff;
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.2);
}

.gift-card.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 100%);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.gift-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.gift-emoji {
  font-size: 36px;
  line-height: 1;
}

.gift-name {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
  text-align: center;
  line-height: 1.3;
}

.gift-price {
  font-size: 11px;
  color: #6b7280;
  font-weight: 600;
}

.gift-rarity {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.gift-rarity.common {
  background: #e5e7eb;
  color: #6b7280;
}

.gift-rarity.rare {
  background: #bfdbfe;
  color: #2563eb;
}

.gift-rarity.epic {
  background: #d8b4fe;
  color: #7c3aed;
}

.gift-rarity.legendary {
  background: #fcd34d;
  color: #92400e;
}

/* Empty State */
.empty-state,
.no-selection-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: #9ca3af;
  text-align: center;
}

.empty-icon,
.selection-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-state p,
.no-selection-state p {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

/* Selected Gift Details */
.selected-gift-details {
  padding: 24px;
  border-top: 2px solid #f0f0f0;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #fafafa;
}

.gift-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.preview-emoji {
  font-size: 32px;
}

.preview-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
}

.preview-description {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

/* Detail Groups */
.detail-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-group label {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qty-btn {
  width: 36px;
  height: 36px;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  font-size: 16px;
  transition: all 0.3s;
  color: #6b7280;
}

.qty-btn:hover {
  border-color: #667eea;
  color: #667eea;
  background: #f0f7ff;
}

.qty-input {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
  font-weight: 700;
  transition: all 0.3s;
}

.qty-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.message-input {
  padding: 10px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  min-height: 70px;
  transition: all 0.3s;
}

.message-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.char-count {
  font-size: 11px;
  color: #9ca3af;
  text-align: right;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #1f2937;
  font-weight: 500;
}

.checkbox-label input {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

/* Total Cost */
.total-cost {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
}

.cost-breakdown {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
  color: #1f2937;
}

.cost-value {
  color: #667eea;
  font-size: 16px;
}

.insufficient-balance {
  color: #ef4444;
  font-size: 12px;
  font-weight: 600;
}

/* Send Button */
.send-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.send-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  opacity: 0.7;
}

.loading-spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Messages */
.error-message {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #fee;
  color: #c33;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #fcc;
}

.success-message {
  padding: 12px;
  background: #efe;
  color: #3c3;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  border: 1px solid #cfc;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.btn-close {
  background: none;
  border: none;
  color: #c33;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  flex-shrink: 0;
}

/* Responsive */
@media (max-width: 640px) {
  .gifts-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    padding: 16px;
  }

  .gift-picker-content {
    max-width: 100%;
    border-radius: 16px 16px 0 0;
    max-height: 85vh;
  }

  .picker-header {
    padding: 16px;
  }

  .selected-gift-details {
    padding: 16px;
  }

  .category-tabs {
    padding: 10px 16px;
  }

  .balance-display {
    padding: 12px 16px;
  }

  .balance-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .btn-topup {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .gifts-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .gift-emoji {
    font-size: 28px;
  }

  .gift-name {
    font-size: 11px;
  }

  .header-title h3 {
    font-size: 18px;
  }
}
</style>
