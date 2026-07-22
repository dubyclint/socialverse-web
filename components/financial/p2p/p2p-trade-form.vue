<template>
  <div class="p2p-form">
    <h2>Submit P2P Trade Profile</h2>
    <form @submit.prevent="submitProfile">
      <label>Select accepted currencies (1–5):</label>
      <div class="currency-list">
        <label v-for="currency in currencies" :key="currency">
          <input type="checkbox" :value="currency" v-model="selected" />
          {{ currency }}
        </label>
      </div>
      <button :disabled="selected.length < 1 || selected.length > 5">Submit</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const currencies = ['USDT', 'USDC', 'BTC', 'ETH', 'SOL']
const selected = ref([])

function submitProfile() {
  const payload = {
    userId: 'user123', // Replace with dynamic user
    acceptedCurrencies: selected.value
  }
  fetch('http://localhost:3000/api/p2p/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}
</script>

<style scoped>
.p2p-form {
  border: 1px solid #ccc;
  padding: 1rem;
}
.currency-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
