<template>
  <div class="manage-ads-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1>⚙️ Manage Advertisements</h1>
        <p>Control and monitor all your advertising campaigns</p>
      </div>
      <div class="header-actions">
        <NuxtLink to="/ads/create" class="btn-primary">
          <Icon name="plus" size="18" />
          Create New Ad
        </NuxtLink>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="filters-section">
      <div class="search-bar">
        <Icon name="search" size="20" />
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search campaigns..."
          class="search-input"
        />
      </div>
      
      <div class="filters">
        <select v-model="statusFilter" class="filter-select">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="ended">Ended</option>
          <option value="pending">Pending Approval</option>
        </select>
        
        <select v-model="sortBy" class="filter-select">
          <option value="created_desc">Newest First</option>
          <option value="created_asc">Oldest First</option>
          <option value="budget_desc">Highest Budget</option>
          <option value="budget_asc">Lowest Budget</option>
          <option value="performance_desc">Best Performance</option>
        </select>
      </div>
    </div>

    <!-- Campaigns List -->
    <div class="campaigns-container">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading your campaigns...</p>
      </div>
      
      <div v-else-if="filteredCampaigns.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>No campaigns found</h3>
        <p>{{ searchQuery ? 'Try adjusting your search or filters' : 'Create your first advertising campaign to get started' }}</p>
        <NuxtLink v-if="!searchQuery" to="/ads/create" class="btn-primary">
          Create Your First Ad
        </NuxtLink>
      </div>
      
      <div v-else class="campaigns-grid">
        <div v-for="campaign in filteredCampaigns" :key="campaign.id" class="campaign-card">
          <!-- Campaign Header -->
          <div class="campaign-header">
            <div class="campaign-info">
              <div class="campaign-image">
                <img :src="campaign.image || '/default-ad.png'" :alt="campaign.title" />
              </div>
              <div class="campaign-details">
                <h3>{{ campaign.title }}</h3>
                <div class="campaign-meta">
                  <span class="campaign-status" :class="campaign.status">
                    {{ getStatusLabel(campaign.status) }}
                  </span>
                  <span class="campaign-date">
                    Created {{ formatDate(campaign.created_at) }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="campaign-actions">
              <button 
                @click="toggleCampaign(campaign)" 
                class="action-btn"
                :class="campaign.status === 'active' ? 'pause' : 'play'"
                :disabled="campaign.status === 'ended'"
              >
                <Icon :name="campaign.status === 'active' ? 'pause' : 'play'" size="16" />
              </button>
              
              <NuxtLink :to="`/ads/edit/${campaign.id}`" class="action-btn edit">
                <Icon name="edit" size="16" />
              </NuxtLink>
              
              <button @click="showDeleteModal(campaign)" class="action-btn delete">
                <Icon name="trash" size="16" />
              </button>
              
              <button @click="toggleCampaignDetails(campaign.id)" class="action-btn details">
                <Icon name="chevron-down" size="16" :class="{ rotated: expandedCampaigns.includes(campaign.id) }" />
              </button>
            </div>
          </div>

          <!-- Campaign Metrics -->
          <div class="campaign-metrics">
            <div class="metric">
              <span class="metric-label">Budget</span>
              <span class="metric-value">${{ campaign.budget }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Spent</span>
              <span class="metric-value">${{ campaign.spent.toFixed(2) }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Impressions</span>
              <span class="metric-value">{{ formatNumber(campaign.impressions) }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Clicks</span>
              <span class="metric-value">{{ formatNumber(campaign.clicks) }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">CTR</span>
              <span class="metric-value">{{ campaign.ctr }}%</span>
            </div>
          </div>

          <!-- Expanded Details -->
          <div v-if="expandedCampaigns.includes(campaign.id)" class="campaign-expanded">
            <div class="expanded-content">
              <!-- Performance Chart -->
              <div class="performance-section">
                <h4>Performance Overview</h4>
                <div class="performance-chart">
                  <canvas :ref="`chart-${campaign.id}`" width="400" height="200"></canvas>
                </div>
              </div>

              <!-- Targeting Info -->
              <div class="targeting-section">
                <h4>Targeting</h4>
                <div class="targeting-info">
                  <div class="targeting-item">
                    <span class="label">Locations:</span>
                    <span>{{ campaign.target_locations?.join(', ') || 'All locations' }}</span>
                  </div>
                  <div class="targeting-item">
                    <span class="label">Age Range:</span>
                    <span>{{ campaign.age_min || 13 }} - {{ campaign.age_max || 65 }} years</span>
                  </div>
                  <div class="targeting-item">
                    <span class="label">Devices:</span>
                    <span>{{ campaign.device_targets?.join(', ') || 'All devices' }}</span>
                  </div>
                  <div class="targeting-item">
                    <span class="label">Interests:</span>
                    <span>{{ campaign.interests?.join(', ') || 'All interests' }}</span>
                  </div>
                </div>
              </div>

              <!-- Schedule Info -->
              <div class="schedule-section">
                <h4>Schedule</h4>
                <div class="schedule-info">
                  <div class="schedule-item">
                    <span class="label">Duration:</span>
                    <span>
                      {{ formatDate(campaign.start_date) }} 
                      {{ campaign.end_date ? `- ${formatDate(campaign.end_date)}` : '(ongoing)' }}
                    </span>
                  </div>
                  <div class="schedule-item">
                    <span class="label">Schedule:</span>
                    <span>{{ campaign.schedule === 'always' ? 'Always active' : 'Custom schedule' }}</span>
                  </div>
                </div>
              </div>

              <!-- Quick Actions -->
              <div class="quick-actions">
                <button @click="duplicateCampaign(campaign)" class="btn-secondary">
                  <Icon name="copy" size="16" />
                  Duplicate
                </button>
                <NuxtLink :to="`/ads/analytics/${campaign.id}`" class="btn-secondary">
                  <Icon name="bar-chart" size="16" />
                  View Analytics
                </NuxtLink>
                <button @click="downloadReport(campaign)" class="btn-secondary">
                  <Icon name="download" size="16" />
                  Export Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bulk Actions -->
    <div v-if="selectedCampaigns.length > 0" class="bulk-actions">
      <div class="bulk-info">
        <span>{{ selectedCampaigns.length }} campaign(s) selected</span>
      </div>
      <div class="bulk-buttons">
        <button @click="bulkPause" class="btn-secondary">
          <Icon name="pause" size="16" />
          Pause Selected
        </button>
        <button @click="bulkResume" class="btn-secondary">
          <Icon name="play" size="16" />
          Resume Selected
        </button>
        <button @click="bulkDelete" class="btn-danger">
          <Icon name="trash" size="16" />
          Delete Selected
        </button>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click="showDeleteConfirm = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Delete Campaign</h3>
          <button @click="showDeleteConfirm = false" class="close-btn">
            <Icon name="x" size="20" />
          </button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete "{{ campaignToDelete?.title }}"?</p>
          <p class="warning">This action cannot be undone. All campaign data and analytics will be permanently deleted.</p>
        </div>
        <div class="modal-footer">
          <button @click="showDeleteConfirm = false" class="btn-secondary">Cancel</button>
          <button @click="confirmDelete" class="btn-danger">Delete Campaign</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'

// Page meta
useHead({
  title: 'Manage Ads - SocialVerse',
  meta: [
    { name: 'description', content: 'Manage and monitor your advertising campaigns on SocialVerse' }
  ]
})

// Reactive data
const loading = ref(true)
const campaigns = ref([])
const searchQuery = ref('')
const statusFilter = ref('')
const sortBy = ref('created_desc')
const expandedCampaigns = ref([])
const selectedCampaigns = ref([])
const showDeleteConfirm = ref(false)
const campaignToDelete = ref(null)

// Sample data - replace with API calls
const sampleCampaigns = [
  {
    id: 1,
    title: 'Summer Sale Campaign',
    status: 'active',
    image: '/ads/summer-sale.jpg',
    budget: 500,
    spent: 285.50,
    impressions: 45230,
    clicks: 1205,
    ctr: 2.7,
    created_at: '2024-01-15',
    start_date: '2024-01-20',
    end_date: '2024-02-20',
    target_locations: ['US', 'CA'],
    age_min: 25,
    age_max: 45,
    device_targets: ['mobile', 'desktop'],
    interests: ['fashion', 'shopping'],
    schedule: 'always'
  },
  {
    id: 2,
    title: 'Product Launch',
    status: 'paused',
    image: '/ads/product-launch.jpg',
    budget: 300,
    spent: 145.20,
    impressions: 28900,
    clicks: 567,
    ctr: 2.0,
    created_at: '2024-01-10',
    start_date: '2024-01-15',
    end_date: null,
    target_locations: ['US'],
    age_min: 18,
    age_max: 35,
    device_targets: ['mobile'],
    interests: ['tech', 'gadgets'],
    schedule: 'custom'
  },
  {
    id: 3,
    title: 'Brand Awareness',
    status: 'ended',
    image: '/ads/brand-awareness.jpg',
    budget: 1000,
    spent: 1000,
    impressions: 125000,
    clicks: 2500,
    ctr: 2.0,
    created_at: '2023-12-01',
    start_date: '2023-12-05',
    end_date: '2024-01-05',
    target_locations: ['US', 'CA', 'UK'],
    age_min: 20,
    age_max: 60,
    device_targets: ['mobile', 'desktop', 'tablet'],
    interests: ['lifestyle', 'business'],
    schedule: 'always'
  }
]

// Computed properties
const filteredCampaigns = computed(() => {
  let filtered = campaigns.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(campaign => 
      campaign.title.toLowerCase().includes(query)
    )
  }

  // Filter by status
  if (statusFilter.value) {
    filtered = filtered.filter(campaign => campaign.status === statusFilter.value)
  }

  // Sort campaigns
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'created_desc':
        return new Date(b.created_at) - new Date(a.created_at)
      case 'created_asc':
        return new Date(a.created_at) - new Date(b.created_at)
      case 'budget_desc':
        return b.budget - a.budget
      case 'budget_asc':
        return a.budget - b.budget
      case 'performance_desc':
        return b.ctr - a.ctr
      default:
        return 0
    }
  })

  return filtered
})

// Methods
const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

const getStatusLabel = (status) => {
  const labels = {
    active: 'Active',
    paused: 'Paused',
    ended: 'Ended',
    pending: 'Pending Approval'
  }
  return labels[status] || status
}

const toggleCampaign = async (campaign) => {
  try {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active'
    
    // API call to toggle campaign status
    await $fetch(`/api/ads/toggle/${campaign.id}`, {
      method: 'POST',
      body: { status: newStatus }
    })
    
    campaign.status = newStatus
  } catch (error) {
    console.error('Error toggling campaign:', error)
  }
}

const toggleCampaignDetails = (campaignId) => {
  const index = expandedCampaigns.value.indexOf(campaignId)
  if (index > -1) {
    expandedCampaigns.value.splice(index, 1)
  } else {
    expandedCampaigns.value.push(campaignId)
    // Load chart after expansion
    nextTick(() => {
      loadPerformanceChart(campaignId)
    })
  }
}

const loadPerformanceChart = (campaignId) => {
  // Simple chart implementation - replace with actual charting library
  const canvas = document.querySelector(`canvas[ref="chart-${campaignId}"]`)
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height)
  
  // Draw simple line chart
  ctx.strokeStyle = '#667eea'
  ctx.lineWidth = 2
  ctx.beginPath()
  
  // Sample data points
  const points = [
    { x: 50, y: height - 50 },
    { x: 150, y: height - 80 },
    { x: 250, y: height - 120 },
    { x: 350, y: height - 100 }
  ]
  
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y)
    } else {
      ctx.lineTo(point.x, point.y)
    }
  })
  
  ctx.stroke()
  
  // Draw points
  ctx.fillStyle = '#667eea'
  points.forEach(point => {
    ctx.beginPath()
    ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI)
    ctx.fill()
  })
}

