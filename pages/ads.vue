<!-- FILE: /pages/ads.vue - AD CENTER MAIN PAGE -->
<!-- Protected route - requires authentication -->

<template>
  <div class="ads-container">
    <!-- Page Header -->
    <div class="page-header">
      <h1>🎯 Ad Center</h1>
      <p class="subtitle">Create, manage, and monitor your advertisements</p>
    </div>

    <!-- Quick Stats -->
    <div class="ads-stats">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <p class="stat-label">Active Campaigns</p>
          <h3 class="stat-value">{{ activeCampaigns }}</h3>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">👁️</div>
        <div class="stat-content">
          <p class="stat-label">Total Impressions</p>
          <h3 class="stat-value">{{ totalImpressions.toLocaleString() }}</h3>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🖱️</div>
        <div class="stat-content">
          <p class="stat-label">Total Clicks</p>
          <h3 class="stat-value">{{ totalClicks.toLocaleString() }}</h3>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <p class="stat-label">Total Spent</p>
          <h3 class="stat-value">${{ totalSpent.toFixed(2) }}</h3>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-content">
          <p class="stat-label">Avg CTR</p>
          <h3 class="stat-value">{{ avgCTR.toFixed(2) }}%</h3>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">💵</div>
        <div class="stat-content">
          <p class="stat-label">ROI</p>
          <h3 class="stat-value">{{ roi.toFixed(1) }}%</h3>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="ads-actions">
      <NuxtLink to="/ads/create" class="btn btn-primary">
        <span>➕</span> Create Campaign
      </NuxtLink>
      <NuxtLink to="/ads/manage" class="btn btn-secondary">
        <span>⚙️</span> Manage Campaigns
      </NuxtLink>
      <button class="btn btn-tertiary" @click="showAnalyticsModal = true">
        <span>📊</span> View Analytics
      </button>
      <button class="btn btn-quaternary" @click="showBillingModal = true">
        <span>💳</span> Billing
      </button>
    </div>

    <!-- Tabs -->
    <div class="ads-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab"
        :class="['tab-button', { active: activeTab === tab }]"
        @click="activeTab = tab"
      >
        {{ tab }}
      </button>
    </div>

    <!-- Overview Tab -->
    <div v-if="activeTab === 'Overview'" class="ads-section">
      <h3>📊 Campaign Overview</h3>

      <!-- Performance Chart -->
      <div class="chart-container">
        <div class="chart-placeholder">
          <p>📈 Performance Chart</p>
          <p class="chart-info">Impressions, Clicks, and Conversions over time</p>
        </div>
      </div>

      <!-- Recent Campaigns -->
      <h4>Recent Campaigns</h4>
      <div v-if="recentCampaigns.length > 0" class="campaigns-list">
        <div v-for="campaign in recentCampaigns" :key="campaign.id" class="campaign-item">
          <div class="campaign-info">
            <h5>{{ campaign.name }}</h5>
            <p class="campaign-meta">
              <span>{{ campaign.type }}</span>
              <span>•</span>
              <span>{{ formatDate(campaign.startDate) }}</span>
            </p>
          </div>
          <div class="campaign-stats">
            <div class="mini-stat">
              <span class="label">Impressions:</span>
              <span class="value">{{ campaign.impressions.toLocaleString() }}</span>
            </div>
            <div class="mini-stat">
              <span class="label">Clicks:</span>
              <span class="value">{{ campaign.clicks.toLocaleString() }}</span>
            </div>
            <div class="mini-stat">
              <span class="label">CTR:</span>
              <span class="value">{{ campaign.ctr.toFixed(2) }}%</span>
            </div>
          </div>
          <div class="campaign-status" :class="campaign.status">
            {{ campaign.status }}
          </div>
          <NuxtLink :to="`/ads/manage?id=${campaign.id}`" class="btn-small">
            View
          </NuxtLink>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>No campaigns yet. <NuxtLink to="/ads/create">Create one now!</NuxtLink></p>
      </div>
    </div>

    <!-- Campaigns Tab -->
    <div v-if="activeTab === 'Campaigns'" class="ads-section">
      <h3>📋 All Campaigns</h3>

      <!-- Filters -->
      <div class="campaign-filters">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search campaigns..."
          class="search-input"
        />
        <select v-model="filterStatus" class="filter-select">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="draft">Draft</option>
        </select>
        <select v-model="filterType" class="filter-select">
          <option value="">All Types</option>
          <option value="display">Display</option>
          <option value="search">Search</option>
          <option value="social">Social</option>
          <option value="video">Video</option>
        </select>
      </div>

      <!-- Campaigns Table -->
      <div v-if="filteredCampaigns.length > 0" class="campaigns-table">
        <div class="table-header">
          <div class="col col-name">Campaign Name</div>
          <div class="col col-type">Type</div>
          <div class="col col-status">Status</div>
          <div class="col col-impressions">Impressions</div>
          <div class="col col-clicks">Clicks</div>
          <div class="col col-spent">Spent</div>
          <div class="col col-actions">Actions</div>
        </div>
        <div v-for="campaign in filteredCampaigns" :key="campaign.id" class="table-row">
          <div class="col col-name">{{ campaign.name }}</div>
          <div class="col col-type">{{ campaign.type }}</div>
          <div class="col col-status">
            <span class="status-badge" :class="campaign.status">{{ campaign.status }}</span>
          </div>
          <div class="col col-impressions">{{ campaign.impressions.toLocaleString() }}</div>
          <div class="col col-clicks">{{ campaign.clicks.toLocaleString() }}</div>
          <div class="col col-spent">${{ campaign.spent.toFixed(2) }}</div>
          <div class="col col-actions">
            <button class="btn-icon" @click="editCampaign(campaign.id)" title="Edit">
              ✏️
            </button>
            <button class="btn-icon" @click="pauseCampaign(campaign.id)" title="Pause">
              ⏸️
            </button>
            <button class="btn-icon btn-danger" @click="deleteCampaign(campaign.id)" title="Delete">
              🗑️
            </button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>No campaigns found</p>
      </div>
    </div>

    <!-- Performance Tab -->
    <div v-if="activeTab === 'Performance'" class="ads-section">
      <h3>📊 Performance Analytics</h3>

      <!-- Date Range Selector -->
      <div class="date-range">
        <input type="date" v-model="startDate" class="date-input" />
        <span>to</span>
        <input type="date" v-model="endDate" class="date-input" />
        <button class="btn btn-small" @click="updateAnalytics">Update</button>
      </div>

      <!-- Performance Metrics -->
      <div class="metrics-grid">
        <div class="metric-card">
          <h4>Impressions</h4>
          <p class="metric-value">{{ totalImpressions.toLocaleString() }}</p>
          <p class="metric-change">+12% from last period</p>
        </div>
        <div class="metric-card">
          <h4>Clicks</h4>
          <p class="metric-value">{{ totalClicks.toLocaleString() }}</p>
          <p class="metric-change">+8% from last period</p>
        </div>
        <div class="metric-card">
          <h4>Conversions</h4>
          <p class="metric-value">{{ conversions.toLocaleString() }}</p>
          <p class="metric-change">+15% from last period</p>
        </div>
        <div class="metric-card">
          <h4>Cost Per Click</h4>
          <p class="metric-value">${{ cpc.toFixed(2) }}</p>
          <p class="metric-change">-5% from last period</p>
        </div>
      </div>

      <!-- Top Performing Campaigns -->
      <h4>Top Performing Campaigns</h4>
      <div class="top-campaigns">
        <div v-for="(campaign, index) in topCampaigns" :key="campaign.id" class="top-campaign-item">
          <div class="rank">{{ index + 1 }}</div>
          <div class="campaign-details">
            <h5>{{ campaign.name }}</h5>
            <p>{{ campaign.type }} • {{ formatDate(campaign.startDate) }}</p>
          </div>
          <div class="campaign-performance">
            <span class="perf-stat">{{ campaign.impressions.toLocaleString() }} impressions</span>
            <span class="perf-stat">{{ campaign.clicks.toLocaleString() }} clicks</span>
            <span class="perf-stat">{{ campaign.ctr.toFixed(2) }}% CTR</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Billing Tab -->
    <div v-if="activeTab === 'Billing'" class="ads-section">
      <h3>💳 Billing & Budget</h3>

      <!-- Budget Overview -->
      <div class="budget-cards">
        <div class="budget-card">
          <h4>Monthly Budget</h4>
          <p class="budget-amount">${{ monthlyBudget.toFixed(2) }}</p>
          <div class="budget-bar">
            <div class="budget-used" :style="{ width: budgetUsedPercent + '%' }"></div>
          </div>
          <p class="budget-info">
            ${{ monthlySpent.toFixed(2) }} spent ({{ budgetUsedPercent.toFixed(1) }}%)
          </p>
        </div>

        <div class="budget-card">
          <h4>Account Balance</h4>
          <p class="budget-amount">${{ accountBalance.toFixed(2) }}</p>
          <button class="btn btn-primary" @click="showAddFundsModal = true">
            ➕ Add Funds
          </button>
        </div>
      </div>

      <!-- Recent Transactions -->
      <h4>Recent Transactions</h4>
      <div v-if="transactions.length > 0" class="transactions-list">
        <div v-for="tx in transactions" :key="tx.id" class="transaction-item">
          <div class="tx-info">
            <p class="tx-description">{{ tx.description }}</p>
            <p class="tx-date">{{ formatDate(tx.date) }}</p>
          </div>
          <p class="tx-amount" :class="tx.type">
            {{ tx.type === 'credit' ? '+' : '-' }}${{ tx.amount.toFixed(2) }}
          </p>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>No transactions</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({
  middleware: ['auth', 'language-check'],
  layout: 'default'
})

