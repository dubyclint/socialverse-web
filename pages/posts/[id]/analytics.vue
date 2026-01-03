<!-- pages/posts/[id]/analytics.vue -->
<!-- ============================================================================
     POST ANALYTICS DASHBOARD
     ============================================================================ -->

<template>
  <div class="analytics-page">
    <div class="analytics-container">
      <!-- Header -->
      <div class="analytics-header">
        <NuxtLink to="/feed" class="back-link">
          <Icon name="arrow-left" size="20" />
          Back to Feed
        </NuxtLink>
        <h1>Post Analytics</h1>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading analytics...</p>
      </div>

      <!-- Analytics Content -->
      <div v-else class="analytics-content">
        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Views</div>
            <div class="stat-value">{{ analytics.views }}</div>
            <div class="stat-change">+12% from last week</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Likes</div>
            <div class="stat-value">{{ analytics.likes }}</div>
            <div class="stat-change">+8% from last week</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Comments</div>
            <div class="stat-value">{{ analytics.comments }}</div>
            <div class="stat-change">+5% from last week</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Shares</div>
            <div class="stat-value">{{ analytics.shares }}</div>
            <div class="stat-change">+3% from last week</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Engagement Rate</div>
            <div class="stat-value">{{ analytics.engagementRate }}%</div>
            <div class="stat-change">Average engagement</div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="charts-section">
          <!-- Device Breakdown -->
          <div class="chart-card">
            <h3>Views by Device</h3>
            <div class="device-breakdown">
              <div
                v-for="(count, device) in analytics.deviceBreakdown"
                :key="device"
                class="device-item"
              >
                <div class="device-label">{{ device }}</div>
                <div class="device-bar">
                  <div
                    class="device-fill"
                    :style="{ width: getPercentage(count, analytics.views) + '%' }"
                  ></div>
                </div>
                <div class="device-count">{{ count }}</div>
              </div>
            </div>
          </div>

          <!-- Top Countries -->
          <div class="chart-card">
            <h3>Top Countries</h3>
            <div class="countries-list">
              <div
                v-for="(country, index) in analytics.topCountries"
                :key="country"
                class="country-item"
              >
                <span class="country-rank">{{ index + 1 }}</span>
                <span class="country-name">{{ country }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Engagement Timeline -->
        <div class="timeline-section">
          <h3>Engagement Timeline</h3>
          <div class="timeline">
            <div class="timeline-item">
              <div class="timeline-label">Likes</div>
              <div class="timeline-count">{{ analytics.likes }}</div>
            </div>
            <div class="timeline-item">
              <div class="timeline-label">Comments</div>
              <div class="timeline-count">{{ analytics.comments }}</div>
            </div>
            <div class="timeline-item">
              <div class="timeline-label">Shares</div>
              <div class="timeline-count">{{ analytics.shares }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'profile-completion'],
  layout: 'default'
})
         
import { ref, onMounted } from 'vue'

const route = useRoute()
const postId = route.params.id as string

const loading = ref(true)
const analytics = ref({
  views: 0,
  likes: 0,
  comments: 0,
  shares: 0,
  engagementRate: 0,
  deviceBreakdown: {},
  topCountries: []
})

const getPercentage = (value: number, total: number): number => {
  return total > 0 ? (value / total) * 100 : 0
}

const loadAnalytics = async () => {
  try {
    const response = await $fetch<any>(`/api/posts/${postId}/analytics`)
    if (response.success) {
      analytics.value = response.data
    }
  } catch (error) {
    console.error('Load analytics error:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAnalytics()
})
</script>

<style scoped>
.analytics-page {
  min-height: 100vh;
  background: #f9fafb;
  padding: 24px 16px;
}

.analytics-container {
  max-width: 1200px;
  margin: 0 auto;
}

.analytics-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.back-link:hover {
  color: #1d4ed8;
}

.analytics-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.analytics-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.stat-change {
  font-size: 12px;
  color: #10b981;
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.chart-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-card h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
}

.device-breakdown {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.device-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.device-label {
  width: 80px;
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
  text-transform: capitalize;
}

.device-bar {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.device-fill {
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #7c3aed);
  transition: width 0.3s;
}

.device-count {
  width: 40px;
  text-align: right;
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.countries-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.country-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 13px;
}

.country-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #2563eb;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
}

.country-name {
  color: #1f2937;
  font-weight: 500;
}

.timeline-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.timeline-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
}

.timeline {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.timeline-item {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  text-align: center;
}

.timeline-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.timeline-count {
  font-size: 24px;
  font-weight: 700;
  color: #2563eb;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-section {
    grid-template-columns: 1fr;
  }

  .timeline {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .analytics-page {
    padding: 16px;
  }

  .analytics-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
