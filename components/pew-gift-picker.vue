<!-- components/PewGiftPicker.vue -->
<!-- ============================================================================
     PEWGIFT PICKER COMPONENT - Select and send gifts
     ============================================================================ -->

<template>
  <div class="pewgift-picker">
    <!-- Trigger Button -->
    <button
      @click="showPicker = !showPicker"
      class="gift-trigger-btn"
      :disabled="disabled"
      title="Send a gift"
    >
      <Icon name="gift" size="20" />
    </button>

    <!-- Gift Picker Modal -->
    <div v-if="showPicker" class="gift-picker-modal" @click="closePicker">
      <div class="gift-picker-content" @click.stop>
        <!-- Header -->
        <div class="picker-header">
          <h3>Send a Gift</h3>
          <button @click="closePicker" class="close-btn">
            <Icon name="x" size="20" />
          </button>
        </div>

        <!-- Balance Display -->
        <div class="balance-display">
          <div class="balance-item">
            <span class="balance-label">Your Balance</span>
            <span class="balance-value">{{ balance?.balance || 0 }} Credits</span>
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
            {{ getCategoryIcon(category) }} {{ category }}
          </button>
        </div>

        <!-- Gifts Grid -->
        <div class="gifts-grid">
          <button
            v-for="gift in getGiftsByCategory(selectedCategory)"
            :key="gift.id"
            @click="selectGift(gift)"
            class="gift-card"
            :class="{ selected: selectedGift?.id === gift.id }"
            :disabled="gift.price_in_credits > (balance?.balance || 0)"
          >
            <div class="gift-emoji">{{ gift.emoji }}</div>
            <div class="gift-name">{{ gift.name }}</div>
            <div class="gift-price">{{ gift.price_in_credits }} Credits</div>
            <div class="gift-rarity" :class="gift.rarity">{{ gift.rarity }}</div>
          </button>
        </div>

        <!-- Selected Gift Details -->
        <div v-if="selectedGift" class="selected-gift-details">
          <!-- Quantity -->
          <div class="detail-group">
            <label>Quantity</label>
            <div class="quantity-control">
              <button @click="quantity = Math.max(1, quantity - 1)" class="qty-btn">−</button>
              <input v-model.number="quantity" type="number" min="1" class="qty-input" />
              <button @click="quantity++" class="qty-btn">+</button>
            </div>
          </div>

          <!-- Message -->
          <div class="detail-group">
            <label>Message (Optional)</label>
            <textarea
              v-model="message"
              placeholder="Add a personal message..."
              class="message-input"
              maxlength="100"
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
            <span>Total Cost:</span>
            <span class="cost-value">{{ totalCost }} Credits</span>
          </div>

          <!-- Send Button -->
          <button
            @click="sendGift"
            class="send-btn"
            :disabled="!canAffordGift || sending"
          >
            {{ sending ? 'Sending...' : 'Send Gift' }}
          </button>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <Icon name="gift" size="48" />
          <p>Select a gift to send</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePewGift } from '~/composables/usePewGift'

interface Props {
  postId: string
  disabled?: boolean
}

interface Emits {
  'gift-sent': [success: boolean]
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<Emits>()

const {
  giftTypes,
  balance,
  selectedGift,
  quantity,
  message,
  isAnonymous,
  categories,
  loadGiftTypes,
  loadBalance,
  sendGiftToPost,
  getGiftsByCategory,
  canAffordGift,
  totalCost
} = usePewGift()

const showPicker = ref(false)
const selectedCategory = ref('love')
const sending = ref(false)

const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    love: '❤️',
    support: '🤝',
    celebration: '🎉',
    funny: '😂',
    nature: '🌿',
    food: '🍕'
  }
  return icons[category] || '🎁'
}

const selectGift = (gift: any) => {
  selectedGift.value = gift
}

const sendGift = async () => {
  sending.value = true
  try {
    const success = await sendGiftToPost(props.postId)
    emit('gift-sent', success)
    if (success) {
      showPicker.value = false
    }
  } finally {
    sending.value = false
  }
}

const closePicker = () => {
  showPicker.value = false
}

onMounted(async () => {
  await loadGiftTypes()
  await loadBalance()
})
</script>

<style scoped>
.pewgift-picker {
  position: relative;
}

.gift-trigger-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: #6b7280;
  border-radius: 8px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gift-trigger-btn:hover:not(:disabled) {
  background: #f3f4f6;
  color: #f59e0b;
}

.gift-trigger-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

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
  z-index: 2000;
  padding: 16px;
}

.gift-picker-content {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.picker-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: #6b7280;
  border-radius: 8px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.balance-display {
  padding: 16px 24px;
  background: #f0f7ff;
  border-bottom: 1px solid #bfdbfe;
}

.balance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.balance-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.balance-value {
  font-size: 16px;
  font-weight: 700;
  color: #2563eb;
}

.category-tabs {
  display: flex;
  gap: 8px;
  padding: 12px 24px;
  border-bottom: 1px solid #e5e7eb;
  overflow-x: auto;
  flex-shrink: 0;
}

.category-tab {
  background: none;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.category-tab:hover {
  border-color: #2563eb;
  color: #2563eb;
}

.category-tab.active {
  background: #e3f2fd;
  border-color: #2563eb;
  color: #2563eb;
}

.gifts-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 24px;
  flex: 1;
  overflow-y: auto;
}

.gift-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.gift-card:hover:not(:disabled) {
  border-color: #2563eb;
  background: #f0f7ff;
  transform: translateY(-2px);
}

.gift-card.selected {
  border-color: #2563eb;
  background: #e3f2fd;
}

.gift-card:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.gift-emoji {
  font-size: 32px;
}

.gift-name {
  font-size: 12px;
  font-weight: 600;
  color: #1f2937;
  text-align: center;
}

.gift-price {
  font-size: 11px;
  color: #6b7280;
}

.gift-rarity {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
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

.selected-gift-details {
  padding: 24px;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-group label {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qty-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.qty-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
}

.qty-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
  font-weight: 600;
}

.qty-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.message-input {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  min-height: 60px;
}

.message-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
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
}

.checkbox-label input {
  cursor: pointer;
}

.total-cost {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  font-weight: 600;
}

.cost-value {
  color: #2563eb;
  font-size: 16px;
}

.send-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(245, 158, 11, 0.3);
}

.send-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: #9ca3af;
  text-align: center;
}

.empty-state p {
  margin: 12px 0 0 0;
  font-size: 14px;
}

@media (max-width: 640px) {
  .gifts-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .gift-picker-content {
    max-width: 100%;
    border-radius: 16px 16px 0 0;
  }
}
</style>