// State
const activeTab = ref('Overview')
const searchQuery = ref('')
const filterStatus = ref('')
const filterType = ref('')
const showAnalyticsModal = ref(false)
const showBillingModal = ref(false)
const showAddFundsModal = ref(false)
const startDate = ref(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
const endDate = ref(new Date().toISOString().split('T')[0])

// Tabs
const tabs = ['Overview', 'Campaigns', 'Performance', 'Billing']

// Stats
const activeCampaigns = ref(5)
const totalImpressions = ref(125000)
const totalClicks = ref(3500)
const totalSpent = ref(850.50)
const conversions = ref(280)
const cpc = ref(0.24)
const avgCTR = computed(() => (totalClicks.value / totalImpressions.value) * 100)
const roi = computed(() => ((conversions.value * 50 - totalSpent.value) / totalSpent.value) * 100)

// Billing
const monthlyBudget = ref(2000)
const monthlySpent = ref(850.50)
const accountBalance = ref(1149.50)
const budgetUsedPercent = computed(() => (monthlySpent.value / monthlyBudget.value) * 100)

// Campaigns
const allCampaigns = ref([
  {
    id: 1,
    name: 'Summer Sale Campaign',
    type: 'Display',
    status: 'active',
    impressions: 45000,
    clicks: 1200,
    spent: 350,
    ctr: 2.67,
    startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    conversions: 120
  },
  {
    id: 2,
    name: 'Brand Awareness',
    type: 'Social',
    status: 'active',
    impressions: 50000,
    clicks: 1500,
    spent: 300,
    ctr: 3.0,
    startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    conversions: 95
  },
  {
    id: 3,
    name: 'Search Campaign',
    type: 'Search',
    status: 'paused',
    impressions: 20000,
    clicks: 600,
    spent: 150,
    ctr: 3.0,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    conversions: 50
  },
  {
    id: 4,
    name: 'Video Ads',
    type: 'Video',
    status: 'active',
    impressions: 10000,
    clicks: 200,
    spent: 50.50,
    ctr: 2.0,
    startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    conversions: 15
  },
  {
    id: 5,
    name: 'Retargeting',
    type: 'Display',
    status: 'completed',
    impressions: 5000,
    clicks: 150,
    spent: 25,
    ctr: 3.0,
    startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    conversions: 20
  }
])

// Recent Campaigns
const recentCampaigns = computed(() => allCampaigns.value.slice(0, 3))

// Filtered Campaigns
const filteredCampaigns = computed(() => {
  return allCampaigns.value.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = !filterStatus.value || campaign.status === filterStatus.value
    const matchesType = !filterType.value || campaign.type.toLowerCase() === filterType.value.toLowerCase()
    return matchesSearch && matchesStatus && matchesType
  })
})

