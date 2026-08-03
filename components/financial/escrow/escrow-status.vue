<template>
  <div class="escrow-status">
    <h3>Escrow Status</h3>
    <p v-if="!escrow">No escrow selected.</p>
    <template v-else>
      <p>Amount: {{ escrow.amount }} USDC</p>
      <p>Fee: {{ escrow.fee }} USDC</p>
      <p>Status: {{ escrow.isReleased ? 'Released' : 'Pending' }}</p>
      <p>Admin Approval: {{ escrow.approvedByAdmin ? 'Approved' : 'Waiting' }}</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface EscrowStatus {
  amount: number
  fee: number
  isReleased: boolean
  approvedByAdmin: boolean
}

const props = defineProps<{ tradeId?: string }>()
const escrow = ref<EscrowStatus | null>(null)

onMounted(async () => {
  if (!props.tradeId) return
  escrow.value = await $fetch<EscrowStatus>('/api/escrow', {
    query: { tradeId: props.tradeId }
  })
})
</script>

<style scoped>
.escrow-status {
  border: 1px solid #ddd;
  padding: 1rem;
}
</style>
