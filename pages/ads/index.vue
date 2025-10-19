<template>
  <div class="ad-center">
    <!-- Header Section -->
    <div class="ad-center-header">
      <div class="header-content">
        <h1 class="page-title">🎯 Ad Center</h1>
        <p class="page-description">Create, manage, and monitor your advertising campaigns</p>
      </div>
      <div class="header-actions">
        <NuxtLink to="/ads/create" class="btn-primary">
          <Icon name="plus" size="18" />
          Create New Ad
        </NuxtLink>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <h3>Active Campaigns</h3>
          <p class="stat-value">{{ stats.activeCampaigns }}</p>
          <span class="stat-change positive">+2 this week</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <h3>Ad Balance</h3>
          <p class="stat-value">${{ stats.balance.toFixed(2) }}</p>
          <button @click="showTopUpModal = true" class="top-up-btn">Top Up</button>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">👁️</div>
        <div class="stat-content">
          <h3>Total Impressions</h3>
          <p class="stat-value">{{ formatNumber(stats.totalImpressions) }}</p>
          <span class="stat-change positive">+15.3% this month</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-content">
          <h3>Click Rate</h3>
          <p class="stat-value">{{ stats.ctr }}%</p>
          <span class="stat-change negative">-0.2% this month</span>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <h2>Quick Actions</h2>
      <div class="actions-grid">
        <NuxtLink to="/ads/create" class="action-card">
          <div class="action-icon">✨</div>
          <h3>Create Campaign</h3>
          <p>Launch a new advertising campaign</p>
        </NuxtLink>
        
        <NuxtLink to="/ads/manage" class="action-card">
          <div class="action-icon">⚙️</div>
          <h3>Manage Ads</h3>
          <p>Edit and control your active campaigns</p>
        </NuxtLink>
        
        <NuxtLink to="/ads/analytics" class="action-card">
          <div class="action-icon">📈</div>
          <h3>View Analytics</h3>
          <p>Track performance and insights</p>
        </NuxtLink>
        
        <NuxtLink to="/ads/budget" class="action-card">
          <div class="action-icon">💳</div>
          <h3>Budget Management</h3>
          <p>Control spending and payments</p>
        </NuxtLink>
      </div>
    </div>

    <!-- Recent Campaigns -->
    <div class="recent-campaigns">
      <div class="section-header">
        <h2>Recent Campaigns</h2>
        <NuxtLink to="/ads/manage" class="see-all-link">View All</NuxtLink>
      </div>
      
      <div class="campaigns-list">
        <div v-for="campaign in recentCampaigns" :key="campaign.id" class="campaign-card">
          <div class="campaign-info">
            <div class="campaign-image">
              <img :src="campaign.image || '/default-ad.png'" :alt="campaign.title" />
            </div>
            <div class="campaign-details">
              <h4>{{ campaign.title }}</h4>
              <p class="campaign-status" :class="campaign.status">{{ campaign.status }}</p>
              <div class="campaign-metrics">
                <span>{{ formatNumber(campaign.impressions) }} impressions</span>
                <span>{{ campaign.clicks }} clicks</span>
                <span>${{ campaign.spent.toFixed(2) }} spent</span>
              </div>
            </div>
          </div>
          <div class="campaign-actions">
            <button @click="toggleCampaign(campaign)" class="btn-secondary">
              {{ campaign.status === 'active' ? 'Pause' : 'Resume' }}
            </button>
            <NuxtLink :to="`/ads/edit/${campaign.id}`" class="btn-primary">Edit</NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Up Modal -->
    <div v-if="showTopUpModal" class="modal-overlay" @click="showTopUpModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Top Up Ad Balance</h3>
          <button @click="showTopUpModal = false" class="close-btn">
            <Icon name="x" size="20" />
          </button>
        </div>
        <div class="modal-body">
          <div class="top-up-options">
            <div v-for="amount in topUpAmounts" :key="amount" 
                 class="amount-option" 
                 :class="{ active: selectedAmount === amount }"
                 @click="selectedAmount = amount">
              <span class="amount">${{ amount }}</span>
              <span v-if="amount >= 100" class="bonus">+${{ Math.floor(amount * 0.1) }} bonus</span>
            </div>
          </div>
          <div class="custom-amount">
            <label>Custom Amount</label>
            <input v-model="customAmount" type="number" placeholder="Enter amount" min="10" />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showTopUpModal = false" class="btn-secondary">Cancel</button>
          <button @click="processTopUp" class="btn-primary" :disabled="!selectedAmount && !customAmount">
            Add Funds
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Page meta
useHead({
  title: 'Ad Center - SocialVerse',
  meta: [
    { name: 'description', content: 'Create and manage your advertising campaigns on SocialVerse' }
  ]
})

