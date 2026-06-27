<!-- FILE: /components/admin/escrow-action-control.vue -->
<!-- MERGED: escrow-actions.vue + escrow-control.vue -->
<!-- Comprehensive escrow management with deal list and individual actions -->

<template>
  <div class="admin-escrow">
    <div class="escrow-header">
      <h3>🛡️ Escrow Management</h3>
      <div class="header-actions">
        <button @click="loadDeals" class="btn btn-secondary" :disabled="loading">
          {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="alert alert-error">
      <p>{{ error }}</p>
    </div>

    <!-- Manual Action Section -->
    <div class="manual-action-section">
      <h4>Manual Deal Action</h4>
      <div class="form-group">
        <label>Deal ID</label>
        <input 
          v-model.number="dealId" 
          type="number" 
          placeholder="Enter Deal ID"
          class="form-input"
        />
      </div>
      <div class="action-buttons">
        <button @click="release" class="btn btn-success" :disabled="!dealId || actionLoading">
          {{ actionLoading === 'release' ? 'Processing...' : 'Release' }}
        </button>
        <button @click="refund" class="btn btn-danger" :disabled="!dealId || actionLoading">
          {{ actionLoading === 'refund' ? 'Processing...' : 'Refund' }}
        </button>
      </div>
      <p v-if="txHash" class="success-text">✅ Action complete: {{ txHash }}</p>
    </div>

    <!-- Deals List Section -->
    <div class="deals-section">
      <h4>Active Escrow Deals</h4>
      
      <div v-if="deals.length === 0" class="empty-state">
        <p>No escrow deals found</p>
      </div>

      <ul v-else class="deals-list">
        <li v-for="deal in deals" :key="deal.id" class="deal-item">
          <div class="deal-info">
            <div class="deal-header">
              <span class="deal-id">Deal #{{ deal.id }}</span>
              <span class="trade-id">Trade {{ deal.tradeId }}</span>
            </div>
            <div class="deal-details">
              <span class="amount">💰 {{ deal.amount }} USDC</span>
              <span v-if="deal.status" class="status" :class="`status-${deal.status}`">
                {{ deal.status }}
              </span>
            </div>
          </div>
          <div class="deal-actions">
            <button 
              @click="releaseDeal(deal.id)" 
              class="btn btn-sm btn-success"
              :disabled="processingDeal === deal.id"
            >
              {{ processingDeal === deal.id ? '...' : 'Release' }}
            </button>
            <button 
              @click="refundDeal(deal.id)" 
              class="btn btn-sm btn-danger"
              :disabled="processingDeal === deal.id"
            >
              {{ processingDeal === deal.id ? '...' : 'Refund' }}
            </button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEscrowContract } from '@/composables/use-escrow-contract'

interface Deal {
  id: number
  tradeId: number
  amount: number
  status?: string
}

const deals = ref<Deal[]>([])
const dealId = ref(0)
const txHash = ref('')
const loading = ref(false)
const actionLoading = ref<string | null>(null)
const processingDeal = ref<number | null>(null)
const error = ref('')

const { releaseDeal: contractRelease, refundDeal: contractRefund } = useEscrowContract()

const loadDeals = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const res = await fetch('http://localhost:3000/api/admin/escrow-deals')
    if (!res.ok) throw new Error('Failed to load deals')
    deals.value = await res.json()
  } catch (err: any) {
    error.value = err.message || 'Failed to load escrow deals'
    console.error('Failed to load escrow deals:', err)
  } finally {
    loading.value = false
  }
}

const release = async () => {
  if (!dealId.value) return
  
  actionLoading.value = 'release'
  txHash.value = ''
  
  try {
    txHash.value = await contractRelease(dealId.value)
    dealId.value = 0
    await loadDeals()
  } catch (err: any) {
    error.value = err.message || 'Failed to release deal'
    console.error('Failed to release deal:', err)
  } finally {
    actionLoading.value = null
  }
}

const refund = async () => {
  if (!dealId.value) return
  
  actionLoading.value = 'refund'
  txHash.value = ''
  
  try {
    txHash.value = await contractRefund(dealId.value)
    dealId.value = 0
    await loadDeals()
  } catch (err: any) {
    error.value = err.message || 'Failed to refund deal'
    console.error('Failed to refund deal:', err)
  } finally {
    actionLoading.value = null
  }
}

const releaseDeal = async (id: number) => {
  processingDeal.value = id
  
  try {
    await contractRelease(id)
    await loadDeals()
  } catch (err: any) {
    error.value = err.message || 'Failed to release deal'
    console.error('Failed to release deal:', err)
  } finally {
    processingDeal.value = null
  }
}

const refundDeal = async (id: number) => {
  processingDeal.value = id
  
  try {
    await contractRefund(id)
    await loadDeals()
  } catch (err: any) {
    error.value = err.message || 'Failed to refund deal'
    console.error('Failed to refund deal:', err)
  } finally {
    processingDeal.value = null
  }
}

onMounted(() => {
  loadDeals()
})
</script>

<style scoped>
.admin-escrow {
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.escrow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.escrow-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.alert {
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.alert-error {
  background: #fee;
  border: 1px solid #fcc;
  color: #c33;
}

.manual-action-section {
  background: #f9f9f9;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  border: 1px solid #eee;
}

.manual-action-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #555;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.success-text {
  color: #28a745;
  font-size: 0.9rem;
  margin: 0.5rem 0 0 0;
}

.deals-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #555;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #999;
  background: #f9f9f9;
  border-radius: 4px;
}

.deals-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.deal-item {
  padding: 1rem;
  margin-bottom: 0.75rem;
  background: #f9f9f9;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #eee;
}

.deal-info {
  flex: 1;
}

.deal-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.deal-id {
  font-weight: bold;
  color: #333;
}

.trade-id {
  color: #666;
  font-size: 0.9rem;
}

.deal-details {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
}

.amount {
  color: #28a745;
  font-weight: 500;
}

.status {
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
}

.status-completed {
  background: #d4edda;
  color: #155724;
}

.status-failed {
  background: #f8d7da;
  color: #721c24;
}

.deal-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #218838;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.btn-sm {
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
}
</style>
