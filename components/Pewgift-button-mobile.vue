<!-- components/PewGiftButtonMobile.vue -->
<template>
  <div class="pew-gift-button-mobile">
    <button 
      @click="openGiftPicker" 
      class="gift-btn-mobile"
      :disabled="loading"
      title="Send a gift"
    >
      <span class="gift-icon">🎁</span>
      <span class="gift-label">Gift</span>
    </button>

    <!-- Gift Picker Modal -->
    <div v-if="showPicker" class="gift-picker-modal">
      <div class="modal-overlay" @click="closePicker"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>Send a Gift</h3>
          <button @click="closePicker" class="close-btn">✕</button>
        </div>

        <div class="gift-amount-section">
          <label>Gift Amount (PEW)</label>
          <input 
            v-model.number="giftAmount" 
            type="number" 
            min="1" 
            placeholder="Enter amount"
            class="amount-input"
          />
        </div>

        <div class="gift-options">
          <button 
            v-for="preset in presetAmounts" 
            :key="preset"
            @click="giftAmount = preset"
            class="preset-btn"
            :class="{ active: giftAmount === preset }"
          >
            {{ preset }} PEW
          </button>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div class="modal-actions">
          <button @click="closePicker" class="btn-cancel">Cancel</button>
          <button 
            @click="sendGift" 
            :disabled="!giftAmount || loading"
            class="btn-send"
          >
            {{ loading ? 'Sending...' : 'Send Gift' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePewGift } from '~/composables/use-pewgift'

const props = defineProps({
  recipientId: {
    type: String,
    required: true
  },
  postId: String,
  commentId: String
})

const emit = defineEmits(['gift-sent', 'error'])

const showPicker = ref(false)
const giftAmount = ref(null)
const loading = ref(false)
const error = ref(null)

const presetAmounts = [10, 50, 100, 500, 1000]

const { sendGift: sendGiftAPI } = usePewGift()

function openGiftPicker() {
  showPicker.value = true
  error.value = null
}

function closePicker() {
  showPicker.value = false
  giftAmount.value = null
  error.value = null
}

async function sendGift() {
  if (!giftAmount.value || giftAmount.value <= 0) {
    error.value = 'Please enter a valid amount'
    return
  }

  loading.value = true
  error.value = null

  try {
    const result = await sendGiftAPI({
      recipientId: props.recipientId,
      amount: giftAmount.value,
      postId: props.postId,
      commentId: props.commentId
    })

    if (result.success) {
      emit('gift-sent', result)
      closePicker()
    } else {
      error.value = result.message || 'Failed to send gift'
      emit('error', error.value)
    }
  } catch (err) {
    error.value = err.message || 'An error occurred'
    emit('error', error.value)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.pew-gift-button-mobile {
  display: inline-block;
}

.gift-btn-mobile {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.gift-btn-mobile:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.gift-btn-mobile:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.gift-icon {
  font-size: 16px;
}

.gift-label {
  font-size: 12px;
}

.gift-picker-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  background: white;
  border-radius: 16px 16px 0 0;
  padding: 20px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.gift-amount-section {
  margin-bottom: 20px;
}

.gift-amount-section label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.amount-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.amount-input:focus {
  outline: none;
  border-color: #667eea;
}

.gift-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.preset-btn {
  padding: 10px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.preset-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.preset-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  gap: 10px;
}

.btn-cancel,
.btn-send {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel {
  background: #f0f0f0;
  color: #333;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-send {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-send:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-send:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .gift-options {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
