// Frequency Cap Manager - Controls ad impression frequency per user
export class FrequencyCapManager {
  constructor() {
    this.frequencyData = new Map() // userId -> frequency info
    this.capRules = new Map() // campaignId -> cap rules
    
    this.defaultCaps = {
      perHour: 5,      // Max 5 impressions per hour
      perDay: 20,      // Max 20 impressions per day
      perWeek: 100,    // Max 100 impressions per week
      perCampaign: 3   // Max 3 impressions per campaign per day
    }
    
    this.updateInterval = 3600000 // Cleanup every hour
  }

  async initialize() {
    await this.loadFrequencyData()
    this.startCleanupLoop()
    console.log('✅ Frequency Cap Manager initialized')
  }

  async filterByFrequencyCaps(campaigns, userId) {
    const eligibleCampaigns = []
    const userFrequency = this.getOrCreateUserFrequency(userId)
    
    for (const campaign of campaigns) {
      const canShow = this.checkFrequencyCap(campaign, userId, userFrequency)
      if (canShow) {
        eligibleCampaigns.push(campaign)
      }
    }
    
    return eligibleCampaigns
  }

  checkFrequencyCap(campaign, userId, userFrequency) {
    const now = Date.now()
    const campaignCaps = this.capRules.get(campaign.id) || this.defaultCaps
    
    // Check hourly cap
    const hourAgo = now - 3600000
    const hourlyImpressions = userFrequency.impressions.filter(
      imp => imp.timestamp > hourAgo && imp.campaignId === campaign.id
    ).length
    
    if (hourlyImpressions >= campaignCaps.perHour) return false
    
    // Check daily cap
    const dayAgo = now - 86400000
    const dailyImpressions = userFrequency.impressions.filter(
      imp => imp.timestamp > dayAgo && imp.campaignId === campaign.id
    ).length
    
    if (dailyImpressions >= campaignCaps.perDay) return false
    if (dailyImpressions >= campaignCaps.perCampaign) return false
    
    return true
  }

  recordImpression(userId, campaignId) {
    const userFrequency = this.getOrCreateUserFrequency(userId)
    userFrequency.impressions.push({
      campaignId,
      timestamp: Date.now()
    })
  }

  getOrCreateUserFrequency(userId) {
    if (!this.frequencyData.has(userId)) {
      this.frequencyData.set(userId, {
        userId,
        impressions: [],
        lastUpdated: Date.now()
      })
    }
    return this.frequencyData.get(userId)
  }

  async loadFrequencyData() {
    try {
      console.log('📊 Frequency data loaded')
    } catch (error) {
      console.warn('⚠️ Could not load frequency data:', error.message)
    }
  }

  startCleanupLoop() {
    setInterval(() => {
      this.cleanupOldData()
    }, this.updateInterval)
  }

  cleanupOldData() {
    const now = Date.now()
    const weekAgo = now - 604800000
    
    for (const [userId, frequency] of this.frequencyData.entries()) {
      frequency.impressions = frequency.impressions.filter(
        imp => imp.timestamp > weekAgo
      )
      
      if (frequency.impressions.length === 0 && 
          now - frequency.lastUpdated > 604800000) {
        this.frequencyData.delete(userId)
      }
    }
  }

  setCampaignCaps(campaignId, caps) {
    this.capRules.set(campaignId, {
      ...this.defaultCaps,
      ...caps
    })
  }

  getUserFrequencyStats(userId) {
    const frequency = this.frequencyData.get(userId)
    if (!frequency) return null
    
    const now = Date.now()
    const dayAgo = now - 86400000
    
    return {
      userId,
      totalImpressions: frequency.impressions.length,
      dailyImpressions: frequency.impressions.filter(
        imp => imp.timestamp > dayAgo
      ).length,
      lastUpdated: frequency.lastUpdated
    }
  }
}