const showDeleteModal = (campaign) => {
  campaignToDelete.value = campaign
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  try {
    await $fetch(`/api/ads/delete/${campaignToDelete.value.id}`, {
      method: 'DELETE'
    })
    
    // Remove from local array
    const index = campaigns.value.findIndex(c => c.id === campaignToDelete.value.id)
    if (index > -1) {
      campaigns.value.splice(index, 1)
    }
    
    showDeleteConfirm.value = false
    campaignToDelete.value = null
  } catch (error) {
    console.error('Error deleting campaign:', error)
  }
}

const duplicateCampaign = async (campaign) => {
  try {
    const duplicatedCampaign = {
      ...campaign,
      title: `${campaign.title} (Copy)`,
      status: 'paused'
    }
    delete duplicatedCampaign.id
    
    const response = await $fetch('/api/ads/submit', {
      method: 'POST',
      body: duplicatedCampaign
    })
    
    // Refresh campaigns list
    await loadCampaigns()
  } catch (error) {
    console.error('Error duplicating campaign:', error)
  }
}

const downloadReport = async (campaign) => {
  try {
    const response = await $fetch(`/api/ads/export/${campaign.id}`, {
      method: 'GET'
    })
    
    // Create and download file
    const blob = new Blob([response], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${campaign.title}-report.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading report:', error)
  }
}

const bulkPause = async () => {
  try {
    await $fetch('/api/ads/bulk-action', {
      method: 'POST',
      body: {
        action: 'pause',
        campaignIds: selectedCampaigns.value
      }
    })
    
    // Update local state
    campaigns.value.forEach(campaign => {
      if (selectedCampaigns.value.includes(campaign.id)) {
        campaign.status = 'paused'
      }
    })
    
    selectedCampaigns.value = []
  } catch (error) {
    console.error('Error pausing campaigns:', error)
  }
}

const bulkResume = async () => {
  try {
    await $fetch('/api/ads/bulk-action', {
      method: 'POST',
      body: {
        action: 'resume',
        campaignIds: selectedCampaigns.value
      }
    })
    
    // Update local state
    campaigns.value.forEach(campaign => {
      if (selectedCampaigns.value.includes(campaign.id)) {
        campaign.status = 'active'
      }
    })
    
    selectedCampaigns.value = []
  } catch (error) {
    console.error('Error resuming campaigns:', error)
  }
}

const bulkDelete = async () => {
  if (!confirm(`Are you sure you want to delete ${selectedCampaigns.value.length} campaign(s)?`)) {
    return
  }
  
  try {
    await $fetch('/api/ads/bulk-action', {
      method: 'POST',
      body: {
        action: 'delete',
        campaignIds: selectedCampaigns.value
      }
    })
    
    // Remove from local state
    campaigns.value = campaigns.value.filter(campaign => 
      !selectedCampaigns.value.includes(campaign.id)
    )
    
    selectedCampaigns.value = []
  } catch (error) {
    console.error('Error deleting campaigns:', error)
  }
}

const loadCampaigns = async () => {
  try {
    loading.value = true
    // const response = await $fetch('/api/ads/campaigns')
    // campaigns.value = response
    
    // For demo, use sample data
    campaigns.value = sampleCampaigns
  } catch (error) {
    console.error('Error loading campaigns:', error)
  } finally {
    loading.value = false
  }
}

// Load data on mount
onMounted(() => {
  loadCampaigns()
})
</script>

<style scoped>
.manage-ads-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.header-content h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #2d3436;
  margin: 0 0 0.5rem 0;
}

