<!-- components/streaming/StreamAnalytics.vue -->
<template>
  <div class="stream-analytics">
    <!-- Real-time Metrics -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon">
          <Icon name="mdi:eye" />
        </div>
        <div class="metric-content">
          <div class="metric-value">{{ analytics.currentViewers }}</div>
          <div class="metric-label">Current Viewers</div>
          <div class="metric-change" :class="{ positive: viewerTrend > 0, negative: viewerTrend < 0 }">
            <Icon :name="viewerTrend > 0 ? 'mdi:trending-up' : 'mdi:trending-down'" />
            {{ Math.abs(viewerTrend) }}
          </div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">
          <Icon name="mdi:chart-line" />
        </div>
        <div class="metric-content">
          <div class="metric-value">{{ analytics.peakViewers }}</div>
          <div class="metric-label">Peak Viewers</div>
          <div class="metric-subtext">{{ formatDuration(analytics.streamDuration) }} stream</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">
          <Icon name="mdi:message-text" />
        </div>
        <div class="metric-content">
          <div class="metric-value">{{ analytics.chatMessages }}</div>
          <div class="metric-label">Chat Messages</div>
          <div class="metric-subtext">{{ chatRate }}/min</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">
          <Icon name="mdi:gift" />
        </div>
        <div class="metric-content">
          <div class="metric-value">{{ analytics.pewGifts }}</div>
          <div class="metric-label">PewGifts</div>
          <div class="metric-subtext">{{ giftRate }}/min</div>
        </div>
      </div>
    </div>

    <!-- Engagement Metrics -->
    <div class="engagement-section">
      <h3>Engagement Analytics</h3>
      
      <div class="engagement-grid">
        <div class="engagement-card">
          <div class="engagement-header">
            <h4>Engagement Rate</h4>
            <div class="engagement-rate" :class="engagementClass">
              {{ engagementRate }}%
            </div>
          </div>
          <div class="engagement-bar">
            <div 
              class="engagement-fill" 
              :style="{ width: `${Math.min(parseFloat(engagementRate), 100)}%` }"
              :class="engagementClass"
            ></div>
          </div>
          <div class="engagement-details">
            <span>{{ analytics.chatMessages + analytics.pewGifts }} interactions</span>
            <span>{{ analytics.totalViews }} total views</span>
          </div>
        </div>

        <div class="engagement-card">
          <div class="engagement-header">
            <h4>Average Watch Time</h4>
            <div class="watch-time">
              {{ formatDuration(analytics.averageWatchTime) }}
            </div>
          </div>
          <div class="watch-time-comparison">
            <div class="comparison-item">
              <span class="label">Stream Duration:</span>
              <span class="value">{{ formatDuration(analytics.streamDuration) }}</span>
            </div>
            <div class="comparison-item">
              <span class="label">Retention Rate:</span>
              <span class="value">{{ retentionRate }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Live Reactions -->
    <div class="reactions-section" v-if="topReactions.length > 0">
      <h3>Popular Reactions</h3>
      <div class="reactions-grid">
        <div 
          v-for="reaction in topReactions" 
          :key="reaction.emoji"
          class="reaction-item"
        >
          <div class="reaction-emoji">{{ reaction.emoji }}</div>
          <div class="reaction-count">{{ reaction.count }}</div>
          <div class="reaction-bar">
            <div 
              class="reaction-fill"
              :style="{ width: `${(reaction.count / maxReactionCount) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Viewer Activity Timeline -->
    <div class="timeline-section">
      <h3>Viewer Activity</h3>
      <div class="timeline-chart">
        <canvas ref="timelineCanvas" width="400" height="200"></canvas>
      </div>
      <div class="timeline-controls">
        <button 
          v-for="period in timePeriods" 
          :key="period.value"
          @click="selectedPeriod = period.value"
          :class="{ active: selectedPeriod === period.value }"
          class="period-btn"
        >
          {{ period.label }}
        </button>
      </div>
    </div>

    <!-- Stream Health -->
    <div class="health-section">
      <h3>Stream Health</h3>
      <div class="health-indicators">
        <div class="health-item" :class="connectionHealth.status">
          <Icon :name="connectionHealth.icon" />
          <span>Connection: {{ connectionHealth.label }}</span>
        </div>
        <div class="health-item" :class="chatHealth.status">
          <Icon :name="chatHealth.icon" />
          <span>Chat Activity: {{ chatHealth.label }}</span>
        </div>
        <div class="health-item" :class="engagementHealth.status">
          <Icon :name="engagementHealth.icon" />
          <span>Engagement: {{ engagementHealth.label }}</span>
        </div>
      </div>
    </div>

    <!-- Export Options -->
    <div class="export-section" v-if="isStreamer">
      <h3>Export Analytics</h3>
      <div class="export-buttons">
        <button @click="exportToCsv" class="export-btn">
          <Icon name="mdi:file-excel" />
          Export CSV
        </button>
        <button @click="exportToPdf" class="export-btn">
          <Icon name="mdi:file-pdf" />
          Export PDF
        </button>
        <button @click="shareAnalytics" class="export-btn">
          <Icon name="mdi:share" />
          Share Report
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

interface Props {
  analytics: any
  engagementRate: string
  topReactions: Array<{ emoji: string; count: number }>
  isStreamer: boolean
  streamId: string
}

const props = defineProps<Props>()

// Reactive data
const selectedPeriod = ref('1h')
const timelineCanvas = ref<HTMLCanvasElement>()
const viewerHistory = ref<Array<{ timestamp: number; viewers: number }>>([])
const previousViewers = ref(0)
const updateInterval = ref<NodeJS.Timeout>()

// Time periods for timeline
const timePeriods = [
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '3h', value: '3h' },
  { label: 'All', value: 'all' }
]

