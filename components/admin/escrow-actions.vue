<template>
  <div class="escrow-admin">
    <h3>Admin: Release or Refund Deal</h3>
    <input v-model.number="dealId" type="number" placeholder="Enter Deal ID" />
    <button @click="release">Release</button>
    <button @click="refund">Refund</button>
    <p v-if="txHash">✅ Action complete: {{ txHash }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useEscrowContract } from '@/composables/useEscrowContract'

const dealId = ref(0)
const txHash = ref('')
const { releaseDeal, refundDeal } = useEscrowContract()

async function release() {
  txHash.value = await releaseDeal(dealId.value)
}

async function refund() {
  txHash.value = await refundDeal(dealId.value)
}
</script>

<style scoped>
.escrow-admin {
  border: 1px solid #ccc;
  padding: 1rem;
  margin-top: 2rem;
}
</style>
