<template>
  <div class="admin-fees">
    <h3>Fee Manager</h3>
    <label>Swap Fee ≤100 USDC:</label>
    <input v-model="swapLow" type="number" />
    <label>Swap Fee >100 USDC:</label>
    <input v-model="swapHigh" type="number" />
    <label>Gift Fee:</label>
    <input v-model="giftFee" type="number" />
    <button @click="update">Update Fees</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAdminControl } from '@/composables/use-admin-control'

const swapLow = ref(0)
const swapHigh = ref(0)
const giftFee = ref(0)
const { getFees, updateFees } = useAdminControl()

onMounted(async () => {
  const fees = await getFees()
  swapLow.value = fees.swapLow
  swapHigh.value = fees.swapHigh
  giftFee.value = fees.giftFee
})

function update() {
  updateFees(swapLow.value, swapHigh.value, giftFee.value)
}
</script>

<style scoped>
.admin-fees {
  border: 1px solid #aaa;
  padding: 1rem;
}
</style>
