<template>
  <div class="gift-button">
    <input type="number" v-model="amount" placeholder="Amount to gift" />
    <button @click="sendGift">🎁 Gift Pew</button>
    <p v-if="result">Gift sent! Split: {{ result.split.toCommenter || 0 }} / {{ result.split.toPostOwner }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  postId: String,
  commentId: String,
  recipientId: String
})

const amount = ref(0)
const result = ref(null)

async function sendGift() {
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
}
</script>

<style scoped>
.gift-button {
  margin-top: 1rem;
}
</style>
