<template>
  <div class="ml-dashboard">
    <div class="dashboard-header">
      <h1>ML Algorithm Control Center</h1>
      <div class="status-indicators">
        <div class="status-item" :class="systemStatus.overall">
          <span class="status-dot"></span>
          System: {{ systemStatus.overall.toUpperCase() }}
        </div>
        <div class="metrics-summary">
          <span>Revenue: ${{ metrics.totalRevenue.toLocaleString() }}</span>
          <span>CTR: {{ (metrics.avgCTR * 100).toFixed(2) }}%</span>
          <span>Fill Rate: {{ (metrics.fillRate * 100).toFixed(1) }}%</span>
        </div>
      </div>
    </div>

    <div class="dashboard-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="{ active: activeTab === tab.id }"
        class="tab-button"
      >
        {{ tab.name }}
      </button>
    </div>

    <!-- Algorithm Configuration Tab -->
    <div v-if="activeTab === 'algorithm'" class="tab-content">
      <AlgorithmConfig 
        :config="algorithmConfig" 
        @update="updateAlgorithmConfig"
        @reset="resetToDefaults"
      />
    </div>

    <!-- Auction Settings Tab -->
    <div v-if="activeTab === 'auction'" class="tab-content">
      <AuctionSettings 
        :settings="auctionSettings" 
        @update="updateAuctionSettings"
      />
    </div>

    <!-- Causal Inference Tab -->
    <div v-if="activeTab === 'causal'" class="tab-content">
      <CausalInferencePanel 
        :experiments="causalExperiments"
        :config="causalConfig"
        @update-config="updateCausalConfig"
        @create-experiment="createExperiment"
        @stop-experiment="stopExperiment"
      />
    </div>

    <!-- Bandit Configuration Tab -->
    <div v-if="activeTab === 'bandit'" class="tab-content">
      <BanditConfiguration 
        :config="banditConfig"
        :performance="banditPerformance"
        @update="updateBanditConfig"
      />
    </div>

    <!-- Real-time Monitoring Tab -->
    <div v-if="activeTab === 'monitoring'" class="tab-content">
      <RealtimeMonitoring 
        :metrics="realtimeMetrics"
        :alerts="activeAlerts"
      />
    </div>

    <!-- A/B Testing Tab -->
    <div v-if="activeTab === 'testing'" class="tab-content">
      <ABTestingPanel 
        :tests="abTests"
        @create-test="createABTest"
        @stop-test="stopABTest"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'

const activeTab = ref('algorithm')
const systemStatus = reactive({
  overall: 'healthy',
  mlService: 'running',
  database: 'connected',
  redis: 'connected'
})

const metrics = reactive({
  totalRevenue: 0,
  avgCTR: 0,
  fillRate: 0,
  auctionsPerMinute: 0,
  avgLatency: 0
})

const tabs = [
  { id: 'algorithm', name: 'Algorithm Config' },
  { id: 'auction', name: 'Ad Auction' },
  { id: 'causal', name: 'Causal Inference' },
  { id: 'bandit', name: 'Bandit Settings' },
  { id: 'monitoring', name: 'Monitoring' },
  { id: 'testing', name: 'A/B Testing' }
]

const algorithmConfig = reactive({
  explorationRate: 0.15,
  ghostAdRate: 0.05,
  maxAdsPerFeed: 3,
  diversityWeight: 0.2,
  engagementWeight: 0.4,
  revenueWeight: 0.4,
  freshnessWeight: 0.3,
  popularityWeight: 0.2,
  personalizedWeight: 0.5,
  qualityThreshold: 0.3,
  maxCandidates: 1000,
  finalFeedSize: 50
})

const auctionSettings = reactive({
  auctionType: 'GSP',
  reservePrice: 0.01,
  maxAdsPerAuction: 10,
  bidFloor: 0.005,
  timeoutMs: 50,
  qualityThreshold: 0.3,
  budgetPacingEnabled: true,
  frequencyCappingEnabled: true,
  competitiveMultiplierEnabled: true
})