// Reactive data
const stats = ref({
  activeCampaigns: 5,
  balance: 250.75,
  totalImpressions: 45230,
  ctr: 2.4
})

const recentCampaigns = ref([
  {
    id: 1,
    title: 'Summer Sale Campaign',
    status: 'active',
    image: '/ads/summer-sale.jpg',
    impressions: 12500,
    clicks: 340,
    spent: 85.50
  },
  {
    id: 2,
    title: 'Product Launch',
    status: 'paused',
    image: '/ads/product-launch.jpg',
    impressions: 8900,
    clicks: 156,
    spent: 45.20
  },
  {
    id: 3,
    title: 'Brand Awareness',
    status: 'active',
    image: '/ads/brand-awareness.jpg',
    impressions: 23800,
    clicks: 567,
    spent: 120.00
  }
])

const showTopUpModal = ref(false)
const selectedAmount = ref(null)
const customAmount = ref('')
const topUpAmounts = [25, 50, 100, 250, 500]

// Methods
const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
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

const processTopUp = async () => {
  try {
    const amount = selectedAmount.value || parseFloat(customAmount.value)
    if (!amount || amount < 10) return
    
    // API call to process top-up
    await $fetch('/api/ads/topup', {
      method: 'POST',
      body: { amount }
    })
    
    stats.value.balance += amount
    showTopUpModal.value = false
    selectedAmount.value = null
    customAmount.value = ''
  } catch (error) {
    console.error('Error processing top-up:', error)
  }
}

// Load data on mount
onMounted(async () => {
  try {
    // Load user ad stats
    const [statsData, campaignsData] = await Promise.all([
      $fetch('/api/ads/stats'),
      $fetch('/api/ads/campaigns?limit=3')
    ])
    
    stats.value = statsData
    recentCampaigns.value = campaignsData
  } catch (error) {
    console.error('Error loading ad center data:', error)
  }
})
</script>

<style scoped>
.ad-center {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.ad-center-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2d3436;
  margin: 0 0 0.5rem 0;
}

.page-description {
  color: #636e72;
  font-size: 1.1rem;
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

.btn-secondary {
  background: transparent;
  color: #667eea;
  border: 2px solid #667eea;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #667eea;
  color: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.stat-content h3 {
  margin: 0 0 0.5rem 0;
  color: #636e72;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #2d3436;
  margin: 0 0 0.5rem 0;
}

.stat-change {
  font-size: 0.85rem;
  font-weight: 600;
}

.stat-change.positive { color: #00b894; }
.stat-change.negative { color: #e17055; }

.top-up-btn {
  background: #00b894;
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.top-up-btn:hover {
  background: #00a085;
  transform: translateY(-1px);
}

.quick-actions {
  margin-bottom: 3rem;
}

.quick-actions h2 {
  color: #2d3436;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.action-card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  text-align: center;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.action-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.action-card h3 {
  color: #2d3436;
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
}

.action-card p {
  color: #636e72;
  margin: 0;
}

.recent-campaigns {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  color: #2d3436;
  margin: 0;
  font-size: 1.5rem;
}

.see-all-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
}

.see-all-link:hover {
  color: #5a6fd8;
}

.campaigns-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.campaign-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border: 1px solid #e1e5e9;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.campaign-card:hover {
  border-color: #667eea;
  transform: translateX(4px);
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
}

.campaign-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.campaign-details h4 {
  margin: 0 0 0.25rem 0;
  color: #2d3436;
  font-size: 1.1rem;
}

.campaign-status {
  margin: 0 0 0.5rem 0;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.campaign-status.active { color: #00b894; }
.campaign-status.paused { color: #fdcb6e; }
.campaign-status.ended { color: #636e72; }

.campaign-metrics {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: #636e72;
}

.campaign-actions {
  display: flex;
  gap: 0.75rem;
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

.top-up-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.amount-option {
  padding: 1rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.amount-option:hover {
  border-color: #667eea;
}

.amount-option.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.amount {
  display: block;
  font-size: 1.2rem;
  font-weight: 600;
  color: #2d3436;
}

.bonus {
  display: block;
  font-size: 0.8rem;
  color: #00b894;
  font-weight: 600;
  margin-top: 0.25rem;
}

.custom-amount {
  margin-bottom: 1rem;
}

.custom-amount label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2d3436;
}

.custom-amount input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.custom-amount input:focus {
  outline: none;
  border-color: #667eea;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e1e5e9;
}

/* Responsive Design */
@media (max-width: 768px) {
  .ad-center {
    padding: 1rem;
  }
  
  .ad-center-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .campaign-card {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .campaign-info {
    flex-direction: column;
    text-align: center;
  }
  
  .campaign-metrics {
    justify-content: center;
  }
}
</style>
