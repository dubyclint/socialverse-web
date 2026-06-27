// Get detailed experiment results
export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuthenticatedUser(event)
    if (!user.is_admin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      })
    }
    
    const experimentId = getRouterParam(event, 'id')
    const supabase = serverSupabaseServiceRole(event)
    
    // Get experiment details
    const { data: experiment } = await supabase
      .from('incrementality_experiments')
      .select(`
        *,
        ad_campaigns(name, daily_budget)
      `)
      .eq('id', experimentId)
      .single()
    
    if (!experiment) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Experiment not found'
      })
    }
    
    // Get detailed results
    const { data: results } = await supabase
      .from('incrementality_results')
      .select('*')
      .eq('experiment_id', experimentId)
      .single()
    
    // Get event timeline
    const { data: events } = await supabase
      .from('incrementality_events')
      .select('*')
      .eq('experiment_id', experimentId)
      .order('timestamp', { ascending: true })
    
    // Calculate daily metrics
    const dailyMetrics = calculateDailyMetrics(events)
    
    // Generate statistical analysis
    const statisticalAnalysis = generateStatisticalAnalysis(experiment, results, events)
    
    return {
      experiment,
      results,
      dailyMetrics,
      statisticalAnalysis,
      eventCount: events?.length || 0,
      recommendation: generateRecommendation(results)
    }
    
  } catch (error) {
    console.error('Experiment results error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get experiment results'
    })
  }
})

function calculateDailyMetrics(events) {
  if (!events || events.length === 0) return []
  
  const dailyData = new Map()
  
  events.forEach(event => {
    const date = new Date(event.timestamp).toISOString().split('T')[0]
    
    if (!dailyData.has(date)) {
      dailyData.set(date, {
        date,
        control: { impressions: 0, conversions: 0, revenue: 0 },
        treatment: { impressions: 0, conversions: 0, revenue: 0 }
      })
    }
    
    const dayData = dailyData.get(date)
    const group = event.assignment === 'control' ? 'control' : 'treatment'
    
    if (event.event_type === 'impression') {
      dayData[group].impressions++
    } else if (event.event_type === 'conversion') {
      dayData[group].conversions++
      dayData[group].revenue += event.conversion_value || 0
    }
  })
  
  return Array.from(dailyData.values()).sort((a, b) => a.date.localeCompare(b.date))
}

function generateStatisticalAnalysis(experiment, results, events) {
  if (!results) return null
  
  return {
    powerAnalysis: {
      achievedPower: calculateStatisticalPower(results),
      recommendedSampleSize: calculateRecommendedSampleSize(results),
      currentSampleSize: results.control_impressions + results.treatment_impressions
    },
    confidenceIntervals: {
      incrementality: results.confidence_interval,
      revenue: calculateRevenueConfidenceInterval(results)
    },
    effectSize: {
      cohensD: calculateCohensD(results),
      interpretation: interpretEffectSize(calculateCohensD(results))
    },
    recommendations: {
      continueExperiment: results.is_significant ? false : shouldContinueExperiment(results),
      estimatedDaysToSignificance: estimateDaysToSignificance(results),
      minimumDetectableEffect: calculateMinimumDetectableEffect(results)
    }
  }
}

function calculateStatisticalPower(results) {
  // Simplified power calculation
  const effectSize = Math.abs(results.incrementality_rate || 0)
  const sampleSize = results.control_impressions + results.treatment_impressions
  
  // This would use proper statistical power calculation in production
  return Math.min(0.95, effectSize * Math.sqrt(sampleSize) / 100)
}

function generateRecommendation(results) {
  if (!results) return 'Insufficient data for recommendation'
  
  if (results.is_significant) {
    if (results.incrementality_rate > 0.1) {
      return 'Strong positive incrementality detected. Recommend scaling campaign.'
    } else if (results.incrementality_rate > 0) {
      return 'Positive incrementality detected. Consider optimizing campaign.'
    } else {
      return 'Negative incrementality detected. Recommend pausing or restructuring campaign.'
    }
  } else {
    return 'No significant incrementality detected yet. Continue experiment or increase sample size.'
  }
}
