<template>
  <div class="stream-analytics">
    <div class="analytics-header">
      <h3>Stream Analytics</h3>
      <div class="real-time-indicator">
        <span class="live-dot"></span>
        Live Analytics
      </div>
      <button @click="toggleExpanded" class="toggle-btn">
        {{ isExpanded ? 'Collapse' : 'Expand' }}
      </button>
    </div>

    <div v-if="isExpanded" class="analytics-content">
      <!-- Real-time Metrics -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="metric-data">
            <div class="metric-value">{{ formatNumber(metrics.currentViewers) }}</div>
            <div class="metric-label">Current Viewers</div>
            <div class="metric-change" :class="viewerTrend">
              {{ viewerChange > 0 ? '+' : '' }}{{ viewerChange }}
            </div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
            </svg>
          </div>
          <div class="metric-data">
            <div class="metric-value">{{ metrics.chatMessagesPerMinute }}</div>
            <div class="metric-label">Chat/Min</div>
            <div class="metric-subtext">{{ formatNumber(metrics.totalChatMessages) }} total</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="metric-data">
            <div class="metric-value">${{ (metrics.giftRevenue / 100).toFixed(2) }}</div>
            <div class="metric-label">Gift Revenue</div>
            <div class="metric-subtext">{{ metrics.giftCount }} gifts sent</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="metric-data">
            <div class="metric-value">{{ formatDuration(streamDuration) }}</div>
            <div class="metric-label">Stream Duration</div>
            <div class="metric-subtext">Peak: {{ formatNumber(metrics.peakViewers) }} viewers</div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <div class="chart-container">
          <div class="chart-header">
            <h4>Viewer Count Over Time</h4>
            <div class="chart-controls">
              <select v-model="viewerChartTimeframe" @change="updateViewerChart">
                <option value="1h">Last Hour</option>
                <option value="3h">Last 3 Hours</option>
                <option value="6h">Last 6 Hours</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
          <div class="chart-wrapper">
            <canvas ref="viewerChart" width="400" height="200"></canvas>
          </div>
        </div>
        
        <div class="chart-container">
          <div class="chart-header">
            <h4>Engagement Metrics</h4>
            <div class="chart-legend">
              <span class="legend-item">
                <span class="legend-color chat"></span>
                Chat Messages
              </span>
              <span class="legend-item">
                <span class="legend-color reactions"></span>
                Reactions
              </span>
              <span class="legend-item">
                <span class="legend-color gifts"></span>
                Gifts
              </span>
            </div>
          </div>
          <div class="chart-wrapper">
            <canvas ref="engagementChart" width="400" height="200"></canvas>
          </div>
        </div>
      </div>

      <!-- Top Performers Section -->
      <div class="performers-section">
        <div class="top-gifters">
          <h4>Top Gifters</h4>
          <div class="performer-list">
            <div 
              v-for="(gifter, index) in metrics.topGifters" 
              :key="gifter.userId"
              class="performer-item"
            >
              <div class="performer-rank">{{ index + 1 }}</div>
              <div class="performer-avatar">
                <img 
                  :src="gifter.avatar || '/default-avatar.png'" 
                  :alt="gifter.username"
                >
              </div>
              <div class="performer-info">
                <div class="performer-name">{{ gifter.username || `User${gifter.userId.slice(-4)}` }}</div>
                <div class="performer-stat">${{ (gifter.amount / 100).toFixed(2) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="top-chatters">
          <h4>Most Active Chatters</h4>
          <div class="performer-list">
            <div 
              v-for="(chatter, index) in metrics.topChatters" 
              :key="chatter.userId"
              class="performer-item"
            >
              <div class="performer-rank">{{ index + 1 }}</div>
              <div class="performer-avatar">
                <img 
                  :src="chatter.avatar || '/default-avatar.png'" 
                  :alt="chatter.username"
                >
              </div>
              <div class="performer-info">
                <div class="performer-name">{{ chatter.username || `User${chatter.userId.slice(-4)}` }}</div>
                <div class="performer-stat">{{ chatter.messageCount }} messages</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Detailed Stats -->
      <div class="detailed-stats">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">Average Watch Time</div>
            <div class="stat-value">{{ formatDuration(metrics.averageWatchTime) }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Total Reactions</div>
            <div class="stat-value">{{ formatNumber(metrics.totalReactions) }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Unique Viewers</div>
            <div class="stat-value">{{ formatNumber(metrics.uniqueViewers) }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Return Viewers</div>
            <div class="stat-value">{{ metrics.returnViewerRate }}%</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Chat Participation</div>
            <div class="stat-value">{{ metrics.chatParticipationRate }}%</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Gift Conversion</div>
            <div class="stat-value">{{ metrics.giftConversionRate }}%</div>
          </div>
        </div>
      </div>

      <!-- Export Options -->
      <div class="export-section">
        <h4>Export Analytics</h4>
        <div class="export-buttons">
          <button @click="exportToCsv" class="export-btn">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Export CSV
          </button>
          <button @click="exportToPdf" class="export-btn">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            Export PDF
          </button>
          <button @click="shareAnalytics" class="export-btn">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"/>
            </svg>
            Share
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps({
  streamId: {
    type: String,
    required: true
  }
})

const isExpanded = ref(true)
const viewerChart = ref(null)
const engagementChart = ref(null)
const viewerChartTimeframe = ref('1h')

const metrics = ref({
  currentViewers: 0,
  chatMessagesPerMinute: 0,
  totalChatMessages: 0,
  giftRevenue: 0,
  giftCount: 0,
  peakViewers: 0,
  averageWatchTime: 0,
  totalReactions: 0,
  uniqueViewers: 0,
  returnViewerRate: 0,
  chatParticipationRate: 0,
  giftConversionRate: 0,
  topGifters: [],
  topChatters: []
})

const streamDuration = ref(0)
const previousViewerCount = ref(0)

let metricsInterval = null
let durationInterval = null
let viewerChartInstance = null
let engagementChartInstance = null

const viewerChange = computed(() => {
  return metrics.value.currentViewers - previousViewerCount.value
})

const viewerTrend = computed(() => {
  if (viewerChange.value > 0) return 'positive'
  if (viewerChange.value < 0) return 'negative'
  return 'neutral'
})

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) {
    nextTick(() => {
      initializeCharts()
    })
  }
}

const fetchMetrics = async () => {
  try {
    const response = await $fetch(`/api/analytics/realtime/${props.streamId}`)
    if (response.success) {
      previousViewerCount.value = metrics.value.currentViewers
      metrics.value = { ...metrics.value, ...response.metrics }
    }
  } catch (error) {
    console.error('Failed to fetch metrics:', error)
  }
}

const fetchDetailedAnalytics = async () => {
  try {
    const response = await $fetch(`/api/analytics/detailed/${props.streamId}`)
    if (response.success) {
      metrics.value = { ...metrics.value, ...response.analytics }
    }
  } catch (error) {
    console.error('Failed to fetch detailed analytics:', error)
  }
}

const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num?.toString() || '0'
}

const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const initializeCharts = async () => {
  await nextTick()
  
  if (viewerChart.value && !viewerChartInstance) {
    initializeViewerChart()
  }
  
  if (engagementChart.value && !engagementChartInstance) {
    initializeEngagementChart()
  }
}

const initializeViewerChart = () => {
  const ctx = viewerChart.value.getContext('2d')
  
  viewerChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Viewers',
        data: [],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          }
        }
      }
    }
  })
}