// Computed properties
const viewerTrend = computed(() => {
  return props.analytics.currentViewers - previousViewers.value
})

const chatRate = computed(() => {
  const minutes = props.analytics.streamDuration / 60
  return minutes > 0 ? Math.round(props.analytics.chatMessages / minutes) : 0
})

const giftRate = computed(() => {
  const minutes = props.analytics.streamDuration / 60
  return minutes > 0 ? Math.round(props.analytics.pewGifts / minutes) : 0
})

const retentionRate = computed(() => {
  if (props.analytics.streamDuration === 0) return 0
  return Math.round((props.analytics.averageWatchTime / props.analytics.streamDuration) * 100)
})

const maxReactionCount = computed(() => {
  return Math.max(...props.topReactions.map(r => r.count), 1)
})

const engagementClass = computed(() => {
  const rate = parseFloat(props.engagementRate)
  if (rate >= 15) return 'excellent'
  if (rate >= 10) return 'good'
  if (rate >= 5) return 'average'
  return 'low'
})

const connectionHealth = computed(() => {
  // Based on viewer stability and connection quality
  const stability = calculateViewerStability()
  if (stability > 0.8) return { status: 'excellent', icon: 'mdi:check-circle', label: 'Excellent' }
  if (stability > 0.6) return { status: 'good', icon: 'mdi:check', label: 'Good' }
  if (stability > 0.4) return { status: 'average', icon: 'mdi:minus-circle', label: 'Average' }
  return { status: 'poor', icon: 'mdi:alert-circle', label: 'Poor' }
})

const chatHealth = computed(() => {
  const rate = chatRate.value
  if (rate >= 10) return { status: 'excellent', icon: 'mdi:check-circle', label: 'Very Active' }
  if (rate >= 5) return { status: 'good', icon: 'mdi:check', label: 'Active' }
  if (rate >= 2) return { status: 'average', icon: 'mdi:minus-circle', label: 'Moderate' }
  return { status: 'poor', icon: 'mdi:alert-circle', label: 'Low' }
})

