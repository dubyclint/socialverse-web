<!-- components/pewgift-button.vue -->
<!-- CONSOLIDATED RESPONSIVE COMPONENT -->
<!-- Replaces: Pewgift-button-mobile.vue, Pewgift-button.vue, /pewgift-button.vue -->

<template>
  <div class="pewgift-button-wrapper">
    <!-- Button Trigger -->
    <button 
      @click="openModal" 
      class="gift-btn"
      :class="{ 'disabled': loading }"
      :disabled="loading"
      :title="isMobile ? 'Send a gift' : 'Send PewGift'"
    >
      <span class="gift-icon">🎁</span>
      <span class="gift-label">{{ isMobile ? 'Gift' : 'PewGift' }}</span>
    </button>

    <!-- Gift Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop :class="{ 'mobile': isMobile }">
        <!-- Modal Header -->
        <div class="modal-header">
          <h3>{{ isMobile ? 'Send a Gift' : 'Send PewGift' }}</h3>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>

        <!-- Gift Amount Section -->
        <div class="gift-amount-section">
          <label>Gift Amount (PEW)</label>
          <div class="amount-input-group">
            <input 
              v-model.number="giftAmount" 
              type="number" 
              min="1" 
              step="0.01"
              placeholder="Enter amount"
              class="amount-input"
              @input="updatePreview"
            />
            <span class="currency">PEW</span>
          </div>

          <!-- Quick Amount Buttons -->
          <div class="quick-amounts">
            <button 
              v-for="amount in quickAmounts" 
              :key="amount"
              @click="setQuickAmount(amount)"
              class="quick-amount-btn"
              :class="{ 'active': giftAmount === amount }"
            >
              {{ amount }}
            </button>
          </div>
        </div>

        <!-- Desktop: Transaction Preview -->
        <div v-if="!isMobile && preview && giftAmount > 0" class="gift-preview">
          <div class="preview-section">
            <h4>Transaction Preview</h4>
            
            <div class="preview-row">
              <span>Gift Amount:</span>
              <span class="amount">{{ giftAmount }} PEW</span>
            </div>
            
            <div class="preview-row">
              <span>Platform Fee ({{ (preview.fees.platformFee / giftAmount * 100).toFixed(1) }}%):</span>
              <span class="fee">{{ preview.fees.platformFee }} PEW</span>
            </div>
            
            <div class="preview-row">
              <span>Processing Fee:</span>
              <span class="fee">{{ preview.fees.processingFee }} PEW</span>
            </div>
            
            <div class="preview-row total">
              <span>Total Cost:</span>
              <span class="amount">{{ preview.fees.breakdown.totalWithFees }} PEW</span>
            </div>

            <!-- Split Information -->
            <div v-if="preview.split.recipients.length > 1" class="split-info">
              <h5>Gift Distribution:</h5>
              <div 
                v-for="recipient in preview.split.recipients" 
                :key="recipient.userId"
                class="split-row"
              >
                <span>{{ recipient.type === 'commenter' ? 'Commenter' : 'Post Owner' }} ({{ recipient.percentage }}%):</span>
                <span class="amount">{{ recipient.amount }} PEW</span>
              </div>
            </div>

            <!-- Balance Check -->
            <div class="balance-check" :class="{ 'insufficient': !preview.balanceCheck.canAfford }">
              <div class="balance-row">
                <span>Your Balance:</span>
                <span>{{ preview.balanceCheck.availableBalance }} PEW</span>
              </div>
              <div v-if="!preview.balanceCheck.canAfford" class="insufficient-warning">
                <span class="warning-icon">⚠️</span>
                <span>Insufficient balance. Need {{ preview.balanceCheck.shortfall }} more PEW</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Gift Message Section (Desktop only) -->
        <div v-if="!isMobile" class="gift-message-section">
          <label>Message (Optional)</label>
          <textarea 
            v-model="giftMessage" 
            placeholder="Add a personal message..."
            class="message-input"
            maxlength="200"
          ></textarea>
          <div class="char-count">{{ giftMessage.length }}/200</div>
        </div>

        <!-- Error Display -->
        <div v-if="error" class="error-message">
          <span class="error-icon">❌</span>
          <span>{{ error }}</span>
        </div>

        <!-- Action Buttons -->
        <div class="modal-actions">
          <button @click="closeModal" class="btn btn-secondary">Cancel</button>
          <button 
            @click="sendGift" 
            class="btn btn-primary"
            :disabled="!canSendGift || loading"
            :class="{ 'loading': loading }"
          >
            <span v-if="loading">Sending...</span>
            <span v-else>Send Gift 🎁</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Success Toast -->
    <div v-if="showSuccess" class="success-toast">
      <span class="success-icon">✅</span>
      <span>Gift sent successfully!</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { usePewGift } from '~/composables/use-pewgift'

// Props
const props = defineProps({
  recipientId: {
    type: String,
    required: true
  },
  postId: {
    type: String,
    default: null
  },
  commentId: {
    type: String,
    default: null
  }
})

// Emits
const emit = defineEmits(['gift-sent', 'error'])

// Reactive data
const showModal = ref(false)
const giftAmount = ref(null)
const giftMessage = ref('')
const preview = ref(null)
const loading = ref(false)
const error = ref('')
const showSuccess = ref(false)

// Quick amount options
const quickAmounts = [5, 10, 25, 50, 100]

// Composables
const { sendGift: sendGiftAPI } = usePewGift()

