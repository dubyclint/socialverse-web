<template>
  <div class="admin-escrow-page">
    <h2>🛡️ Escrow Admin Dashboard</h2>

    <div class="filters">
      <input v-model="searchQuery" placeholder="Search buyer or seller…" />
      <select v-model="statusFilter">
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="released">Released</option>
        <option value="refunded">Refunded</option>
      </select>
      <input v-model.number="minAmount" type="number" placeholder="Min USDC" />
      <input v-model.number="maxAmount" type="number" placeholder="Max USDC" />
      <input v-model="startDate" type="date" />
      <input v-model="endDate" type="date" />
    </div>

    <EscrowAdminActions />
    <EscrowPendingTable
      :search="searchQuery"
      :status="statusFilter"
      :minAmount="minAmount"
      :maxAmount="maxAmount"
      :startDate="startDate"
      :endDate="endDate"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import EscrowAdminActions from '@/components/EscrowAdminActions.vue'
import EscrowPendingTable from '@/components/EscrowPendingTable.vue'

const searchQuery = ref('')
const statusFilter = ref('')
const minAmount = ref(null)
const maxAmount = ref(null)
const startDate = ref('')
const endDate = ref('')
</script>

<style scoped>
.admin-escrow-page {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
}
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}
input, select {
  padding: 0.5rem;
  font-size: 1rem;
}
</style>

