<template>
  <div class="ad-ab-performance">
    <h2>📊 Ad Format A/B Performance</h2>

    <!-- Summary Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Total Impressions</h3>
        <p class="stat-number">{{ totalImpressions }}</p>
      </div>
      <div class="stat-card">
        <h3>Avg. CTR</h3>
        <p class="stat-number">{{ avgCtr }}%</p>
      </div>
      <div class="stat-card">
        <h3>Total Conversions</h3>
        <p class="stat-number">{{ totalConversions }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <select v-model="page">
        <option value="">All Pages</option>
        <option value="Home Feed">Home Feed</option>
        <option value="Explore">Explore</option>
        <option value="Profile">Profile</option>
        <option value="Post Detail">Post Detail</option>
        <option value="Chat Sidebar">Chat Sidebar</option>
        <option value="Trade Listings">Trade Listings</option>
      </select>

      <select v-model="region">
        <option value="">All Regions</option>
        <option value="Nigeria">Nigeria</option>
        <option value="Kenya">Kenya</option>
        <option value="UK">UK</option>
      </select>

      <input type="date" v-model="startDate" />
      <input type="date" v-model="endDate" />
      <button @click="load" :disabled="loading">Apply Filters</button>
    </div>

    <!-- Chart -->
    <div class="chart-container">
      <canvas ref="chart" height="300"></canvas>
    </div>

    <!-- Data Table -->
    <table v-if="!loading && rows.length">
      <thead>
        <tr>
          <th>Format</th>
          <th>Impressions</th>
          <th>Clicks</th>
          <th>CTR</th>
          <th>Conversions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.format">
          <td>{{ row.format }}</td>
          <td>{{ row.impressions.toLocaleString() }}</td>
          <td>{{ row.clicks.toLocaleString() }}</td>
          <td>{{ row.ctr.toFixed(2) }}%</td>
          <td>{{ row.conversions.toLocaleString() }}</td>
        </tr>
      </tbody>
    </table>

    <p v-else-if="!loading && rows.length === 0" class="no-data">
      No data available for the selected filters.
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Chart from 'chart.js/auto'

// Reactive data
const rows = ref([])
const chart = ref(null)
const page = ref('')
const region = ref('')
const startDate = ref('')
const endDate = ref('')
const loading = ref(false)

// Computed summary stats
const totalImpressions = computed(() => rows.value.reduce((sum, r) => sum + r.impressions, 0))
const totalClicks = computed(() => rows.value.reduce((sum, r) => sum + r.clicks, 0))
const totalConversions = computed(() => rows.value.reduce((sum, r) => sum + r.conversions, 0))
const avgCtr = computed(() => {
  const totalImp = totalImpressions.value
  return totalImp > 0 ? ((totalClicks.value / totalImp) * 100).toFixed(2) : '0.00'
})

// Chart instance for cleanup
let chartInstance = null

async function load() {
  loading.value = true
  try {
    const query = new URLSearchParams({
      page: page.value || '',
      region: region.value || '',
      startDate: startDate.value || '',
      endDate: endDate.value || ''
    })

    const res = await fetch(`/api/ads/ab-metrics?${query}`)
    if (!res.ok) throw new Error('Failed to fetch data')
    rows.value = await res.json()
    renderChart()
  } catch (error) {
    console.error('Error loading ad metrics:', error)
    rows.value = []
  } finally {
    loading.value = false
  }
}

function renderChart() {
  // Destroy previous chart to avoid memory leaks
  if (chartInstance) {
    chartInstance.destroy()
  }

  const ctx = chart.value.getContext('2d')
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: rows.value.map(r => r.format),
      datasets: [
        {
          label: 'Impressions',
          data: rows.value.map(r => r.impressions),
          backgroundColor: '#4caf50'
        },
        {
          label: 'Clicks',
          data: rows.value.map(r => r.clicks),
          backgroundColor: '#2196f3'
        },
        {
          label: 'Conversions',
          data: rows.value.map(r => r.conversions),
          backgroundColor: '#ff9800'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
        }
      },
      scales: {
        x: {
          stacked: false
        },
        y: {
          beginAtZero: true,
          stacked: false
        }
      }
    }
  })
}

// Initial load
onMounted(() => {
  load()
})

// Cleanup on unmount
onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})
</script>

<style scoped>
.ad-ab-performance {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

h2 {
  margin-bottom: 1.5rem;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.25rem;
  margin: 1.5rem 0 2rem;
}

.stat-card {
  background: #f8fafc;
  padding: 1.25rem;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  border: 1px solid #e2e8f0;
}

.stat-number {
  font-size: 1.75rem;
  font-weight: bold;
  color: #2563eb;
  margin: 0.5rem 0 0;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: center;
}

.filters select,
.filters input,
.filters button {
  padding: 0.5rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.95rem;
}

.filters button {
  background-color: #3b82f6;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

.filters button:hover:not(:disabled) {
  background-color: #2563eb;
}

.filters button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.chart-container {
  height: 300px;
  margin: 1.5rem 0;
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

th,
td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

th {
  background-color: #f8fafc;
  font-weight: 600;
  color: #475569;
}

tr:last-child td {
  border-bottom: none;
}

.no-data {
  text-align: center;
  color: #64748b;
  margin-top: 2rem;
}
</style>