const engagementHealth = computed(() => {
  const rate = parseFloat(props.engagementRate)
  if (rate >= 15) return { status: 'excellent', icon: 'mdi:check-circle', label: 'Excellent' }
  if (rate >= 10) return { status: 'good', icon: 'mdi:check', label: 'Good' }
  if (rate >= 5) return { status: 'average', icon: 'mdi:minus-circle', label: 'Average' }
  return { status: 'poor', icon: 'mdi:alert-circle', label: 'Low' }
})

// Methods
const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

const calculateViewerStability = (): number => {
  if (viewerHistory.value.length < 2) return 1
  
  let stability = 0
  for (let i = 1; i < viewerHistory.value.length; i++) {
    const prev = viewerHistory.value[i - 1].viewers
    const curr = viewerHistory.value[i].viewers
    const change = Math.abs(curr - prev) / Math.max(prev, 1)
    stability += Math.max(0, 1 - change)
  }
  
  return stability / (viewerHistory.value.length - 1)
}

const updateViewerHistory = () => {
  const now = Date.now()
  viewerHistory.value.push({
    timestamp: now,
    viewers: props.analytics.currentViewers
  })
  
  // Keep only last 3 hours of data
  const threeHoursAgo = now - (3 * 60 * 60 * 1000)
  viewerHistory.value = viewerHistory.value.filter(entry => entry.timestamp > threeHoursAgo)
  
  previousViewers.value = props.analytics.currentViewers
  drawTimeline()
}

