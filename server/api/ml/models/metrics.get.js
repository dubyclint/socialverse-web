// API endpoint for model metrics
export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuthenticatedUser(event)
    if (!user.is_admin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      })
    }

    // Get ML service instance
    const { MLService } = await import('../../ml/core/ml-service.js')
   
    // This would be a singleton in production
    const mlService = global.mlServiceInstance || new MLService()
    if (!global.mlServiceInstance) {
      await mlService.initialize()
      global.mlServiceInstance = mlService
    }

    // Get model metrics
    const modelMetrics = mlService.modelServing.getModelMetrics()
    
    // Get recent performance data from database
    const supabase = serverSupabaseServiceRole(event)
    
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
    const performanceTrends = calculatePerformanceTrends(recentPerformance)
    
    return {
      currentMetrics: modelMetrics,
      recentPerformance,
      activeAlerts,
      performanceTrends,
      systemHealth: assessSystemHealth(modelMetrics, activeAlerts)
    }

  } catch (error) {
    console.error('Model metrics error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get model metrics'
    })
  }
})

function calculatePerformanceTrends(performanceData) {
  if (!performanceData || performanceData.length < 2) {
    return {}
  }

  const trends = {}
  const modelGroups = groupBy(performanceData, 'model_name')
  
  for (const [modelName, data] of Object.entries(modelGroups)) {
    const sortedData = data.sort((a, b) => new Date(a.evaluated_at) - new Date(b.evaluated_at))
    
    if (sortedData.length >= 2) {
      const latest = sortedData[sortedData.length - 1]
      const previous = sortedData[sortedData.length - 2]
      
      trends[modelName] = {
        latencyTrend: calculateTrend(previous.avg_latency, latest.avg_latency),
        errorTrend: calculateTrend(previous.error_count, latest.error_count),
        usageTrend: calculateTrend(previous.total_predictions, latest.total_predictions),
        memoryTrend: calculateTrend(previous.memory_usage, latest.memory_usage)
      }
    }
  }
  
  return trends
}

function calculateTrend(previous, current) {
  if (!previous || previous === 0) return 0
  return ((current - previous) / previous * 100).toFixed(2)
}

function groupBy(array, key) {
  return array.reduce((groups, item) => {
    const group = item[key]
    groups[group] = groups[group] || []
    groups[group].push(item)
    return groups
  }, {})
}

function assessSystemHealth(modelMetrics, alerts) {
  const criticalAlerts = alerts?.filter(a => a.severity === 'critical').length || 0
  const highAlerts = alerts?.filter(a => a.severity === 'high').length || 0
  
  if (criticalAlerts > 0) return 'critical'
  if (highAlerts > 2) return 'warning'
  
  // Check model availability
  const totalModels = Object.keys(modelMetrics.models || {}).length
  const loadedModels = Object.values(modelMetrics.models || {})
    .filter(m => m.isLoaded).length
  
  if (loadedModels < totalModels * 0.8) return 'warning'
  
  return 'healthy'
}
