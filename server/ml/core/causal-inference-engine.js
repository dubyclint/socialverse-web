// Causal Inference Engine - Ghost ads and incrementality measurement
export class CausalInferenceEngine {
  constructor() {
    this.ghostAdConfig = {
      ghostRate: 0.05, // 5% of impressions are ghost ads
      minExperimentSize: 1000, // Minimum users per experiment
      experimentDuration: 14, // Days
      confidenceLevel: 0.95
    }
    
    this.experiments = new Map() // experimentId -> experiment data
    this.userAssignments = new Map() // userId -> experiment assignments
  }

  async initialize() {
    await this.loadActiveExperiments()
    console.log('✅ Causal Inference Engine initialized')
  }

  async getIncrementalityScore(ad, userFeatures) {
    // Get incrementality estimate for this ad/user combination
    const campaignId = ad.campaignId
    const experiment = await this.getOrCreateExperiment(campaignId)
    
    if (!experiment) return 1.0 // Default to no adjustment
    
    // Use historical incrementality data
    const historicalIncrementality = await this.getHistoricalIncrementality(
      campaignId,
      userFeatures
    )
    
    // Adjust based on user segment
    const segmentIncrementality = await this.getSegmentIncrementality(
      campaignId,
      this.getUserSegment(userFeatures)
    )
    
    // Combine estimates with confidence weighting
    const combinedIncrementality = (
      historicalIncrementality * 0.6 +
      segmentIncrementality * 0.4
    )
    
    return Math.max(0.1, Math.min(2.0, combinedIncrementality))
  }

  async shouldShowGhostAd(userId, campaignId) {
    // Determine if user should see ghost ad for incrementality testing
    const experiment = this.experiments.get(campaignId)
    if (!experiment || !experiment.active) return false
    
    // Check if user is in control group
    const assignment = await this.getUserExperimentAssignment(userId, campaignId)
    return assignment === 'control'
  }

  async getUserExperimentAssignment(userId, campaignId) {
    const assignmentKey = `${userId}:${campaignId}`
    
    if (this.userAssignments.has(assignmentKey)) {
      return this.userAssignments.get(assignmentKey)
    }
    
    // Consistent hash-based assignment
    const hash = this.hashUserId(userId, campaignId)
    const assignment = hash < this.ghostAdConfig.ghostRate ? 'control' : 'treatment'
    
    this.userAssignments.set(assignmentKey, assignment)
    return assignment
  }

  async getOrCreateExperiment(campaignId) {
    if (this.experiments.has(campaignId)) {
      return this.experiments.get(campaignId)
    }
    
    // Check if experiment exists in database
    const { data: existingExperiment } = await this.supabase
      .from('incrementality_experiments')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'active')
      .single()
    
    if (existingExperiment) {
      this.experiments.set(campaignId, existingExperiment)
      return existingExperiment
    }
    
