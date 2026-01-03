<!-- FILE: /pages/escrow.vue - ESCROW MANAGEMENT PAGE -->
<!-- Protected route - requires authentication -->

<template>
  <div class="escrow-container">
    <!-- Page Header -->
    <div class="page-header">
      <h1>🔒 Escrow Management</h1>
      <p class="subtitle">Secure transactions and dispute resolution</p>
    </div>

    <!-- Escrow Stats -->
    <div class="escrow-stats">
      <div class="stat-card">
        <div class="stat-icon">💼</div>
        <div class="stat-content">
          <p class="stat-label">Active Escrows</p>
          <h3 class="stat-value">{{ activeEscrows }}</h3>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <p class="stat-label">Total Held</p>
          <h3 class="stat-value">${{ totalHeld.toFixed(2) }}</h3>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <p class="stat-label">Completed</p>
          <h3 class="stat-value">{{ completedCount }}</h3>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">⚠️</div>
        <div class="stat-content">
          <p class="stat-label">Disputes</p>
          <h3 class="stat-value">{{ disputeCount }}</h3>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="escrow-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab"
        :class="['tab-button', { active: activeTab === tab }]"
        @click="activeTab = tab"
      >
        {{ tab }}
      </button>
    </div>

    <!-- Active Escrows -->
    <div v-if="activeTab === 'Active'" class="escrow-section">
      <h3>📋 Active Escrows</h3>
      <div v-if="activeEscrowList.length > 0" class="escrow-list">
        <div v-for="escrow in activeEscrowList" :key="escrow.id" class="escrow-card">
          <div class="escrow-header">
            <div class="escrow-title">
              <h4>{{ escrow.title }}</h4>
              <p class="escrow-id">ID: {{ escrow.id }}</p>
            </div>
            <div class="escrow-amount">${{ escrow.amount.toFixed(2) }}</div>
          </div>

          <div class="escrow-details">
            <div class="detail-item">
              <span class="label">Buyer:</span>
              <span class="value">{{ escrow.buyer }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Seller:</span>
              <span class="value">{{ escrow.seller }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Status:</span>
              <span class="value status" :class="escrow.status">{{ escrow.status }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Created:</span>
              <span class="value">{{ formatDate(escrow.createdAt) }}</span>
            </div>
          </div>

          <div class="escrow-actions">
            <button v-if="escrow.status === 'pending'" class="btn btn-primary" @click="releaseEscrow(escrow.id)">
              ✅ Release Funds
            </button>
            <button v-if="escrow.status === 'pending'" class="btn btn-danger" @click="disputeEscrow(escrow.id)">
              ⚠️ Dispute
            </button>
            <button class="btn btn-secondary" @click="viewDetails(escrow.id)">
              👁️ View Details
            </button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>No active escrows</p>
      </div>
    </div>

    <!-- Completed Escrows -->
    <div v-if="activeTab === 'Completed'" class="escrow-section">
      <h3>✅ Completed Escrows</h3>
      <div v-if="completedEscrowList.length > 0" class="escrow-list">
        <div v-for="escrow in completedEscrowList" :key="escrow.id" class="escrow-card completed">
          <div class="escrow-header">
            <div class="escrow-title">
              <h4>{{ escrow.title }}</h4>
              <p class="escrow-id">ID: {{ escrow.id }}</p>
            </div>
            <div class="escrow-amount">${{ escrow.amount.toFixed(2) }}</div>
          </div>

          <div class="escrow-details">
            <div class="detail-item">
              <span class="label">Completed:</span>
              <span class="value">{{ formatDate(escrow.completedAt) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Released To:</span>
              <span class="value">{{ escrow.releasedTo }}</span>
            </div>
          </div>

          <div class="escrow-actions">
            <button class="btn btn-secondary" @click="viewDetails(escrow.id)">
              👁️ View Details
            </button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>No completed escrows</p>
      </div>
    </div>

    <!-- Disputes -->
    <div v-if="activeTab === 'Disputes'" class="escrow-section">
      <h3>⚠️ Disputes</h3>
      <div v-if="disputeList.length > 0" class="dispute-list">
        <div v-for="dispute in disputeList" :key="dispute.id" class="dispute-card">
          <div class="dispute-header">
            <div class="dispute-title">
              <h4>{{ dispute.title }}</h4>
              <p class="dispute-id">Dispute ID: {{ dispute.id }}</p>
            </div>
            <div class="dispute-status" :class="dispute.status">{{ dispute.status }}</div>
          </div>

          <div class="dispute-details">
            <div class="detail-item">
              <span class="label">Amount:</span>
              <span class="value">${{ dispute.amount.toFixed(2) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Reason:</span>
              <span class="value">{{ dispute.reason }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Filed:</span>
              <span class="value">{{ formatDate(dispute.filedAt) }}</span>
            </div>
          </div>

          <div class="dispute-description">
            <p>{{ dispute.description }}</p>
          </div>

          <div class="dispute-actions">
            <button class="btn btn-primary" @click="respondToDispute(dispute.id)">
              💬 Respond
            </button>
            <button class="btn btn-secondary" @click="viewDisputeDetails(dispute.id)">
              👁️ View Details
            </button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>No disputes</p>
      </div>
    </div>

    <!-- History -->
    <div v-if="activeTab === 'History'" class="escrow-section">
      <h3>📜 Escrow History</h3>
      <div class="history-filters">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search by ID or title..."
          class="search-input"
        />
        <select v-model="filterStatus" class="filter-select">
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="disputed">Disputed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div v-if="filteredHistory.length > 0" class="history-list">
        <div v-for="item in filteredHistory" :key="item.id" class="history-item">
          <div class="history-icon">{{ item.icon }}</div>
          <div class="history-content">
            <p class="history-title">{{ item.title }}</p>
            <p class="history-info">{{ item.info }}</p>
          </div>
          <div class="history-date">{{ formatDate(item.date) }}</div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>No history found</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({
  middleware: ['auth','profile-completion', 'language-check'],
  layout: 'default'
})

// State
const activeTab = ref('Active')
const searchQuery = ref('')
const filterStatus = ref('')

// Tabs
const tabs = ['Active', 'Completed', 'Disputes', 'History']

// Stats
const activeEscrows = ref(3)
const totalHeld = ref(1500.00)
const completedCount = ref(24)
const disputeCount = ref(1)

// Active Escrows
const activeEscrowList = ref([
  {
    id: 'ESC001',
    title: 'P2P Trade - Bitcoin',
    amount: 500,
    buyer: 'user123',
    seller: 'user456',
    status: 'pending',
    createdAt: new Date(Date.now() - 86400000)
  },
  {
    id: 'ESC002',
    title: 'Service Payment',
    amount: 750,
    buyer: 'user789',
    seller: 'user101',
    status: 'pending',
    createdAt: new Date(Date.now() - 172800000)
  },
  {
    id: 'ESC003',
    title: 'Item Purchase',
    amount: 250,
    buyer: 'user202',
    seller: 'user303',
    status: 'pending',
    createdAt: new Date(Date.now() - 259200000)
  }
])

// Completed Escrows
const completedEscrowList = ref([
  {
    id: 'ESC100',
    title: 'Previous Trade',
    amount: 1000,
    releasedTo: 'user456',
    completedAt: new Date(Date.now() - 604800000)
  },
  {
    id: 'ESC101',
    title: 'Service Completed',
    amount: 500,
    releasedTo: 'user101',
    completedAt: new Date(Date.now() - 1209600000)
  }
])

// Disputes
const disputeList = ref([
  {
    id: 'DIS001',
    title: 'Item Not Received',
    amount: 300,
    reason: 'Non-delivery',
    status: 'open',
    description: 'Buyer claims item was not received as promised',
    filedAt: new Date(Date.now() - 172800000)
  }
])

// History
const history = ref([
  { id: 1, icon: '✅', title: 'Escrow Released', info: 'ESC100 - $1000 released to user456', date: new Date(Date.now() - 604800000) },
  { id: 2, icon: '⚠️', title: 'Dispute Filed', info: 'DIS001 - Item not received', date: new Date(Date.now() - 172800000) },
  { id: 3, icon: '💼', title: 'Escrow Created', info: 'ESC001 - P2P Trade', date: new Date(Date.now() - 86400000) },
])

// Computed
const filteredHistory = computed(() => {
  return history.value.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         item.info.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = !filterStatus.value || item.info.includes(filterStatus.value)
    return matchesSearch && matchesStatus
  })
})

// Methods
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const releaseEscrow = (id) => {
  alert(`Releasing escrow ${id}...`)
  // API call would go here
}

const disputeEscrow = (id) => {
  alert(`Filing dispute for escrow ${id}...`)
  // API call would go here
}

const viewDetails = (id) => {
  alert(`Viewing details for ${id}...`)
  // Navigate to details page
}

const respondToDispute = (id) => {
  alert(`Responding to dispute ${id}...`)
  // Open response modal
}

const viewDisputeDetails = (id) => {
  alert(`Viewing dispute details for ${id}...`)
  // Navigate to dispute details
}
</script>

<style scoped>
.escrow-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2.5rem;
  margin: 0 0 0.5rem 0;
  color: #333;
}

.subtitle {
  color: #666;
  font-size: 1.1rem;
  margin: 0;
}

.escrow-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-content {
  flex: 1;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

.stat-value {
  font-size: 1.8rem;
  margin: 0.5rem 0 0 0;
  color: #333;
}

.escrow-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e5e7eb;
}

.tab-button {
  background: none;
  border: none;
  padding: 1rem;
  cursor: pointer;
  font-weight: 600;
  color: #666;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.tab-button:hover {
  color: #333;
}

.escrow-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.escrow-section h3 {
  margin-top: 0;
  color: #333;
}

.escrow-list,
.dispute-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.escrow-card,
.dispute-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.escrow-card:hover,
.dispute-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.escrow-card.completed {
  background: #f0fdf4;
  border-color: #86efac;
}

.escrow-header,
.dispute-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.escrow-title,
.dispute-title {
  flex: 1;
}

.escrow-title h4,
.dispute-title h4 {
  margin: 0;
  color: #333;
}

.escrow-id,
.dispute-id {
  margin: 0.25rem 0 0 0;
  color: #999;
  font-size: 0.9rem;
}

.escrow-amount {
  font-size: 1.3rem;
  font-weight: 600;
  color: #3b82f6;
}

.dispute-status {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
}

.dispute-status.open {
  background: #fecaca;
  color: #991b1b;
}

.dispute-status.resolved {
  background: #86efac;
  color: #166534;
}

.escrow-details,
.dispute-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-item .label {
  color: #666;
  font-size: 0.9rem;
  font-weight: 600;
}

.detail-item .value {
  color: #333;
  margin-top: 0.25rem;
}

.detail-item .value.status {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  display: inline-block;
  width: fit-content;
}

.detail-item .value.status.pending {
  background: #fef3c7;
  color: #92400e;
}

.dispute-description {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.dispute-description p {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

.escrow-actions,
.dispute-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #e5e7eb;
  color: #333;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.history-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-input,
.filter-select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.search-input {
  flex: 1;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.history-icon {
  font-size: 1.5rem;
}

.history-content {
  flex: 1;
}

.history-title {
  margin: 0;
  font-weight: 600;
  color: #333;
}

.history-info {
  margin: 0.25rem 0 0 0;
  color: #666;
  font-size: 0.9rem;
}

.history-date {
  color: #999;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .escrow-container {
    padding: 1rem;
  }

  .page-header h1 {
    font-size: 1.8rem;
  }

  .escrow-stats {
    grid-template-columns: 1fr;
  }

  .escrow-header,
  .dispute-header {
    flex-direction: column;
    gap: 1rem;
  }

  .escrow-actions,
  .dispute-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .history-filters {
    flex-direction: column;
  }
}
</style>
