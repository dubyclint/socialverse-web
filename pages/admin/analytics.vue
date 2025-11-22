<template>
  <div class="analytics-page">
    <h2>📊 Escrow Analytics</h2>

    <div class="charts">
      <canvas id="volumeChart"></canvas>
      <canvas id="releaseTimeChart"></canvas>
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

onMounted(async () => {
  const res = await fetch('http://localhost:3000/api/escrow/analytics')
  const data = await res.json()

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
})
</script>

<style scoped>
.analytics-page {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
}
.charts {
  display: grid;
  gap: 2rem;
}
canvas {
  max-width: 100%;
}
</style>
