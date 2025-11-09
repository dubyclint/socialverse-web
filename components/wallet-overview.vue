<template>
  <div class="wallet-overview">
    <h3>My Pocket</h3>
    <ul>
      <li v-for="(balance, currency) in wallet.balances" :key="currency">
        {{ currency.toUpperCase() }}: {{ balance }} 
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const wallet = ref({ balances: {} })

onMounted(async () => {
  const res = await fetch('http://localhost:3000/api/userwallet/get?userId=user123')
  wallet.value = await res.json()
})
</script>

<style scoped>
.wallet-overview {
  border: 1px solid #ddd;
  padding: 1rem;
}
</style>
