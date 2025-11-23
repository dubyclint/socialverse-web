<template>
  <div class="admin-dashboard">
    <!-- Main Dashboard Components -->
    <div class="dashboard-grid">
      <adminuserlist />
      <adminpostmoderation />
      <adminmatchapproval />
      <adminescrowcontrol />
      <adminfeemanager />
    </div>

    <!-- Escrow Analytics Section -->
    <div class="analytics-section">
      <h2>📊 Escrow Analytics</h2>
      <div class="charts">
        <canvas id="volumeChart"></canvas>
        <canvas id="releaseTimeChart"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['route-guard', 'language-check', 'security-middleware'],
  layout: 'default'
})

import { onMounted } from 'vue'
import Chart from 'chart.js/auto'
import adminuserlist from '@/components/admin/user-list.vue'
import adminpostmoderation from '@/components/admin/post-moderation.vue'
import adminmatchapproval from '@/components/admin/match-approval.vue'
import adminescrowcontrol from '@/components/admin/escrow-control.vue'
import adminfeeManager from '@/components/admin/fee-manager.vue'

onMounted(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/escrow/analytics')
    const data = await res.json()

    // Volume Chart
    new Chart(document.getElementById('volumeChart'), {
      type: 'bar',
      data: {
        labels: data.months,
        datasets: [{
          label: 'Total Escrowed (USDC)',
          data: data.volume,
          backgroundColor: '#4f46e5'
        }]
      }
    })

    // Release Time Chart
    new Chart(document.getElementById('releaseTimeChart'), {
      type: 'line',
      data: {
        labels: data.months,
        datasets: [{
          label: 'Avg Time to Release (hrs)',
          data: data.releaseTime,
          borderColor: '#10b981',
          fill: false
        }]
      }
    })
  } catch (error) {
    console.error('Failed to load analytics:', error)
  }
})
</script>

<style scoped>
.admin-dashboard {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.analytics-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.analytics-section h2 {
  margin-bottom: 2rem;
  color: #1f2937;
}

.charts {
  display: grid;
  gap: 2rem;
}

canvas {
  max-width: 100%;
}

@media (max-width: 768px) {
  .admin-dashboard {
    padding: 1rem;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .charts {
    gap: 1rem;
  }
}
</style>

