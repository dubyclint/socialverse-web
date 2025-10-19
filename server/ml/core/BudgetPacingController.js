// Budget Pacing Controller - PID-based budget pacing for smooth ad spend
export class BudgetPacingController {
  constructor() {
    this.pacingData = new Map() // campaignId -> pacing info
    
    // PID Controller parameters
    this.pidConfig = {
      kp: 0.8,  // Proportional gain
      ki: 0.2,  // Integral gain  
      kd: 0.1,  // Derivative gain
      maxOutput: 3.0,  // Max pacing multiplier
      minOutput: 0.1   // Min pacing multiplier
    }
    
    this.updateInterval = 60000 // Update pacing every minute
  }

  async initialize() {
    // Load existing pacing data
    await this.loadPacingData()
    
    // Start pacing update loop
    this.startPacingLoop()
    
    console.log('✅ Budget Pacing Controller initialized')
  }

  async filterByBudgetPacing(campaigns) {
    const eligibleCampaigns = []
    
    for (const campaign of campaigns) {
      const pacingStatus = this.getPacingStatus(campaign.id)
      
      if (pacingStatus !== 'PAUSED_OVERSPEND') {
        eligibleCampaigns.push(campaign)
      }
    }
    
    return eligibleCampaigns
  }

  getPacingStatus(campaignId) {
    const pacing = this.pacingData.get(campaignId)
    if (!pacing) return 'UNKNOWN'
    
    if (pacing.multiplier < 0.1) return 'PAUSED_OVERSPEND'
    if (pacing.multiplier < 0.5) return 'THROTTLED'
    if (pacing.multiplier > 1.5) return 'ACCELERATED'
    return 'NORMAL'
  }

  async getPacingMultiplier(campaignId) {
    let pacing = this.pacingData.get(campaignId)
    
    if (!pacing) {
      pacing = await this.initializeCampaignPacing(campaignId)
    }
    
    return Math.max(pacing.multiplier, this.pidConfig.minOutput)
  }

  async recordSpend(campaignId, amount) {
    const pacing = this.pacingData.get(campaignId)
    if (!pacing) return
    
    pacing.actualSpend += amount
    pacing.lastSpendTime = Date.now()
    
    // Update pacing immediately for large spends
    if (amount > pacing.dailyBudget * 0.1) {
      await this.updateCampaignPacing(campaignId)
    }
  }

  async initializeCampaignPacing(campaignId) {
    // Get campaign budget info
    const { data: campaign } = await this.supabase
      .from('ad_campaigns')
      .select('daily_budget, total_budget, start_date, end_date')
      .eq('id', campaignId)
      .single()

    if (!campaign) return { multiplier: 1.0 }

    const now = new Date()
    const startDate = new Date(campaign.start_date)
    const endDate = new Date(campaign.end_date)
    
    // Calculate time-based pacing targets
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
    const daysSinceStart = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24))
    const hoursIntoToday = now.getHours() + now.getMinutes() / 60
    
    const pacing = {
      campaignId,
      dailyBudget: campaign.daily_budget,
      totalBudget: campaign.total_budget,
      actualSpend: 0,
      targetSpend: (campaign.daily_budget * hoursIntoToday) / 24,
      multiplier: 1.0,
      
      // PID controller state
      previousError: 0,
      integral: 0,
      lastUpdate: Date.now(),
      
      // Metadata
      totalDays,
      daysSinceStart,
      lastSpendTime: null
    }
    
    // Get actual spend for today
    pacing.actualSpend = await this.getTodaySpend(campaignId)
    
    this.pacingData.set(campaignId, pacing)
    return pacing
  }

  async updateCampaignPacing(campaignId) {
    const pacing = this.pacingData.get(campaignId)
    if (!pacing) return

    const now = Date.now()
    const dt = (now - pacing.lastUpdate) / (1000 * 60) // Delta time in minutes
    
    if (dt < 1) return // Don't update too frequently

    // Calculate current target spend (linear pacing throughout the day)
    const hoursIntoToday = new Date().getHours() + new Date().getMinutes() / 60
    const targetSpend = (pacing.dailyBudget * hoursIntoToday) / 24
    
    // PID Controller calculation
    const error = targetSpend - pacing.actualSpend
    const proportional = error
    
    pacing.integral += error * dt
    const integral = pacing.integral
    
    const derivative = (error - pacing.previousError) / dt
    
    // PID output (pacing multiplier)
    let output = (
      this.pidConfig.kp * proportional +
      this.pidConfig.ki * integral +
      this.pidConfig.kd * derivative
    )
    
    // Normalize output to multiplier range
    output = 1.0 + (output / pacing.dailyBudget) * 2.0
    
    // Clamp output
    pacing.multiplier = Math.max(
      this.pidConfig.minOutput,
      Math.min(this.pidConfig.maxOutput, output)
    )
    
    // Update state
    pacing.previousError = error
    pacing.lastUpdate = now
    pacing.targetSpend = targetSpend
    
    // Special cases
    if (pacing.actualSpend >= pacing.dailyBudget * 1.1) {
      // 10% overspend - pause campaign
      pacing.multiplier = 0.0
    } else if (pacing.actualSpend >= pacing.dailyBudget) {
      // At budget - slow down significantly
      pacing.multiplier = Math.min(pacing.multiplier, 0.2)
    }
    
    // Log pacing adjustment
    console.log(`Pacing update for campaign ${campaignId}:`, {
      targetSpend: targetSpend.toFixed(2),
      actualSpend: pacing.actualSpend.toFixed(2),
      error: error.toFixed(2),
      multiplier: pacing.multiplier.toFixed(2)
    })
  }

  startPacingLoop() {
    setInterval(async () => {
      const campaignIds = Array.from(this.pacingData.keys())
      
      await Promise.all(
        campaignIds.map(campaignId => this.updateCampaignPacing(campaignId))
      )
    }, this.updateInterval)
  }

  async getTodaySpend(campaignId) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data } = await this.supabase
      .from('ad_spend_log')
      .select('amount')
      .eq('campaign_id', campaignId)
      .gte('created_at', today.toISOString())
    
    return data?.reduce((sum, record) => sum + record.amount, 0) || 0
  }

  async loadPacingData() {
    // Load active campaigns and initialize pacing
    const { data: campaigns } = await this.supabase
      .from('ad_campaigns')
      .select('id')
      .eq('status', 'active')
    
    if (campaigns) {
      await Promise.all(
        campaigns.map(campaign => this.initializeCampaignPacing(campaign.id))
      )
    }
  }
}