// Top Campaigns
const topCampaigns = computed(() => {
  return [...allCampaigns.value]
    .sort((a, b) => b.ctr - a.ctr)
    .slice(0, 5)
})

// Transactions
const transactions = ref([
  { id: 1, description: 'Campaign Charge - Summer Sale', type: 'debit', amount: 350, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
  { id: 2, description: 'Account Credit', type: 'credit', amount: 500, date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
  { id: 3, description: 'Campaign Charge - Brand Awareness', type: 'debit', amount: 300, date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
  { id: 4, description: 'Refund - Cancelled Campaign', type: 'credit', amount: 100, date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
])

// Methods
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const updateAnalytics = () => {
  console.log('Updating analytics for:', startDate.value, 'to', endDate.value)
}

const editCampaign = (id) => {
  navigateTo(`/ads/manage?id=${id}`)
}

const pauseCampaign = (id) => {
  const campaign = allCampaigns.value.find(c => c.id === id)
  if (campaign) {
    campaign.status = campaign.status === 'active' ? 'paused' : 'active'
  }
}

const deleteCampaign = (id) => {
  if (confirm('Are you sure you want to delete this campaign?')) {
    allCampaigns.value = allCampaigns.value.filter(c => c.id !== id)
  }
}
</script>

<style scoped>
.ads-container {
  max-width: 1400px;
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

.ads-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

.ads-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #10b981;
  color: white;
}

.btn-secondary:hover {
  background: #059669;
  transform: translateY(-2px);
}

.btn-tertiary {
  background: #8b5cf6;
  color: white;
}

.btn-tertiary:hover {
  background: #7c3aed;
  transform: translateY(-2px);
}

.btn-quaternary {
  background: #f59e0b;
  color: white;
}

.btn-quaternary:hover {
  background: #d97706;
  transform: translateY(-2px);
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.ads-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e5e7eb;
  overflow-x: auto;
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
  white-space: nowrap;
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.tab-button:hover {
  color: #333;
}

.ads-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.ads-section h3 {
  margin-top: 0;
  color: #333;
}

.ads-section h4 {
  color: #333;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.chart-container {
  background: #f9fafb;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  text-align: center;
}

.chart-placeholder {
  color: #999;
}

.chart-info {
  font-size: 0.9rem;
  color: #999;
}

.campaigns-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.campaign-item {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.campaign-info {
  flex: 1;
  min-width: 200px;
}

.campaign-info h5 {
  margin: 0;
  color: #333;
}

.campaign-meta {
  margin: 0.5rem 0 0 0;
  color: #666;
  font-size: 0.9rem;
}

.campaign-meta span {
  margin: 0 0.5rem;
}

.campaign-stats {
  display: flex;
  gap: 2rem;
}

.mini-stat {
  display: flex;
  flex-direction: column;
}

.mini-stat .label {
  color: #666;
  font-size: 0.85rem;
}

.mini-stat .value {
  color: #333;
  font-weight: 600;
}

.campaign-status {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
}

.campaign-status.active {
  background: #d1fae5;
  color: #065f46;
}

.campaign-status.paused {
  background: #fef3c7;
  color: #92400e;
}

.campaign-status.completed {
  background: #e0e7ff;
  color: #3730a3;
}

.btn-small {
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-small:hover {
  background: #2563eb;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.empty-state a {
  color: #3b82f6;
  text-decoration: none;
}

.empty-state a:hover {
  text-decoration: underline;
}

.campaign-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
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
  min-width: 200px;
}

.campaigns-table {
  overflow-x: auto;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  align-items: center;
}

.table-header {
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
  font-weight: 600;
  color: #666;
}

.table-row {
  border-bottom: 1px solid #e5e7eb;
  transition: background 0.3s ease;
}

.table-row:hover {
  background: #f9fafb;
}

.col {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  display: inline-block;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.paused {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.completed {
  background: #e0e7ff;
  color: #3730a3;
}

.status-badge.draft {
  background: #e5e7eb;
  color: #374151;
}

.col-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.3s ease;
  padding: 0.5rem;
}

.btn-icon:hover {
  transform: scale(1.2);
}

.btn-icon.btn-danger:hover {
  color: #ef4444;
}

.date-range {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.date-input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.metric-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
}

.metric-card h4 {
  margin: 0 0 1rem 0;
  color: #333;
}

.metric-value {
  font-size: 2rem;
  font-weight: 600;
  color: #3b82f6;
  margin: 0;
}

.metric-change {
  margin: 0.5rem 0 0 0;
  color: #10b981;
  font-size: 0.9rem;
}

.top-campaigns {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.top-campaign-item {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.rank {
  width: 40px;
  height: 40px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.2rem;
}

.campaign-details {
  flex: 1;
}

.campaign-details h5 {
  margin: 0;
  color: #333;
}

.campaign-details p {
  margin: 0.25rem 0 0 0;
  color: #666;
  font-size: 0.9rem;
}

.campaign-performance {
  display: flex;
  gap: 1.5rem;
}

.perf-stat {
  color: #666;
  font-size: 0.9rem;
}

.budget-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.budget-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
}

.budget-card h4 {
  margin: 0 0 1rem 0;
  color: #333;
}

.budget-amount {
  font-size: 2rem;
  font-weight: 600;
  color: #3b82f6;
  margin: 0 0 1rem 0;
}

.budget-bar {
  background: #e5e7eb;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.budget-used {
  background: #3b82f6;
  height: 100%;
  transition: width 0.3s ease;
}

.budget-info {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.transaction-item {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tx-info {
  flex: 1;
}

.tx-description {
  margin: 0;
  color: #333;
  font-weight: 600;
}

.tx-date {
  margin: 0.25rem 0 0 0;
  color: #999;
  font-size: 0.9rem;
}

.tx-amount {
  font-weight: 600;
  font-size: 1.1rem;
}

.tx-amount.credit {
  color: #10b981;
}

.tx-amount.debit {
  color: #ef4444;
}

@media (max-width: 768px) {
  .ads-container {
    padding: 1rem;
  }

  .page-header h1 {
    font-size: 1.8rem;
  }

  .ads-stats {
    grid-template-columns: 1fr;
  }

  .ads-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .campaign-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .campaign-stats {
    flex-direction: column;
    gap: 0.5rem;
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr;
  }

  .col {
    white-space: normal;
  }

  .top-campaign-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .campaign-performance {
    flex-direction: column;
    gap: 0.5rem;
  }

  .budget-cards {
    grid-template-columns: 1fr;
  }
}
</style>
