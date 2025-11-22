<template>
  <div class="escrow-status">
    <h3>Escrow Status</h3>
    <p>Amount: {{ escrow.amount }} USDC</p>
    <p>Fee: {{ escrow.fee }} USDC</p>
    <p>Status: {{ escrow.isReleased ? 'Released' : 'Pending' }}</p>
    <p>Admin Approval: {{ escrow.approvedByAdmin ? 'Approved' : 'Waiting' }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const escrow = ref({})

onMounted(async () => {
  const res = await fetch('http://localhost:3000/api/escrow/status?tradeId=trade123')
  escrow.value = await res.json()
})
</script>

<style scoped>
.escrow-status {
  border: 1px solid #ddd;
  padding: 1rem;
}
</style>
