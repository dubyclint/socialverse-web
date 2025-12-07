// ============================================================================
// plugins/chart.client.ts - CHART.JS CLIENT PLUGIN (LAZY LOADED)
// ============================================================================

declare global {
  interface Window {
    Chart?: any
  }
}

let Chart: any = null;

async function getChart() {
  if (!Chart) {
    const module = await import('chart.js/auto');
    Chart = module.default;
  }
  return Chart;
}

export default defineNuxtPlugin(() => {
  return {
    provide: {
      chart: {
        async create(ctx: any, config: any) {
          const ChartLib = await getChart();
          return new ChartLib(ctx, config);
        },
        async getChart() {
          return await getChart();
        }
      }
    }
  }
})