// Detect mobile
const isMobile = computed(() => {
  if (process.client) {
    return window.innerWidth < 768
  }
  return false
})

// Computed properties
const canSendGift = computed(() => {
  return giftAmount.value > 0 && 
         preview.value && 
         preview.value.balanceCheck.canAfford && 
         !loading.value
})

// Methods
const openModal = () => {
  showModal.value = true
  error.value = ''
}

const closeModal = () => {
  showModal.value = false
  giftAmount.value = null
  giftMessage.value = ''
  preview.value = null
  error.value = ''
}

const setQuickAmount = (amount) => {
  giftAmount.value = amount
  updatePreview()
}

const updatePreview = async () => {
  if (!giftAmount.value || giftAmount.value <= 0) {
    preview.value = null
    return
  }

  try {
    const response = await $fetch('/api/pewgift/preview', {
      query: {
        amount: giftAmount.value,
        postId: props.postId,
        commentId: props.commentId
      }
    })

    if (response.success) {
      preview.value = response.data
      error.value = ''
    }
  } catch (err) {
    console.error('Error fetching preview:', err)
    error.value = 'Failed to calculate gift preview'
  }
}

const sendGift = async () => {
  if (!canSendGift.value) return

  loading.value = true
  error.value = ''

  try {
    const response = await $fetch('/api/pewgift/send', {
      method: 'POST',
      body: {
        recipientId: props.recipientId,
        postId: props.postId,
        commentId: props.commentId,
        amount: parseFloat(giftAmount.value),
        message: giftMessage.value || null
      }
    })

    if (response.success) {
      showSuccess.value = true
      emit('gift-sent', response.data)
      
      // Hide success toast after 3 seconds
      setTimeout(() => {
        showSuccess.value = false
        closeModal()
      }, 3000)
    } else {
      error.value = response.message || 'Failed to send gift'
      emit('error', error.value)
    }
  } catch (err) {
    error.value = err.message || 'An error occurred'
    emit('error', error.value)
  } finally {
    loading.value = false
  }
}

// Watch for window resize to update mobile state
if (process.client) {
  window.addEventListener('resize', () => {
    // Component will reactively update based on isMobile computed property
  })
}
</script>

<style scoped>
/* Container */
.pewgift-button-wrapper {
  display: inline-block;
  position: relative;
}

/* Button Styles */
.gift-btn {
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

.gift-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.gift-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.gift-icon {
  font-size: 16px;
}

.gift-label {
  font-size: 12px;
}

/* Modal Overlay */
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

.modal-overlay.mobile {
  align-items: flex-end;
}

/* Modal Content */
.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-content.mobile {
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-width: 100%;
  max-height: 80vh;
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

/* Modal Header */
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
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #333;
}

/* Gift Amount Section */
.gift-amount-section {
  margin-bottom: 20px;
}

.gift-amount-section label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.amount-input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.amount-input {
  width: 100%;
  padding: 12px;
  padding-right: 40px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.amount-input:focus {
  outline: none;
  border-color: #667eea;
}

.currency {
  position: absolute;
  right: 12px;
  color: #999;
  font-weight: 600;
  font-size: 14px;
}

/* Quick Amount Buttons */
.quick-amounts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.quick-amount-btn {
  padding: 8px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.3s;
}

.quick-amount-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.quick-amount-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

/* Gift Preview (Desktop) */
.gift-preview {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.preview-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 700;
  color: #333;
}

.preview-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 13px;
  color: #666;
  border-bottom: 1px solid #e0e0e0;
}

.preview-row.total {
  border-bottom: none;
  font-weight: 600;
  color: #333;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 2px solid #e0e0e0;
}

.preview-row .amount {
  color: #667eea;
  font-weight: 600;
}

.preview-row .fee {
  color: #e74c3c;
  font-weight: 600;
}

/* Split Information */
.split-info {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e0e0e0;
}

.split-info h5 {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 700;
  color: #333;
  text-transform: uppercase;
}

.split-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 12px;
  color: #666;
}

.split-row .amount {
  color: #667eea;
  font-weight: 600;
}

/* Balance Check */
.balance-check {
  margin-top: 12px;
  padding: 12px;
  background: #e8f5e9;
  border-radius: 6px;
  border-left: 4px solid #4caf50;
}

.balance-check.insufficient {
  background: #ffebee;
  border-left-color: #f44336;
}

.balance-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #333;
  font-weight: 600;
}

.insufficient-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 12px;
  color: #c62828;
}

.warning-icon {
  font-size: 14px;
}

/* Gift Message Section */
.gift-message-section {
  margin-bottom: 20px;
}

.gift-message-section label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.message-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.3s;
}

.message-input:focus {
  outline: none;
  border-color: #667eea;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

/* Error Message */
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 13px;
}

.error-icon {
  font-size: 16px;
}

/* Action Buttons */
.modal-actions {
  display: flex;
  gap: 12px;
}

.btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn.loading {
  opacity: 0.8;
}

/* Success Toast */
.success-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #4caf50;
  color: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 2000;
  animation: slideInUp 0.3s ease;
}

@keyframes slideInUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.success-icon {
  font-size: 18px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-content {
    border-radius: 16px 16px 0 0;
    width: 100%;
    max-width: 100%;
    max-height: 80vh;
  }

  .quick-amounts {
    grid-template-columns: repeat(3, 1fr);
  }

  .modal-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .success-toast {
    bottom: 10px;
    right: 10px;
    left: 10px;
  }
}
</style>