const drawTimeline = () => {
  if (!timelineCanvas.value) return
  
  const canvas = timelineCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  if (viewerHistory.value.length < 2) return
  
  // Filter data based on selected period
  const now = Date.now()
  let periodMs = 60 * 60 * 1000 // 1 hour default
  
  switch (selectedPeriod.value) {
    case '15m': periodMs = 15 * 60 * 1000; break
    case '1h': periodMs = 60 * 60 * 1000; break
    case '3h': periodMs = 3 * 60 * 60 * 1000; break
    case 'all': periodMs = now; break
  }
  
  const filteredData = viewerHistory.value.filter(entry => 
    entry.timestamp > (now - periodMs)
  )
  
  if (filteredData.length < 2) return
  
  // Calculate dimensions
  const padding = 20
  const width = canvas.width - (padding * 2)
  const height = canvas.height - (padding * 2)
  
  // Find min/max values
  const minViewers = Math.min(...filteredData.map(d => d.viewers))
  const maxViewers = Math.max(...filteredData.map(d => d.viewers))
  const viewerRange = Math.max(maxViewers - minViewers, 1)
  
  // Draw grid lines
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  
  // Horizontal grid lines
  for (let i = 0; i <= 5; i++) {
    const y = padding + (height * i / 5)
    ctx.beginPath()
    ctx.moveTo(padding, y)
    ctx.lineTo(padding + width, y)
    ctx.stroke()
  }
  
  // Draw line chart
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2
  ctx.beginPath()
  
  filteredData.forEach((entry, index) => {
    const x = padding + (width * index / (filteredData.length - 1))
    const y = padding + height - ((entry.viewers - minViewers) / viewerRange * height)
    
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  
  ctx.stroke()
  
  // Draw data points
  ctx.fillStyle = '#3b82f6'
  filteredData.forEach((entry, index) => {
    const x = padding + (width * index / (filteredData.length - 1))
    const y = padding + height - ((entry.viewers - minViewers) / viewerRange * height)
    
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, 2 * Math.PI)
    ctx.fill()
  })
  
  // Draw labels
  ctx.fillStyle = '#6b7280'
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'center'
  
  // Y-axis labels
  for (let i = 0; i <= 5; i++) {
    const value = minViewers + (viewerRange * i / 5)
    const y = padding + height - (height * i / 5)
    ctx.fillText(Math.round(value).toString(), padding - 10, y + 4)
  }
}

const exportToCsv = () => {
  const csvData = [
    ['Timestamp', 'Viewers', 'Chat Messages', 'PewGifts'],
    ...viewerHistory.value.map(entry => [
      new Date(entry.timestamp).toISOString(),
      entry.viewers,
      '', // Would need to track chat messages over time
      ''  // Would need to track gifts over time
    ])
  ]
  
  const csvContent = csvData.map(row => row.join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `stream-analytics-${props.streamId}-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  
  URL.revokeObjectURL(url)
}

const exportToPdf = () => {
  // Implementation would require a PDF library like jsPDF
  console.log('PDF export not implemented yet')
}

const shareAnalytics = () => {
  const shareData = {
    title: 'Stream Analytics Report',
    text: `Stream had ${props.analytics.peakViewers} peak viewers with ${props.engagementRate}% engagement rate`,
    url: window.location.href
  }
  
  if (navigator.share) {
    navigator.share(shareData)
  } else {
    // Fallback to clipboard
    navigator.clipboard.writeText(`${shareData.title}: ${shareData.text} - ${shareData.url}`)
  }
}

// Lifecycle
onMounted(() => {
  // Update viewer history every 30 seconds
  updateInterval.value = setInterval(updateViewerHistory, 30000)
  
  // Initial draw
  nextTick(() => {
    drawTimeline()
  })
})

onUnmounted(() => {
  if (updateInterval.value) {
    clearInterval(updateInterval.value)
  }
})

// Watch for period changes
watch(selectedPeriod, () => {
  drawTimeline()
})

// Watch for analytics updates
watch(() => props.analytics, () => {
  updateViewerHistory()
}, { deep: true })
</script>

<style scoped>
.stream-analytics {
  padding: 1.5rem;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.metric-card {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.metric-icon {
  font-size: 2rem;
  color: #3b82f6;
  margin-right: 1rem;
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
}

.metric-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.metric-change {
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  gap: 0.25rem;
}

.metric-change.positive {
  color: #059669;
}

.metric-change.negative {
  color: #dc2626;
}

.metric-subtext {
  font-size: 0.75rem;
  color: #9ca3af;
}

.engagement-section,
.reactions-section,
.timeline-section,
.health-section,
.export-section {
  margin-bottom: 2rem;
}

.engagement-section h3,
.reactions-section h3,
.timeline-section h3,
.health-section h3,
.export-section h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.engagement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.engagement-card {
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.engagement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.engagement-header h4 {
  font-size: 1rem;
  font-weight: 500;
  color: #374151;
}

.engagement-rate {
  font-size: 1.25rem;
  font-weight: bold;
}

.engagement-rate.excellent { color: #059669; }
.engagement-rate.good { color: #0891b2; }
.engagement-rate.average { color: #d97706; }
.engagement-rate.low { color: #dc2626; }

.engagement-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.engagement-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.engagement-fill.excellent { background: #059669; }
.engagement-fill.good { background: #0891b2; }
.engagement-fill.average { background: #d97706; }
.engagement-fill.low { background: #dc2626; }

.engagement-details {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #6b7280;
}

.reactions-grid {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.reaction-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  min-width: 80px;
}

.reaction-emoji {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.reaction-count {
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.reaction-bar {
  width: 100%;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.reaction-fill {
  height: 100%;
  background: #3b82f6;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.timeline-chart {
  margin-bottom: 1rem;
}

.timeline-controls {
  display: flex;
  gap: 0.5rem;
}

.period-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  background: #ffffff;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.period-btn:hover {
  background: #f3f4f6;
}

.period-btn.active {
  background: #3b82f6;
  color: #ffffff;
  border-color: #3b82f6;
}

.health-indicators {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.health-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
}

.health-item.excellent {
  background: #dcfce7;
  color: #166534;
}

.health-item.good {
  background: #cffafe;
  color: #155e75;
}

.health-item.average {
  background: #fef3c7;
  color: #92400e;
}

.health-item.poor {
  background: #fee2e2;
  color: #991b1b;
}

.export-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #3b82f6;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.2s;
}

.export-btn:hover {
  background: #2563eb;
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .engagement-grid {
    grid-template-columns: 1fr;
  }
  
  .health-indicators {
    flex-direction: column;
  }
  
  .export-buttons {
    flex-direction: column;
  }
}
</style>