const initializeEngagementChart = () => {
  const ctx = engagementChart.value.getContext('2d')
  
  engagementChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Chat Messages',
          data: [],
          backgroundColor: '#3b82f6',
          borderRadius: 4
        },
        {
          label: 'Reactions',
          data: [],
          backgroundColor: '#f59e0b',
          borderRadius: 4
        },
        {
          label: 'Gifts',
          data: [],
          backgroundColor: '#ef4444',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          }
        }
      }
    }
  })
}

const updateViewerChart = async () => {
  try {
    const response = await $fetch(`/api/analytics/viewer-history/${props.streamId}`, {
      query: { timeframe: viewerChartTimeframe.value }
    })
    
    if (response.success && viewerChartInstance) {
      viewerChartInstance.data.labels = response.data.labels
      viewerChartInstance.data.datasets[0].data = response.data.viewers
      viewerChartInstance.update()
    }
  } catch (error) {
    console.error('Failed to update viewer chart:', error)
  }
}

const updateEngagementChart = async () => {
  try {
    const response = await $fetch(`/api/analytics/engagement-history/${props.streamId}`)
    
    if (response.success && engagementChartInstance) {
      engagementChartInstance.data.labels = response.data.labels
      engagementChartInstance.data.datasets[0].data = response.data.chatMessages
      engagementChartInstance.data.datasets[1].data = response.data.reactions
      engagementChartInstance.data.datasets[2].data = response.data.gifts
      engagementChartInstance.update()
    }
  } catch (error) {
    console.error('Failed to update engagement chart:', error)
  }
}

