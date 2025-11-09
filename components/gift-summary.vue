<template>
  <div class="gift-summary">
    <h3>Gift Summary</h3>
    <p>Total Gifts Received: {{ totalReceived }} USDC</p>
    <p>Total Gifts Sent: {{ totalSent }} USDC</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const totalReceived = ref(0)
const totalSent = ref(0)

onMounted(async () => {
  const res = await fetch('http://localhost:3000/api/pewgift/summary?userId=user123')
  const data = await res.json()
  totalReceived.value = data.received
  totalSent.value = data.sent
})
</script>

<style scoped>
.gift-summary {
  border: 1px solid #aaa;
  padding: 1rem;
}
</style>