.header-content p {
  color: #636e72;
  margin: 0;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.filters-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.search-bar {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-bar svg {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #636e72;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.filters {
  display: flex;
  gap: 1rem;
}

.filter-select {
  padding: 0.75rem 1rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  background: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
}

.campaigns-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e1e5e9;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #2d3436;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #636e72;
  margin-bottom: 2rem;
}

.campaigns-grid {
  display: flex;
  flex-direction: column;
}

.campaign-card {
  border-bottom: 1px solid #e1e5e9;
  transition: background-color 0.3s ease;
}

.campaign-card:hover {
  background: #f8f9fa;
}

.campaign-card:last-child {
  border-bottom: none;
}

.campaign-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
}

.campaign-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.campaign-image {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.campaign-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.campaign-details h3 {
  margin: 0 0 0.5rem 0;
  color: #2d3436;
  font-size: 1.1rem;
}

.campaign-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.campaign-status {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.campaign-status.active {
  background: #d4edda;
  color: #155724;
}

.campaign-status.paused {
  background: #fff3cd;
  color: #856404;
}

.campaign-status.ended {
  background: #f8d7da;
  color: #721c24;
}*_
.campaign-status.pending {
  background: #cce5ff;
  color: #0066cc;
}

.campaign-date {
  color: #636e72;
  font-size: 0.85rem;
}

.campaign-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.action-btn.play {
  background: #d4edda;
  color: #155724;
}

.action-btn.pause {
  background: #fff3cd;
  color: #856404;
}

.action-btn.edit {
  background: #cce5ff;
  color: #0066cc;
}

.action-btn.delete {
  background: #f8d7da;
  color: #721c24;
}

.action-btn.details {
  background: #e9ecef;
  color: #495057;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.rotated {
  transform: rotate(180deg);
}

.campaign-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  padding: 0 1.5rem 1.5rem;
  border-bottom: 1px solid #e1e5e9;
}

.metric {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.metric-label {
  display: block;
  font-size: 0.8rem;
  color: #636e72;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.metric-value {
  display: block;
  font-size: 1.2rem;
  font-weight: 700;
  color: #2d3436;
}

.campaign-expanded {
  border-top: 1px solid #e1e5e9;
  background: #f8f9fa;
}

.expanded-content {
  padding: 2rem 1.5rem;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.performance-section {
  grid-column: 1 / -1;
}

.performance-section h4,
.targeting-section h4,
.schedule-section h4 {
  color: #2d3436;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.performance-chart {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.targeting-info,
.schedule-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.targeting-item,
.schedule-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
}

.targeting-item .label,
.schedule-item .label {
  font-weight: 600;
  color: #636e72;
}

.quick-actions {
  grid-column: 1 / -1;
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e1e5e9;
}

.btn-secondary {
  background: transparent;
  color: #667eea;
  border: 2px solid #667eea;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #667eea;
  color: white;
}

.bulk-actions {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 1rem 2rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 2rem;
  z-index: 100;
}

.bulk-info {
  font-weight: 600;
  color: #2d3436;
}

.bulk-buttons {
  display: flex;
  gap: 1rem;
}

.btn-danger {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.btn-danger:hover {
  background: #c0392b;
  transform: translateY(-1px);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e1e5e9;
}

.modal-header h3 {
  margin: 0;
  color: #2d3436;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #f8f9fa;
}

.modal-body {
  padding: 1.5rem;
}

.modal-body p {
  margin-bottom: 1rem;
  color: #2d3436;
}

.warning {
  color: #e74c3c;
  font-weight: 600;
  background: #fdf2f2;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #e74c3c;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e1e5e9;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .expanded-content {
    grid-template-columns: 1fr;
  }
  
  .campaign-metrics {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .manage-ads-page {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .filters-section {
    flex-direction: column;
    gap: 1rem;
  }
  
  .filters {
    justify-content: center;
  }
  
  .campaign-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .campaign-info {
    width: 100%;
  }
  
  .campaign-actions {
    align-self: flex-end;
  }
  
  .campaign-metrics {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .expanded-content {
    padding: 1rem;
  }
  
  .quick-actions {
    flex-direction: column;
  }
  
  .bulk-actions {
    flex-direction: column;
    gap: 1rem;
    left: 1rem;
    right: 1rem;
    transform: none;
  }
  
  .bulk-buttons {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .campaign-metrics {
    grid-template-columns: 1fr;
  }
  
  .campaign-actions {
    flex-wrap: wrap;
  }
  
  .action-btn {
    width: 32px;
    height: 32px;
  }
}
</style>
