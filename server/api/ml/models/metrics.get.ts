// API endpoint for model metrics
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { getAdminClient } from '~/server/utils/supabase-server'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    if (!user?.is_admin) {
      throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
    }

    // Get ML service instance
    const { MLService } = await import('../../../ml/core/ml-service.ts')

    // This would be a singleton in production
    const mlService = (global as any).mlServiceInstance || new MLService()
    if (!(global as any).mlServiceInstance) {
      await mlService.initialize()
      ;(global as any).mlServiceInstance = mlService
    }

    // Get model metrics
    const modelMetrics = mlService.modelServing.getModelMetrics()

    // Get recent performance data from database (admin client)
    const supabase = await getAdminClient()

    const { data: recentPerformance } = await supabase
      .from('model_performance')
      .select('*')
      .gte('evaluated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('evaluated_at', { ascending: false })
      .limit(100)

    // Get active alerts
    const { data: activeAlerts } = await supabase
      .from('ml_alerts')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20)

    // Calculate performance trends
    const performanceTrends = calculatePerformanceTrends(recentPerformance as any[])

    return {
      currentMetrics: modelMetrics,
      recentPerformance,
      activeAlerts,
      performanceTrends,
      systemHealth: assessSystemHealth(modelMetrics as any, activeAlerts as any[])
    }

  } catch (error: any) {
    console.error('Model metrics error:', error)
    throw createError({ statusCode: 500, statusMessage: error?.message || 'Failed to get model metrics' })
  }
})

function calculatePerformanceTrends(performanceData: any[] = []): Record<string, any> {
  if (!performanceData || performanceData.length < 2) {
    return {}
  }

  const trends: Record<string, any> = {}
  const modelGroups = groupBy(performanceData, 'model_name')

  for (const [modelName, data] of Object.entries(modelGroups)) {
    const sortedData = ((data as any[]) || []).sort((a: any, b: any) => new Date(a.evaluated_at).getTime() - new Date(b.evaluated_at).getTime())

    if (sortedData.length >= 2) {
      const latest = sortedData[sortedData.length - 1]
      const previous = sortedData[sortedData.length - 2]

      trends[modelName as string] = {
        latencyTrend: calculateTrend(previous?.avg_latency, latest?.avg_latency),
        errorTrend: calculateTrend(previous?.error_count, latest?.error_count),
        usageTrend: calculateTrend(previous?.total_predictions, latest?.total_predictions),
        memoryTrend: calculateTrend(previous?.memory_usage, latest?.memory_usage)
      }
    }
  }

  return trends
}

function calculateTrend(previous: any, current: any): number {
  if (!previous || previous === 0) return 0
  return Number(((current - previous) / previous * 100).toFixed(2))
}

function groupBy(array: any[] = [], key: string): Record<string, any[]> {
  return array.reduce((groups: Record<string, any[]>, item: any) => {
    const group = item[key]
    groups[group] = groups[group] || []
    groups[group].push(item)
    return groups
  }, {})
}

function assessSystemHealth(modelMetrics: any = {}, alerts: any[] = []) {
  const criticalAlerts = alerts?.filter((a: any) => a.severity === 'critical').length || 0
  const highAlerts = alerts?.filter((a: any) => a.severity === 'high').length || 0
  
  if (criticalAlerts > 0) return 'critical'
  if (highAlerts > 2) return 'warning'
  
  // Check model availability
  const totalModels = Object.keys(modelMetrics.models || {}).length
  const loadedModels = Object.values(modelMetrics.models || {})
     .filter((m: any) => m.isLoaded).length
  
  if (loadedModels < totalModels * 0.8) return 'warning'
  
  return 'healthy'
}
