<template>
  <div class="escrow-form">
    <h3>Create Escrow Deal</h3>
    <form @submit.prevent="submitDeal">
      <label>Seller Address:</label>
      <input v-model="seller" type="text" required />

      <label>Amount (USDC):</label>
      <input v-model.number="amount" type="number" required />

      <button type="submit">Create Deal</button>
    </form>
    <p v-if="txHash">✅ Deal created: {{ txHash }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useEscrowContract } from '@/composables/useEscrowContract'

const seller = ref('')
const amount = ref(0)
const txHash = ref('')
const { createDeal } = useEscrowContract()

async function submitDeal() {
  txHash.value = await createDeal(seller.value, BigInt(amount.value * 1e6))
}
</script>

<style scoped>
.escrow-form {
  border: 1px solid #ccc;
  padding: 1rem;
}
</style>
