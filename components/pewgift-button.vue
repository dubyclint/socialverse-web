<template>
  <div class="pewgift-button">
    <input 
      v-model.number="amount" 
      type="number" 
      placeholder="Amount to gift" 
    />
    <button @click="sendGift" :disabled="loading">
      {{ loading ? '⏳ Sending...' : '🎁 Gift Pew' }}
    </button>
    <p v-if="result" class="success">
      Gift sent successfully! Split: {{ result.split.toCommenter || 0 }} / {{ result.split.toPostOwner }}
    </p>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  recipientId: {
    type: String,
    required: true
  },
  postId: String,
  commentId: String
})

const amount = ref(0)
const result = ref(null)
const error = ref(null)
const loading = ref(false)
const api = useApi()

async function sendGift() {
  if (!amount.value || amount.value <= 0) {
    error.value = 'Please enter a valid amount'
    return
  }

  loading.value = true
  error.value = null

  try {
    // Try API first (preferred method)
    const giftResult = await api.gift.send(props.recipientId, amount.value)
    
    if (giftResult.success) {
      result.value = giftResult.data
      amount.value = 0
    } else {
      error.value = giftResult.message || 'Failed to send gift'
    }
  } catch (err) {
    // Fallback to direct fetch if API fails
    try {
      const res = await fetch('http://localhost:3000/api/pewgift/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: 'user123',
          recipientId: props.recipientId,
          postId: props.postId,
          commentId: props.commentId,
          amount: amount.value
        })
      })
      result.value = await res.json()
      amount.value = 0
    } catch (fallbackErr) {
      error.value = err.message || 'Failed to send gift'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.gift-button {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}

input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.2s;
}

button:hover:not(:disabled) {
  opacity: 0.9;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success {
  color: green;
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

.error {
  color: red;
  margin-top: 0.5rem;
  font-size: 0.9rem;
}
</style>