const exportToCsv = async () => {
  try {
    const response = await $fetch(`/api/analytics/export/csv/${props.streamId}`)
    
    // Create download link
    const blob = new Blob([response.data], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `stream-analytics-${props.streamId}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to export CSV:', error)
  }
}

const exportToPdf = async () => {
  try {
    const response = await $fetch(`/api/analytics/export/pdf/${props.streamId}`, {
      responseType: 'blob'
    })
    
    const blob = new Blob([response], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `stream-analytics-${props.streamId}-${new Date().toISOString().split('T')[0]}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to export PDF:', error)
  }
}

const shareAnalytics = async () => {
  const shareData = {
    title: 'Stream Analytics Report',
    text: `Check out my stream analytics! ${metrics.value.currentViewers} viewers, ${formatDuration(streamDuration.value)} duration`,
    url: `${window.location.origin}/analytics/${props.streamId}`
  }
  
  try {
    if (navigator.share && navigator.canShare(shareData)) {
      await navigator.share(shareData)
    } else {
      await navigator.clipboard.writeText(shareData.url)
      // Show toast notification
      console.log('Analytics link copied to clipboard!')
    }
  } catch (error) {
    console.error('Error sharing analytics:', error)
  }
}

onMounted(() => {
  // Initial data fetch
  fetchMetrics()
  fetchDetailedAnalytics()
  
  // Set up intervals
  metricsInterval = setInterval(fetchMetrics, 5000) // Update every 5 seconds
  
  const startTime = Date.now()
  durationInterval = setInterval(() => {
    streamDuration.value = Math.floor((Date.now() - startTime) / 1000)
  }, 1000)
  
  // Initialize charts if expanded
  if (isExpanded.value) {
    nextTick(() => {
      initializeCharts()
      updateViewerChart()
      updateEngagementChart()
    })
  }
  
  // Update charts periodically
  setInterval(() => {
    if (viewerChartInstance) updateViewerChart()
    if (engagementChartInstance) updateEngagementChart()
  }, 30000) // Update every 30 seconds
})

onUnmounted(() => {
  if (metricsInterval) clearInterval(metricsInterval)
  if (durationInterval) clearInterval(durationInterval)
  
  // Destroy chart instances
  if (viewerChartInstance) {
    viewerChartInstance.destroy()
    viewerChartInstance = null
  }
  if (engagementChartInstance) {
    engagementChartInstance.destroy()
    engagementChartInstance = null
  }
})
</script>

<style scoped>
.stream-analytics {
  background: #1a1a1a;
  border-radius: 12px;
  padding: 20px;
  color: white;
  margin-bottom: 20px;
}

.analytics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.analytics-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.real-time-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #10b981;
  font-weight: 500;
}

.live-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.toggle-btn {
  background: #2d2d2d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.toggle-btn:hover {
  background: #3d3d3d;
}

.analytics-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.metric-card {
  background: #2d2d2d;
  padding: 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.metric-icon {
  color: #10b981;
  flex-shrink: 0;
}

.metric-data {
  flex: 1;
  min-width: 0;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: white;
  line-height: 1.2;
}

.metric-label {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
  font-weight: 500;
}

.metric-change {
  font-size: 11px;
  font-weight: 600;
  margin-top: 2px;
}

.metric-change.positive {
  color: #10b981;
}

.metric-change.negative {
  color: #ef4444;
}

.metric-change.neutral {
  color: #6b7280;
}

.metric-subtext {
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
}

.charts-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart-container {
  background: #2d2d2d;
  padding: 20px;
  border-radius: 12px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.chart-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.chart-controls select {
  background: #1a1a1a;
  color: white;
  border: 1px solid #4d4d4d;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
}

.chart-legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.chat {
  background: #3b82f6;
}

.legend-color.reactions {
  background: #f59e0b;
}

.legend-color.gifts {
  background: #ef4444;
}

.chart-wrapper {
  height: 200px;
  position: relative;
}

.performers-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.top-gifters,
.top-chatters {
  background: #2d2d2d;
  padding: 20px;
  border-radius: 12px;
}

.top-gifters h4,
.top-chatters h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
}

.performer-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.performer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #1a1a1a;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.performer-item:hover {
  background: #333;
}

.performer-rank {
  width: 24px;
  height: 24px;
  background: #10b981;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
}

.performer-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.performer-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.performer-info {
  flex: 1;
  min-width: 0;
}

.performer-name {
  font-size: 14px;
  font-weight: 500;
  color: white;
  margin-bottom: 2px;
}

.performer-stat {
  font-size: 12px;
  color: #10b981;
  font-weight: 600;
}

.detailed-stats {
  background: #2d2d2d;
  padding: 20px;
  border-radius: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #1a1a1a;
  border-radius: 8px;
}

.stat-label {
  font-size: 12px;
  color: #888;
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #10b981;
}

.export-section {
  background: #2d2d2d;
  padding: 20px;
  border-radius: 12px;
}

.export-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
}

.export-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.export-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.export-btn:hover {
  background: #059669;
  transform: translateY(-1px);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .charts-section,
  .performers-section {
    grid-template-columns: 1fr;
  }
  
  .metrics-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
}

@media (max-width: 768px) {
  .analytics-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .real-time-indicator {
    justify-content: center;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .chart-legend {
    justify-content: center;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .export-buttons {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .stream-analytics {
    padding: 16px;
  }
  
  .metric-card {
    padding: 16px;
  }
  
  .chart-container,
  .top-gifters,
  .top-chatters,
  .detailed-stats,
  .export-section {
    padding: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
