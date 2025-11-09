<template>
  <div class="pew-gift-button">
    <!-- Gift Button -->
    <button 
      @click="showGiftModal = true" 
      class="gift-btn"
      :class="{ 'disabled': loading }"
      :disabled="loading"
    >
      <span class="gift-icon">🎁</span>
      <span class="gift-text">PewGift</span>
    </button>

    <!-- Gift Modal -->
    <div v-if="showGiftModal" class="modal-overlay" @click="closeModal">
      <div class="gift-modal" @click.stop>
        <div class="modal-header">
          <h3>Send PewGift</h3>
          <button @click="closeModal" class="close-btn">×</button>
        </div>

        <div class="modal-content">
          <!-- Gift Amount Input -->
          <div class="gift-amount-section">
            <label>Gift Amount</label>
            <div class="amount-input-group">
              <input 
                v-model="giftAmount" 
                type="number" 
                min="1" 
                step="0.01"
                placeholder="Enter amount"
                class="amount-input"
                @input="updatePreview"
              >
              <span class="currency">PEW</span>
            </div>
            
            <!-- Quick Amount Buttons -->
            <div class="quick-amounts">
              <button 
                v-for="amount in quickAmounts" 
                :key="amount"
                @click="setQuickAmount(amount)"
                class="quick-amount-btn"
                :class="{ 'active': giftAmount == amount }"
              >
                {{ amount }}
              </button>
            </div>
          </div>

          <!-- Gift Preview -->
          <div v-if="preview && giftAmount > 0" class="gift-preview">
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

          <!-- Gift Message -->
          <div class="gift-message-section">
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
    </div>

    <!-- Success Toast -->
    <div v-if="showSuccess" class="success-toast">
      <span class="success-icon">✅</span>
      <span>Gift sent successfully!</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

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
});

// Reactive data
const showGiftModal = ref(false);
const giftAmount = ref('');
const giftMessage = ref('');
const preview = ref(null);
const loading = ref(false);
const error = ref('');
const showSuccess = ref(false);

// Quick amount options
const quickAmounts = [5, 10, 25, 50, 100];

// Computed properties
const canSendGift = computed(() => {
  return giftAmount.value > 0 && 
         preview.value && 
         preview.value.balanceCheck.canAfford && 
         !loading.value;
});

// Methods
const setQuickAmount = (amount) => {
  giftAmount.value = amount;
  updatePreview();
};

const updatePreview = async () => {
  if (!giftAmount.value || giftAmount.value <= 0) {
    preview.value = null;
    return;
  }

  try {
    const response = await $fetch('/api/pewgift/preview', {
      query: {
        amount: giftAmount.value,
        postId: props.postId,
        commentId: props.commentId
      }
    });

    if (response.success) {
      preview.value = response.data;
      error.value = '';
    }
  } catch (err) {
    console.error('Error fetching preview:', err);
    error.value = 'Failed to calculate gift preview';
  }
};

const sendGift = async () => {
  if (!canSendGift.value) return;

  loading.value = true;
  error.value = '';

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
    });

    if (response.success) {
      showSuccess.value = true;
      closeModal();
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        showSuccess.value = false;
      }, 3000);

      // Emit success event
      emit('giftSent', response.data);
    }
  } catch (err) {
    console.error('Error sending gift:', err);
    error.value = err.data?.error || 'Failed to send gift';
  } finally {
    loading.value = false;
  }
};

const closeModal = () => {
  showGiftModal.value = false;
  giftAmount.value = '';
  giftMessage.value = '';
  preview.value = null;
  error.value = '';
};

// Watch for amount changes
watch(giftAmount, (newAmount) => {
  if (newAmount && newAmount > 0) {
    updatePreview();
  } else {
    preview.value = null;
  }
});

// Emits
const emit = defineEmits(['giftSent']);
</script>

<style scoped>
.pew-gift-button {
  position: relative;
}

.gift-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.gift-btn:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.gift-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.gift-icon {
  font-size: 1.1rem;
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
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-content {
  padding: 1.5rem;
}

.gift-amount-section {
  margin-bottom: 1.5rem;
}

.gift-amount-section label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.amount-input-group {
  display: flex;
  align-items: center;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.amount-input {
  flex: 1;
  padding: 0.75rem;
  border: none;
  font-size: 1rem;
  outline: none;
}

.currency {
  padding: 0.75rem;
  background: #f8fafc;
  color: #6b7280;
  font-weight: 500;
  border-left: 1px solid #e5e7eb;
}

.quick-amounts {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.quick-amount-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
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

.gift-preview {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.preview-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #374151;
}

.preview-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.preview-row:last-child {
  border-bottom: none;
}

.preview-row.total {
  font-weight: 600;
  font-size: 1.1rem;
  color: #1f2937;
  border-top: 2px solid #d1d5db;
  margin-top: 0.5rem;
  padding-top: 1rem;
}

.amount {
  color: #059669;
  font-weight: 500;
}

.fee {
  color: #dc2626;
  font-size: 0.9rem;
}

.split-info {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #d1d5db;
}

.split-info h5 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: #6b7280;
}

.split-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
  font-size: 0.9rem;
}

.balance-check {
  margin-top: 1rem;
  padding: 1rem;
  background: #f0fdf4;
  border-radius: 8px;
  border: 1px solid #bbf7d0;
}

.balance-check.insufficient {
  background: #fef2f2;
  border-color: #fecaca;
}

.balance-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.insufficient-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  color: #dc2626;
  font-size: 0.9rem;
}

.gift-message-section {
  margin-bottom: 1.5rem;
}

.gift-message-section label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.message-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  outline: none;
}

.message-input:focus {
  border-color: #667eea;
}

.char-count {
  text-align: right;
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  margin-bottom: 1rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5a67d8;
}

.btn-primary.loading {
  background: #9ca3af;
}

.success-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #10b981;
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  z-index: 1001;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 480px) {
  .gift-modal {
    width: 95%;
    margin: 1rem;
  }
  
  .modal-content {
    padding: 1rem;
  }
  
  .quick-amounts {
    justify-content: center;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>
