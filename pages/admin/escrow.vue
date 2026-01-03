<template>
  <div class="admin-escrow-page">
    <div class="header">
      <h1>🛡️ Escrow Admin Dashboard</h1>
      <div class="stats">
        <div class="stat-card">
          <span class="label">Total Escrow Value</span>
          <span class="value">${{ totalEscrowValue.toFixed(2) }}</span>
        </div>
        <div class="stat-card">
          <span class="label">Pending Escrows</span>
          <span class="value">{{ pendingCount }}</span>
        </div>
        <div class="stat-card">
          <span class="label">Released</span>
          <span class="value">{{ releasedCount }}</span>
        </div>
        <div class="stat-card">
          <span class="label">Refunded</span>
          <span class="value">{{ refundedCount }}</span>
        </div>
      </div>
    </div>

    <div class="filters-section">
      <h2>Filters</h2>
      <div class="filters">
        <input 
          v-model="searchQuery" 
          type="text"
          placeholder="Search by trade ID, buyer, or seller…" 
          class="filter-input"
        />
        <select v-model="statusFilter" class="filter-select">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="released">Released</option>
          <option value="refunded">Refunded</option>
        </select>
        <input 
          v-model.number="minAmount" 
          type="number" 
          placeholder="Min Amount" 
          class="filter-input"
        />
        <input 
          v-model.number="maxAmount" 
          type="number" 
          placeholder="Max Amount" 
          class="filter-input"
        />
        <input 
          v-model="startDate" 
          type="date" 
          class="filter-input"
        />
        <input 
          v-model="endDate" 
          type="date" 
          class="filter-input"
        />
        <button @click="applyFilters" class="btn-primary">Apply Filters</button>
        <button @click="resetFilters" class="btn-secondary">Reset</button>
      </div>
    </div>

    <div class="table-section">
      <h2>Escrow Trades</h2>
      <div v-if="loading" class="loading">Loading escrow trades...</div>
      <div v-else-if="filteredTrades.length === 0" class="empty">
        No escrow trades found
      </div>
      <table v-else class="escrow-table">
        <thead>
          <tr>
            <th>Trade ID</th>
            <th>Buyer</th>
            <th>Seller</th>
            <th>Amount</th>
            <th>Token</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="trade in filteredTrades" :key="trade.id" class="trade-row">
            <td class="trade-id">{{ trade.trade_id }}</td>
            <td>{{ trade.buyer_id.substring(0, 8) }}...</td>
            <td>{{ trade.seller_id.substring(0, 8) }}...</td>
            <td class="amount">${{ trade.amount.toFixed(2) }}</td>
            <td>{{ trade.token }}</td>
            <td>
              <span :class="['status-badge', getStatusClass(trade)]">
                {{ getStatus(trade) }}
              </span>
            </td>
            <td>{{ formatDate(trade.timestamp) }}</td>
            <td class="actions">
              <button 
                v-if="!trade.is_released && !trade.is_refunded"
                @click="releaseEscrow(trade.trade_id)"
                class="btn-small btn-success"
              >
                Release
              </button>
              <button 
                v-if="!trade.is_released && !trade.is_refunded"
                @click="refundEscrow(trade.trade_id)"
                class="btn-small btn-danger"
              >
                Refund
              </button>
              <button 
                @click="viewDetails(trade)"
                class="btn-small btn-info"
              >
                Details
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalTrades > 0" class="pagination">
      <button 
        @click="previousPage" 
        :disabled="currentPage === 1"
        class="btn-secondary"
      >
        Previous
      </button>
      <span class="page-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <button 
        @click="nextPage" 
        :disabled="currentPage === totalPages"
        class="btn-secondary"
      >
        Next
      </button>
    </div>

    <!-- Details Modal -->
    <div v-if="selectedTrade" class="modal-overlay" @click="selectedTrade = null">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Escrow Details</h3>
          <button @click="selectedTrade = null" class="btn-close">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-row">
            <span class="label">Trade ID:</span>
            <span class="value">{{ selectedTrade.trade_id }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Buyer ID:</span>
            <span class="value">{{ selectedTrade.buyer_id }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Seller ID:</span>
            <span class="value">{{ selectedTrade.seller_id }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Amount:</span>
            <span class="value">${{ selectedTrade.amount.toFixed(2) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Token:</span>
            <span class="value">{{ selectedTrade.token }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Status:</span>
            <span :class="['status-badge', getStatusClass(selectedTrade)]">
              {{ getStatus(selectedTrade) }}
            </span>
          </div>
          <div class="detail-row">
            <span class="label">Created:</span>
            <span class="value">{{ formatDate(selectedTrade.timestamp) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Updated:</span>
            <span class="value">{{ formatDate(selectedTrade.updated_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'profile-completion', 'route-guard'],
  layout: 'default'
})
 
import { ref, computed, onMounted } from 'vue'

interface EscrowTrade {
  id: string
  trade_id: string
  buyer_id: string
  seller_id: string
  amount: number
  token: string
  is_released: boolean
  is_refunded: boolean
  timestamp: string
  updated_at: string
}

// Reactive data
const trades = ref<EscrowTrade[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const selectedTrade = ref<EscrowTrade | null>(null)

// Filters
const searchQuery = ref('')
const statusFilter = ref('')
const minAmount = ref<number | null>(null)
const maxAmount = ref<number | null>(null)
const startDate = ref('')
const endDate = ref('')

// Pagination
const currentPage = ref(1)
const pageSize = ref(20)
const totalTrades = ref(0)

// Fetch escrow trades
const fetchTrades = async () => {
  loading.value = true
  error.value = null

  try {
    const query: any = {
      limit: pageSize.value,
      offset: (currentPage.value - 1) * pageSize.value
    }

    if (statusFilter.value) {
      query.status = statusFilter.value
    }

    const { data } = await $fetch('/api/escrow', { query })

    trades.value = data.trades
    totalTrades.value = data.total
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch escrow trades'
    console.error('Fetch trades error:', err)
  } finally {
    loading.value = false
  }
}

// Apply filters
const applyFilters = () => {
  currentPage.value = 1
  fetchTrades()
}

// Reset filters
const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  minAmount.value = null
  maxAmount.value = null
  startDate.value = ''
  endDate.value = ''
  currentPage.value = 1
  fetchTrades()
}

// Release escrow
const releaseEscrow = async (tradeId: string) => {
  if (!confirm('Are you sure you want to release this escrow?')) return

  try {
    await $fetch('/api/escrow', {
      method: 'PUT',
      body: {
        tradeId,
        action: 'release'
      }
    })

    await fetchTrades()
  } catch (err: any) {
    error.value = err.message || 'Failed to release escrow'
  }
}

// Refund escrow
const refundEscrow = async (tradeId: string) => {
  if (!confirm('Are you sure you want to refund this escrow?')) return

  try {
    await $fetch('/api/escrow', {
      method: 'PUT',
      body: {
        tradeId,
        action: 'refund'
      }
    })

    await fetchTrades()
  } catch (err: any) {
    error.value = err.message || 'Failed to refund escrow'
  }
}

// View details
const viewDetails = (trade: EscrowTrade) => {
  selectedTrade.value = trade
}

// Computed properties
const filteredTrades = computed(() => {
  return trades.value.filter(trade => {
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      if (!trade.trade_id.toLowerCase().includes(query) &&
          !trade.buyer_id.toLowerCase().includes(query) &&
          !trade.seller_id.toLowerCase().includes(query)) {
        return false
      }
    }

    if (minAmount.value && trade.amount < minAmount.value) return false
    if (maxAmount.value && trade.amount > maxAmount.value) return false

    return true
  })
})

const totalPages = computed(() => Math.ceil(totalTrades.value / pageSize.value))

const totalEscrowValue = computed(() => {
  return trades.value
    .filter(t => !t.is_released && !t.is_refunded)
    .reduce((sum, t) => sum + t.amount, 0)
})

const pendingCount = computed(() => {
  return trades.value.filter(t => !t.is_released && !t.is_refunded).length
})

const releasedCount = computed(() => {
  return trades.value.filter(t => t.is_released).length
})

const refundedCount = computed(() => {
  return trades.value.filter(t => t.is_refunded).length
})

// Helper functions
const getStatus = (trade: EscrowTrade) => {
  if (trade.is_released) return 'Released'
  if (trade.is_refunded) return 'Refunded'
  return 'Pending'
}

const getStatusClass = (trade: EscrowTrade) => {
  if (trade.is_released) return 'released'
  if (trade.is_refunded) return 'refunded'
  return 'pending'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Pagination
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchTrades()
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchTrades()
  }
}

// Lifecycle
onMounted(() => {
  fetchTrades()
})
</script>

<style scoped>
.admin-escrow-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #333;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-card .label {
  font-size: 0.875rem;
  color: #666;
}

.stat-card .value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1976d2;
}

.filters-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filters-section h2 {
  margin-bottom: 1rem;
  color: #333;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.filter-input,
.filter-select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  flex: 1;
  min-width: 150px;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #1976d2;
  color: white;
}

.btn-primary:hover {
  background: #1565c0;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background: #eeeeee;
}

.table-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-section h2 {
  margin-bottom: 1rem;
  color: #333;
}

.loading,
.empty {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.escrow-table {
  width: 100%;
  border-collapse: collapse;
}

.escrow-table thead {
  background: #f5f5f5;
}

.escrow-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #ddd;
}

.escrow-table td {
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.trade-row:hover {
  background: #f9f9f9;
}

.trade-id {
  font-family: monospace;
  font-size: 0.875rem;
}

.amount {
  font-weight: 600;
  color: #1976d2;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.released {
  background: #d4edda;
  color: #155724;
}

.status-badge.refunded {
  background: #f8d7da;
  color: #721c24;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-small {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover {
  background: #218838;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:hover {
  background: #138496;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.page-info {
  color: #666;
  font-weight: 600;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 1.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
}

.detail-row .label {
  font-weight: 600;
  color: #666;
}

.detail-row .value {
  color: #333;
  word-break: break-all;
}

@media (max-width: 768px) {
  .admin-escrow-page {
    padding: 1rem;
  }

  .filters {
    flex-direction: column;
  }

  .filter-input,
  .filter-select {
    width: 100%;
  }

  .escrow-table {
    font-size: 0.875rem;
  }

  .escrow-table th,
  .escrow-table td {
    padding: 0.75rem 0.5rem;
  }

  .actions {
    flex-direction: column;
  }

  .btn-small {
    width: 100%;
  }
}
</style>


