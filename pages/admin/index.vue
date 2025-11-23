<template>
  <div class="admin-dashboard">
    <!-- Main Dashboard Components -->
    <div class="dashboard-grid">
      <adminuserlist />
      <adminpostmoderation />
      <adminmatchapproval />
      <adminescrowactioncontrol />
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
import adminescrowactioncontrol from '@/components/admin/escrow-action-control.vue'
import adminfeemanager from '@/components/admin/fee-manager.vue'

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
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.analytics-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}
</style>

