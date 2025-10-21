<template>
  <div class="admin-escrow">
    <h3>Escrow Deals</h3>
    <ul>
      <li v-for="deal in deals" :key="deal.id">
        Trade {{ deal.tradeId }} - Amount: {{ deal.amount }} USDC
        <button @click="release(deal.id)">Release</button>
        <button @click="refund(deal.id)">Refund</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useEscrowDeal } from '@/composables/useEscrowDeal.js'

const deals = ref([])
const { releaseDeal, refundDeal } = useEscrowDeal()

onMounted(async () => {
  const res = await fetch('http://localhost:3000/api/admin/escrow-deals')
  deals.value = await res.json()
})

function release(id) {
  releaseDeal(id)
}
function refund(id) {
  refundDeal(id)
}
</script>

<style scoped>
.admin-escrow {
  border: 1px solid #ddd;
  padding: 1rem;
}
</style>
