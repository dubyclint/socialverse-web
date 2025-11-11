<template>
  <div class="admin/escrow">
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
import { useEscrowContract } from '@/composables/use-escrow-contract'

const deals = ref([])
const escrow = useEscrowContract()

onMounted(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/admin/escrow-deals')
    deals.value = await res.json()
  } catch (error) {
    console.error('Failed to load escrow deals:', error)
  }
})

async function release(id) {
  try {
    await escrow.approveDeal(BigInt(id))
  } catch (error) {
    console.error('Failed to release deal:', error)
  }
}

async function refund(id) {
  try {
    await escrow.refundDeal(BigInt(id))
  } catch (error) {
    console.error('Failed to refund deal:', error)
  }
}
</script>

<style scoped>
.admin-escrow {
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.admin-escrow h3 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  color: #333;
}

.admin-escrow ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.admin-escrow li {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: #f9f9f9;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.admin-escrow button {
  padding: 0.5rem 1rem;
  margin-left: 0.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.admin-escrow button:hover {
  background: #0056b3;
}

.admin-escrow button:last-child {
  background: #dc3545;
}

.admin-escrow button:last-child:hover {
  background: #c82333;
}
</style>
