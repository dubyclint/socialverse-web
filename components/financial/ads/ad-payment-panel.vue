<template>
  <div>
    <h4>Your Ad Balance</h4>
    <p>{{ balance }} USDT</p>
    <input v-model.number="amount" placeholder="Top up amount" />
    <button @click="topUp">Top Up</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const balance = ref(0)
const amount = ref(0)

onMounted(async () => {
  const res = await fetch('/api/ads/balance')
  balance.value = await res.json()
})

async function topUp() {
  await fetch('/api/ads/topup', {
    method: 'POST',
    body: JSON.stringify({ amount: amount.value }),
    headers: { 'Content-Type': 'application/json' }
  })
  balance.value += amount.value
  amount.value = 0
}
</script>