const causalConfig = reactive({
  ghostRate: 0.05,
  minExperimentSize: 1000,
  experimentDuration: 14,
  confidenceLevel: 0.95,
  autoCreateExperiments: true,
  significanceThreshold: 0.05
})

const banditConfig = reactive({
  algorithm: 'LinUCB',
  alpha: 0.1,
  contextDimension: 50,
  maxArms: 1000,
  updateFrequency: 100,
  warmupPeriod: 50
})

const causalExperiments = ref([])
const banditPerformance = ref({})
const realtimeMetrics = ref({})
const activeAlerts = ref([])
const abTests = ref([])

onMounted(async () => {
  await loadDashboardData()
  startRealtimeUpdates()
})

async function loadDashboardData() {
  try {
    const { data } = await $fetch('/api/admin/ml/dashboard')
    
    Object.assign(algorithmConfig, data.algorithmConfig)
    Object.assign(auctionSettings, data.auctionSettings)
    Object.assign(causalConfig, data.causalConfig)
    Object.assign(banditConfig, data.banditConfig)
    
    causalExperiments.value = data.causalExperiments
    banditPerformance.value = data.banditPerformance
    abTests.value = data.abTests
    
    Object.assign(metrics, data.metrics)
    Object.assign(systemStatus, data.systemStatus)
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
}

async function updateAlgorithmConfig(updates) {
  try {
    Object.assign(algorithmConfig, updates)
    
    await $fetch('/api/admin/ml/algorithm-config', {
      method: 'PUT',
      body: algorithmConfig
    })
    
    showNotification('Algorithm configuration updated successfully', 'success')
  } catch (error) {
    showNotification('Failed to update algorithm configuration', 'error')
  }
}

async function updateAuctionSettings(updates) {
  try {
    Object.assign(auctionSettings, updates)
    
    await $fetch('/api/admin/ml/auction-settings', {
      method: 'PUT',
      body: auctionSettings
    })
    
    showNotification('Auction settings updated successfully', 'success')
  } catch (error) {
    showNotification('Failed to update auction settings', 'error')
  }
}

async function updateCausalConfig(updates) {
  try {
    Object.assign(causalConfig, updates)
    
    await $fetch('/api/admin/ml/causal-config', {
      method: 'PUT',
      body: causalConfig
    })
    
    showNotification('Causal inference configuration updated', 'success')
  } catch (error) {
    showNotification('Failed to update causal configuration', 'error')
  }
}

async function updateBanditConfig(updates) {
  try {
    Object.assign(banditConfig, updates)
    
    await $fetch('/api/admin/ml/bandit-config', {
      method: 'PUT',
      body: banditConfig
    })
    
    showNotification('Bandit configuration updated successfully', 'success')
  } catch (error) {
    showNotification('Failed to update bandit configuration', 'error')
  }
}

function startRealtimeUpdates() {
  setInterval(async () => {
    try {
      const { data } = await $fetch('/api/admin/ml/realtime-metrics')
      Object.assign(metrics, data.metrics)
      realtimeMetrics.value = data.realtimeMetrics
      activeAlerts.value = data.alerts
    } catch (error) {
      console.error('Failed to fetch realtime metrics:', error)
    }
  }, 5000) // Update every 5 seconds
}

function showNotification(message, type) {
  // Implement notification system
  console.log(`${type.toUpperCase()}: ${message}`)
}
</script>

<style scoped>
.ml-dashboard {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
}

.dashboard-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
}

.status-indicators {
  display: flex;
  gap: 24px;
  align-items: center;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-item.healthy .status-dot {
  background-color: #10b981;
}

.status-item.warning .status-dot {
  background-color: #f59e0b;
}

.status-item.error .status-dot {
  background-color: #ef4444;
}

.metrics-summary {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #6b7280;
}

.dashboard-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.tab-button {
  padding: 12px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-weight: 500;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-button:hover {
  color: #374151;
  background-color: #f9fafb;
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.tab-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
