<template>
  <div class="admin-ad-analytics">
    <!-- Header Section -->
    <div class="admin-header">
      <div class="header-content">
        <h1 class="page-title">📊 Advertisement Analytics</h1>
        <p class="page-description">Monitor and analyze advertisement performance across the platform</p>
      </div>
      <div class="header-actions">
        <button @click="refreshData" class="btn-secondary" :disabled="loading">
          <Icon name="refresh" />
          Refresh Data
        </button>
        <button @click="exportData" class="btn-primary">
          <Icon name="download" />
          Export Report
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading analytics data...</p>
    </div>

    <!-- Analytics Dashboard -->
    <div v-else class="analytics-dashboard">
      <!-- Key Metrics Cards -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">📈</div>
          <div class="metric-content">
            <h3>Total Impressions</h3>
            <p class="metric-value">{{ formatNumber(analytics.totalImpressions) }}</p>
            <span class="metric-change positive">+12.5% from last month</span>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">💰</div>
          <div class="metric-content">
            <h3>Revenue</h3>
            <p class="metric-value">${{ formatNumber(analytics.totalRevenue) }}</p>
            <span class="metric-change positive">+8.3% from last month</span>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">🎯</div>
          <div class="metric-content">
            <h3>Click-through Rate</h3>
            <p class="metric-value">{{ analytics.ctr }}%</p>
            <span class="metric-change negative">-2.1% from last month</span>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">📱</div>
          <div class="metric-content">
            <h3>Active Campaigns</h3>
            <p class="metric-value">{{ analytics.activeCampaigns }}</p>
            <span class="metric-change neutral">No change</span>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <div class="chart-container">
          <h3>Revenue Trends (Last 30 Days)</h3>
          <div class="chart-placeholder">
            <!-- Chart component would go here -->
            <p>Chart visualization will be implemented here</p>
          </div>
        </div>
        
        <div class="chart-container">
          <h3>Top Performing Ad Categories</h3>
          <div class="chart-placeholder">
            <!-- Chart component would go here -->
            <p>Category performance chart will be implemented here</p>
          </div>
        </div>
      </div>

      <!-- Recent Activity Table -->
      <div class="activity-section">
        <h3>Recent Ad Activity</h3>
        <div class="table-container">
          <table class="activity-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Advertiser</th>
                <th>Impressions</th>
                <th>Clicks</th>
                <th>Revenue</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="activity in recentActivity" :key="activity.id">
                <td>{{ activity.campaign }}</td>
                <td>{{ activity.advertiser }}</td>
                <td>{{ formatNumber(activity.impressions) }}</td>
                <td>{{ formatNumber(activity.clicks) }}</td>
                <td>${{ activity.revenue }}</td>
                <td>
                  <span :class="['status-badge', activity.status.toLowerCase()]">
                    {{ activity.status }}
                  </span>
                </td>
                <td>
                  <button @click="viewDetails(activity.id)" class="btn-sm">View</button>
                  <button @click="pauseCampaign(activity.id)" class="btn-sm btn-warning">Pause</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['route-guard', 'language-check', 'security-middleware'],
  layout: 'admin'
})
 
import { ref, onMounted } from 'vue'

// Reactive data
const loading = ref(true)
const analytics = ref({
  totalImpressions: 0,
  totalRevenue: 0,
  ctr: 0,
  activeCampaigns: 0
})

const recentActivity = ref([])

// Methods
const refreshData = async () => {
  loading.value = true
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock data - replace with actual API calls
    analytics.value = {
      totalImpressions: 1250000,
      totalRevenue: 45600,
      ctr: 3.2,
      activeCampaigns: 24
    }
    
    recentActivity.value = [
      {
        id: 1,
        campaign: 'Summer Sale 2024',
        advertiser: 'Fashion Brand Co.',
        impressions: 1500,
        clicks: 4200,
        revenue: 1250,
        status: 'Active'
      },
      {
        id: 2,
        campaign: 'Tech Product Launch',
        advertiser: 'TechCorp Inc.',
        impressions: 89000,
        clicks: 2800,
        revenue: 890,
        status: 'Paused'
      }
    ]
  } catch (error) {
    console.error('Error fetching analytics data:', error)
  } finally {
    loading.value = false
  }
}

const exportData = () => {
  // Implement export functionality
  console.log('Exporting analytics data...')
}

const viewDetails = (id) => {
  navigateTo(`/admin/campaigns/${id}`)
}

const pauseCampaign = async (id) => {
  // Implement pause functionality
  console.log('Pausing campaign:', id)
}

onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.admin-ad-analytics {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.page-description {
  color: #6b7280;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.metric-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.metric-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 0.5rem;
}

.metric-content h3 {
  margin: 0 0 0.5rem 0;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
}

.metric-value {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.metric-change {
  font-size: 0.75rem;
  font-weight: 500;
}

.metric-change.positive { color: #10b981; }
.metric-change.negative { color: #ef4444; }
.metric-change.neutral { color: #6b7280; }

.charts-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.chart-container {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-placeholder {
  height: 300px;
  background: #f9fafb;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.activity-section {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table-container {
  overflow-x: auto;
  margin-top: 1rem;
}

.activity-table {
  width: 100%;
  border-collapse: collapse;
}

.activity-table th,
.activity-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.activity-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.paused {
  background: #fef3c7;
  color: #92400e;
}

.btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  background: white;
  cursor: pointer;
  margin-right: 0.5rem;
}

.btn-warning {
  background: #fbbf24;
  color: white;
  border-color: #f59e0b;
}

@media (max-width: 768px) {
  .admin-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .charts-section {
    grid-template-columns: 1fr;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>

