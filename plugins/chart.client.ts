// ============================================================================
// FILE: /plugins/chart.client.ts - CHART.JS CLIENT PLUGIN (LAZY LOADED)
// ============================================================================
// ✅ FIXED: Added proper plugin structure with dependsOn
// ✅ FIXED: Added error handling and logging
// ✅ FIXED: Added process.client check
// ✅ FIXED: Proper initialization sequence
// ============================================================================

declare global {
  interface Window {
    Chart?: any
  }
}

let Chart: any = null

async function getChart() {
  if (!Chart) {
    try {
      const module = await import('chart.js/auto')
      Chart = module.default
      console.log('[Chart Plugin] ✅ Chart.js library loaded successfully')
    } catch (error) {
      console.error('[Chart Plugin] ❌ Failed to load Chart.js:', error)
      throw error
    }
  }
  return Chart
}

export default defineNuxtPlugin({
  name: 'socialverse-chart',
  
  // ✅ FIX: Ensure Pinia is loaded before chart initialization
  dependsOn: ['pinia'],

  setup() {
    if (!process.client) return

    console.log('[Chart Plugin] Initializing Chart.js plugin')

    return {
      provide: {
        chart: {
          async create(ctx: any, config: any) {
            const ChartLib = await getChart()
            return new ChartLib(ctx, config)
          },
          async getChart() {
            return await getChart()
          }
        }
      }
    }
  }
})