    // Create new experiment
    const experiment = await this.createNewExperiment(campaignId)
    this.experiments.set(campaignId, experiment)
    return experiment
  }

  async createNewExperiment(campaignId) {
    const experiment = {
      id: `exp_${campaignId}_${Date.now()}`,
      campaignId,
      startDate: new Date(),
      endDate: new Date(Date.now() + this.ghostAdConfig.experimentDuration * 24 * 60 * 60 * 1000),
      controlRate: this.ghostAdConfig.ghostRate,
      status: 'active',
      minSampleSize: this.ghostAdConfig.minExperimentSize,
      
      // Metrics tracking
      controlGroup: {
        users: 0,
        impressions: 0,
        conversions: 0,
        revenue: 0
      },
      treatmentGroup: {
        users: 0,
        impressions: 0,
        conversions: 0,
        revenue: 0
      }
    }
    
    // Save to database
    await this.supabase
      .from('incrementality_experiments')
      .insert(experiment)
    
    console.log(`Created incrementality experiment for campaign ${campaignId}`)
    return experiment
  }

  async recordImpression(userId, campaignId, isGhost = false) {
    const experiment = this.experiments.get(campaignId)
    if (!experiment) return
    
    const assignment = await this.getUserExperimentAssignment(userId, campaignId)
    
    const impressionData = {
      experimentId: experiment.id,
      userId,
      campaignId,
      assignment,
      isGhost,
      timestamp: new Date().toISOString(),
      eventType: 'impression'
    }
    
    // Log impression event
    await this.supabase
      .from('incrementality_events')
      .insert(impressionData)
    
    // Update experiment metrics
    if (assignment === 'control') {
      experiment.controlGroup.impressions++
    } else {
      experiment.treatmentGroup.impressions++
    }
  }

  async recordConversion(userId, campaignId, conversionValue = 0) {
    const experiment = this.experiments.get(campaignId)
    if (!experiment) return
    
    const assignment = await this.getUserExperimentAssignment(userId, campaignId)
    
    const conversionData = {
      experimentId: experiment.id,
      userId,
      campaignId,
      assignment,
      conversionValue,
      timestamp: new Date().toISOString(),
      eventType: 'conversion'
    }
    
    // Log conversion event
    await this.supabase
      .from('incrementality_events')
      .insert(conversionData)
    
    // Update experiment metrics
    if (assignment === 'control') {
      experiment.controlGroup.conversions++
      experiment.controlGroup.revenue += conversionValue
    } else {
      experiment.treatmentGroup.conversions++
      experiment.treatmentGroup.revenue += conversionValue
    }
  }

  async calculateIncrementality(campaignId) {
    const experiment = this.experiments.get(campaignId)
    if (!experiment) return null
    
    const { controlGroup, treatmentGroup } = experiment
    
    // Calculate conversion rates
    const controlCVR = controlGroup.impressions > 0 
      ? controlGroup.conversions / controlGroup.impressions 
      : 0
    
    const treatmentCVR = treatmentGroup.impressions > 0 
      ? treatmentGroup.conversions / treatmentGroup.impressions 
      : 0
    
    // Calculate incrementality
    const incrementalConversions = treatmentCVR - controlCVR
    const incrementalityRate = controlCVR > 0 ? incrementalConversions / controlCVR : 0
    
    // Statistical significance test
    const significance = this.calculateStatisticalSignificance(
      controlGroup,
      treatmentGroup
    )
    
    // Revenue incrementality
    const controlRPM = controlGroup.impressions > 0 
      ? controlGroup.revenue / controlGroup.impressions * 1000 
      : 0
    
    const treatmentRPM = treatmentGroup.impressions > 0 
      ? treatmentGroup.revenue / treatmentGroup.impressions * 1000 
      : 0
    
    const revenueIncrementality = treatmentRPM - controlRPM
    
    return {
      campaignId,
      experimentId: experiment.id,
      
      // Conversion metrics
      controlCVR,
      treatmentCVR,
      incrementalConversions,
      incrementalityRate,
      
      // Revenue metrics
      controlRPM,
      treatmentRPM,
      revenueIncrementality,
      
      // Statistical metrics
      pValue: significance.pValue,
      isSignificant: significance.isSignificant,
      confidenceInterval: significance.confidenceInterval,
      
      // Sample sizes
      controlImpressions: controlGroup.impressions,
      treatmentImpressions: treatmentGroup.impressions,
      
      // Experiment metadata
      startDate: experiment.startDate,
      daysRunning: Math.floor((Date.now() - new Date(experiment.startDate)) / (1000 * 60 * 60 * 24))
    }
  }

  calculateStatisticalSignificance(controlGroup, treatmentGroup) {
    // Two-proportion z-test for statistical significance
    const n1 = controlGroup.impressions
    const n2 = treatmentGroup.impressions
    const x1 = controlGroup.conversions
    const x2 = treatmentGroup.conversions
    
    if (n1 === 0 || n2 === 0) {
      return { pValue: 1.0, isSignificant: false, confidenceInterval: [0, 0] }
    }
    
    const p1 = x1 / n1
    const p2 = x2 / n2
    const pPooled = (x1 + x2) / (n1 + n2)
    
    // Standard error
    const se = Math.sqrt(pPooled * (1 - pPooled) * (1/n1 + 1/n2))
    
    if (se === 0) {
      return { pValue: 1.0, isSignificant: false, confidenceInterval: [0, 0] }
    }
    
    // Z-score
    const z = (p2 - p1) / se
    
    // P-value (two-tailed test)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(z)))
    
    // Confidence interval for difference
    const seDiff = Math.sqrt(p1 * (1 - p1) / n1 + p2 * (1 - p2) / n2)
    const zCritical = 1.96 // 95% confidence
    const diff = p2 - p1
    const marginOfError = zCritical * seDiff
    
    return {
      pValue,
      isSignificant: pValue < (1 - this.ghostAdConfig.confidenceLevel),
      confidenceInterval: [diff - marginOfError, diff + marginOfError],
      zScore: z
    }
  }

  normalCDF(x) {
    // Approximation of normal cumulative distribution function
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)))
  }

  erf(x) {
    // Approximation of error function
    const a1 =  0.254829592
    const a2 = -0.284496736
    const a3 =  1.421413741
    const a4 = -1.453152027
    const a5 =  1.061405429
    const p  =  0.3275911
    
    const sign = x >= 0 ? 1 : -1
    x = Math.abs(x)
    
    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
    
    return sign * y
  }

  async getHistoricalIncrementality(campaignId, userFeatures) {
    // Get historical incrementality data for similar campaigns/users
    const { data: historicalData } = await this.supabase
      .from('incrementality_results')
      .select('incrementality_rate')
      .eq('campaign_id', campaignId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (!historicalData || historicalData.length === 0) {
      return 1.0 // Default assumption: ads are fully incremental
    }
    
    // Weighted average of recent experiments
    const weights = historicalData.map((_, index) => Math.pow(0.8, index)) // Decay older results
    const weightedSum = historicalData.reduce((sum, result, index) => 
      sum + result.incrementality_rate * weights[index], 0
    )
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
    
    return weightedSum / totalWeight
  }

  async getSegmentIncrementality(campaignId, userSegment) {
    // Get incrementality for specific user segments
    const { data: segmentData } = await this.supabase
      .from('incrementality_by_segment')
      .select('incrementality_rate')
      .eq('campaign_id', campaignId)
      .eq('user_segment', userSegment)
      .single()
    
    return segmentData?.incrementality_rate || 1.0
  }

  getUserSegment(userFeatures) {
    // Segment users for incrementality analysis
    if (userFeatures.ad_conversions_last_30d > 2) return 'high_converter'
    if (userFeatures.ad_clicks_last_7d > 5) return 'high_clicker'
    if (userFeatures.follower_count > 1000) return 'influencer'
    if (userFeatures.session_count_today > 5) return 'power_user'
    return 'regular_user'
  }

  hashUserId(userId, campaignId) {
    // Consistent hash for user assignment
    const str = `${userId}:${campaignId}`
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash) / Math.pow(2, 31) // Normalize to [0, 1)
  }

  async loadActiveExperiments() {
    const { data: experiments } = await this.supabase
      .from('incrementality_experiments')
      .select('*')
      .eq('status', 'active')
    
    if (experiments) {
      experiments.forEach(exp => {
        this.experiments.set(exp.campaignId, exp)
      })
    }
  }

  // Advanced causal inference methods
  async runInstrumentalVariableAnalysis(campaignId) {
    // Instrumental Variable analysis for unmeasured confounding
    // Uses random assignment as instrument
    const { data: events } = await this.supabase
      .from('incrementality_events')
      .select(`
        user_id,
        assignment,
        event_type,
        conversion_value,
        timestamp
      `)
      .eq('campaign_id', campaignId)
    
    if (!events || events.length < 1000) {
      return { error: 'Insufficient data for IV analysis' }
    }
    
    // Two-stage least squares estimation
    const firstStage = this.estimateFirstStage(events)
    const secondStage = this.estimateSecondStage(events, firstStage)
    
    return {
      instrumentalVariableEstimate: secondStage.coefficient,
      standardError: secondStage.standardError,
      pValue: secondStage.pValue,
      firstStageF: firstStage.fStatistic
    }
  }

  estimateFirstStage(events) {
    // First stage: regress treatment on instrument (random assignment)
    // This is trivial since assignment IS the treatment, but included for completeness
    return {
      coefficient: 1.0,
      fStatistic: Infinity // Perfect instrument
    }
  }

  estimateSecondStage(events, firstStage) {
    // Second stage: regress outcome on predicted treatment
    const conversions = events.filter(e => e.event_type === 'conversion')
    const impressions = events.filter(e => e.event_type === 'impression')
    
    // Group by user
    const userOutcomes = new Map()
    
    impressions.forEach(imp => {
      if (!userOutcomes.has(imp.user_id)) {
        userOutcomes.set(imp.user_id, {
          treatment: imp.assignment === 'treatment' ? 1 : 0,
          conversions: 0,
          revenue: 0
        })
      }
    })
    
    conversions.forEach(conv => {
      const user = userOutcomes.get(conv.user_id)
      if (user) {
        user.conversions++
        user.revenue += conv.conversion_value || 0
      }
    })
    
    // Simple OLS estimation
    const users = Array.from(userOutcomes.values())
    const n = users.length
    
    if (n < 100) {
      return { coefficient: 0, standardError: Infinity, pValue: 1 }
    }
    
    const meanTreatment = users.reduce((sum, u) => sum + u.treatment, 0) / n
    const meanOutcome = users.reduce((sum, u) => sum + u.conversions, 0) / n
    
    let numerator = 0
    let denominator = 0
    
    users.forEach(user => {
      const treatmentDiff = user.treatment - meanTreatment
      const outcomeDiff = user.conversions - meanOutcome
      numerator += treatmentDiff * outcomeDiff
      denominator += treatmentDiff * treatmentDiff
    })
    
    const coefficient = denominator !== 0 ? numerator / denominator : 0
    
    // Calculate standard error
    let residualSumSquares = 0
    users.forEach(user => {
      const predicted = meanOutcome + coefficient * (user.treatment - meanTreatment)
      const residual = user.conversions - predicted
      residualSumSquares += residual * residual
    })
    
    const mse = residualSumSquares / (n - 2)
    const standardError = Math.sqrt(mse / denominator)
    
    const tStatistic = coefficient / standardError
    const pValue = 2 * (1 - this.tCDF(Math.abs(tStatistic), n - 2))
    
    return {
      coefficient,
      standardError,
      pValue,
      tStatistic
    }
  }

  tCDF(t, df) {
    // Approximation of t-distribution CDF
    // For large df, approaches normal distribution
    if (df > 30) {
      return this.normalCDF(t)
    }
    
    // Simple approximation for smaller df
    const x = t / Math.sqrt(df)
    return 0.5 + 0.5 * this.erf(x / Math.sqrt(2))
  }

  // Synthetic control method for causal inference
  async runSyntheticControlAnalysis(campaignId, treatmentStartDate) {
    // Create synthetic control group from similar campaigns
    const { data: campaigns } = await this.supabase
      .from('ad_campaigns')
      .select(`
        id,
        daily_budget,
        targeting_rules,
        performance_metrics
      `)
      .neq('id', campaignId)
      .eq('status', 'active')
    
    if (!campaigns || campaigns.length < 5) {
      return { error: 'Insufficient control campaigns' }
    }
    
    // Find campaigns with similar characteristics
    const similarCampaigns = this.findSimilarCampaigns(campaignId, campaigns)
    
    // Construct synthetic control using weighted combination
    const weights = await this.optimizeSyntheticWeights(
      campaignId,
      similarCampaigns,
      treatmentStartDate
    )
    
    // Calculate treatment effect
    const treatmentEffect = await this.calculateSyntheticTreatmentEffect(
      campaignId,
      similarCampaigns,
      weights,
      treatmentStartDate
    )
    
    return {
      treatmentEffect,
      weights,
      controlCampaigns: similarCampaigns.map(c => c.id),
      syntheticControlFit: treatmentEffect.pretreatmentFit
    }
  }

  findSimilarCampaigns(targetCampaignId, campaigns) {
    // Find campaigns with similar targeting and budget characteristics
    // This would use more sophisticated similarity metrics in production
    return campaigns.slice(0, 10) // Simplified
  }

  async optimizeSyntheticWeights(targetId, controlCampaigns, treatmentDate) {
    // Optimize weights to minimize pre-treatment prediction error
    // This would use quadratic programming in production
    const numControls = controlCampaigns.length
    const equalWeight = 1 / numControls
    
    return controlCampaigns.map(() => equalWeight) // Simplified equal weighting
  }

  async calculateSyntheticTreatmentEffect(targetId, controls, weights, treatmentDate) {
    // Calculate difference between actual and synthetic control outcomes
    return {
      averageTreatmentEffect: 0.15, // Placeholder
      pretreatmentFit: 0.95,
      postTreatmentPeriods: 14,
      significanceLevel: 0.05
    }
  }
}
```](streamdown:incomplete-link)
