// ============================================================================
// plugins/chart.client.ts - CHART.JS CLIENT PLUGIN
// ============================================================================
// This plugin initializes Chart.js for data visualization
// Place this file at: /plugins/chart.client.ts

import Chart from 'chart.js/auto'

declare global {
  interface Window {
    Chart?: typeof Chart
  }
}

export default defineNuxtPlugin(() => {
  // Register Chart.js globally
  if (process.client) {
    window.Chart = Chart
  }

  // Configure Chart.js defaults
  Chart.defaults.font.family = "'Inter', 'Helvetica', 'Arial', sans-serif"
  Chart.defaults.color = '#6B7280'
  Chart.defaults.borderColor = '#E5E7EB'

  // Set responsive options
  Chart.defaults.responsive = true
  Chart.defaults.maintainAspectRatio = true

  // Provide Chart to all components
  return {
    provide: {
      Chart
    }
  }
})
