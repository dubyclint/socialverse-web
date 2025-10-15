<template>
  <div class="stream-analytics">
    <div class="analytics-header">
      <h3>Stream Analytics</h3>
      <div class="real-time-indicator">
        <span class="live-dot"></span>
        Live Analytics
      </div>
    </div>

    <!-- Real-time Metrics -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-value">{{ metrics.currentViewers }}</div>
        <div class="metric-label">Current Viewers</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-value">{{ metrics.chatMessagesPerMinute }}</div>
        <div class="metric-label">Chat/Min</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-value">${{ (metrics.giftRevenue / 100).toFixed(2) }}</div>
        <div class="metric-label">Gift Revenue</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-value">{{ formatDuration(streamDuration) }}</div>
        <div class="metric-label">Stream Duration</div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="charts-section">
      <div class="chart-container">
        <h4>Viewer Count Over Time</h4>
        <canvas ref="viewerChart"></canvas>
      </div>
      
      <div class="chart-container">
        <h4>Revenue Breakdown</h4>
        <canvas ref="revenueChart"></canvas>
      </div>
    </div>

    <!-- Top Gifters -->
    <div class="top-gifters">
      <h4>Top Gifters</h4>
      <div class="gifter-list">
        <div 
          v-for="gifter in metrics.topGifters" 
          :key="gifter.userId"
          class="gifter-item"
        >
          <div class="gifter-name">{{ getUserName(gifter.userId) }}</div>
          <div class="gifter-amount">${{ (gifter.amount / 100).toFixed(2) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  streamId: String
})

const metrics = ref({
  currentViewers: 0,
  chatMessagesPerMinute: 0,
  giftRevenue: 0,
  topGifters: []
})

const streamDuration = ref(0)
let metricsInterval = null
let durationInterval = null

const fetchMetrics = async () => {
  try {
    const response = await $fetch(`/api/analytics/realtime/${props.streamId}`)
    if (response.success) {
      metrics.value = response.metrics
    }
  } catch (error) {
    console.error('Failed to fetch metrics:', error)
  }
}

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const getUserName = (userId) => {
  // Implement user name lookup
  return `User ${userId.slice(-4)}`
}

onMounted(() => {
  fetchMetrics()
  metricsInterval = setInterval(fetchMetrics, 5000) // Update every 5 seconds
  
  const startTime = Date.now()
  durationInterval = setInterval(() => {
    streamDuration.value = Math.floor((Date.now() - startTime) / 1000)
  }, 1000)
})

onUnmounted(() => {
  if (metricsInterval) clearInterval(metricsInterval)
  if (durationInterval) clearInterval(durationInterval)
})
</script>

<style scoped>
.stream-analytics {
  background: #1a1a1a;
  border-radius: 12px;
  padding: 20px;
  color: white;
}

.analytics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.real-time-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #10b981;
}

.live-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
}

.metric-card {
  background: #2d2d2d;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: #10b981;
}

.metric-label {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

.charts-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.chart-container {
  background: #2d2d2d;
  padding: 16px;
  border-radius: 8px;
}

.top-gifters {
  background: #2d2d2d;
  padding: 16px;
  border-radius: 8px;
}

.gifter-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.gifter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #3d3d3d;
  border-radius: 4px;
}

.gifter-amount {
  color: #10b981;
  font-weight: bold;
}
</style>
