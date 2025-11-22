<template>
  <div class="crypto-swap">
    <h3>Swap Crypto</h3>
    <form @submit.prevent="swap">
      <label>From:</label>
      <select v-model="fromCurrency">
        <option v-for="c in currencies" :key="c" :value="c">{{ c }}</option>
      </select>

      <label>To:</label>
      <select v-model="toCurrency">
        <option v-for="c in currencies" :key="c" :value="c">{{ c }}</option>
      </select>

      <label>Amount:</label>
      <input type="number" v-model="amount" />

      <button type="submit">Swap</button>
    </form>
    <p v-if="swapResult">Swap successful. Fee: {{ swapResult.fee }} USDC</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const currencies = ['usdt', 'usdc', 'btc', 'eth', 'sol', 'matic', 'xaut']
const fromCurrency = ref('usdt')
const toCurrency = ref('usdc')
const amount = ref(0)
const swapResult = ref(null)

async function swap() {
  const res = await fetch('http://localhost:3000/api/swap/swap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'user123',
      fromCurrency: fromCurrency.value,
      toCurrency: toCurrency.value,
      amount: amount.value
    })
  })
  swapResult.value = await res.json()
}
</script>

<style scoped>
.crypto-swap {
  border: 1px solid #bbb;
  padding: 1rem;
}
</style>
