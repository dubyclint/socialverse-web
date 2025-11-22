// Ad Auction Engine - Real-time bidding with sophisticated pacing and optimization
import { BudgetPacingController } from './budget-pacing-controller.js'
import { FrequencyCapManager } from './frequency-cap-manager.js'

export class AdAuctionEngine {
  constructor() {
    this.budgetPacer = new BudgetPacingController()
    this.frequencyCapManager = new FrequencyCapManager()
    
    this.auctionConfig = {
      auctionType: 'GSP', // Generalized Second Price
      reservePrice: 0.01, // Minimum bid in USD
      maxAdsPerAuction: 10,
      bidFloor: 0.005,
      timeoutMs: 50, // Max auction time
      qualityThreshold: 0.3
    }
    
    // Real-time auction metrics
    this.metrics = {
      auctionsRun: 0,
      totalRevenue: 0,
      avgAuctionTime: 0,
      fillRate: 0
    }
  }

  async initialize() {
    await Promise.all([
      this.budgetPacer.initialize(),
      this.frequencyCapManager.initialize()
    ])
    console.log('✅ Ad Auction Engine initialized')
  }

  async runAuction(userId, userFeatures, contextFeatures) {
    const auctionStart = Date.now()
    
    try {
      // 1. Get eligible ad campaigns
      const eligibleCampaigns = await this.getEligibleCampaigns(
        userId, 
        userFeatures, 
        contextFeatures
      )

      if (eligibleCampaigns.length === 0) {
        return []
      }

      // 2. Apply frequency capping
      const frequencyFilteredCampaigns = await this.frequencyCapManager
        .filterByFrequencyCaps(eligibleCampaigns, userId)

      // 3. Apply budget pacing
      const budgetFilteredCampaigns = await this.budgetPacer
        .filterByBudgetPacing(frequencyFilteredCampaigns)

      // 4. Generate bids for each campaign
      const bids = await this.generateBids(
        budgetFilteredCampaigns,
        userFeatures,
        contextFeatures
      )

      // 5. Run the auction mechanism
      const auctionResults = await this.conductAuction(bids, userFeatures)

      // 6. Update pacing and frequency caps
      await this.updatePostAuction(auctionResults, userId)

      // 7. Log auction metrics
      await this.logAuctionMetrics(auctionStart, auctionResults)

      return auctionResults.winningAds || []

    } catch (error) {
      console.error('Auction error:', error)
      return []
    }
  }

  async getEligibleCampaigns(userId, userFeatures, contextFeatures) {
    // Complex targeting logic
    const targetingCriteria = {
      age: userFeatures.age_group,
      location: contextFeatures.location,
      interests: userFeatures.top_categories,
      device: contextFeatures.deviceType,
      time: contextFeatures.hour
    }

    // Query active campaigns with targeting match
    const { data: campaigns } = await this.supabase
      .from('ad_campaigns')
      .select(`
        *,
        ads(*),
        targeting_rules(*),
        budget_info(*)
      `)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())

    // Filter by targeting rules
    const eligibleCampaigns = campaigns.filter(campaign => 
      this.matchesTargeting(campaign.targeting_rules, targetingCriteria)
    )

    // Apply additional eligibility checks
    return eligibleCampaigns.filter(campaign => 
      this.isEligibleForAuction(campaign, userId, userFeatures)
    )
  }

  matchesTargeting(targetingRules, userCriteria) {
    if (!targetingRules) return true

    // Age targeting
    if (targetingRules.age_groups && 
        !targetingRules.age_groups.includes(userCriteria.age)) {
      return false
    }

    // Location targeting
    if (targetingRules.locations && userCriteria.location &&
        !targetingRules.locations.includes(userCriteria.location)) {
      return false
    }

    // Interest targeting
    if (targetingRules.interests && userCriteria.interests) {
      const hasMatchingInterest = targetingRules.interests.some(interest =>
        userCriteria.interests.includes(interest)
      )
      if (!hasMatchingInterest) return false
    }

    // Device targeting
    if (targetingRules.devices && 
        !targetingRules.devices.includes(userCriteria.device)) {
      return false
    }

    // Time targeting
    if (targetingRules.hours && 
        !targetingRules.hours.includes(userCriteria.time)) {
      return false
    }

    return true
  }

  isEligibleForAuction(campaign, userId, userFeatures) {
    // Check if campaign has remaining budget
    if (campaign.budget_info.remaining_budget <= 0) return false

    // Check if user is in campaign's exclusion list
    if (campaign.excluded_users?.includes(userId)) return false

    // Check campaign quality score threshold
    if (campaign.quality_score < this.auctionConfig.qualityThreshold) return false

    // Check if campaign is pacing correctly (not overspending)
    const pacingStatus = this.budgetPacer.getPacingStatus(campaign.id)
    if (pacingStatus === 'PAUSED_OVERSPEND') return false

    return true
  }

  async generateBids(campaigns, userFeatures, contextFeatures) {
    const bids = await Promise.all(
      campaigns.map(async (campaign) => {
        // Base bid from campaign settings
        let bidAmount = campaign.base_bid

        // Apply bid modifiers based on targeting match quality
        const targetingScore = this.calculateTargetingScore(
          campaign.targeting_rules, 
          userFeatures, 
          contextFeatures
        )
        bidAmount *= (1 + targetingScore * 0.5) // Up to 50% bid increase

        // Apply predicted performance modifiers
        const predictedCTR = await this.predictCTR(campaign, userFeatures)
        const predictedCVR = await this.predictCVR(campaign, userFeatures)
        
        // Value-based bidding: bid = value * probability
        const expectedValue = campaign.target_cpa * predictedCVR
        bidAmount = Math.min(bidAmount, expectedValue * predictedCTR)

        // Apply budget pacing modifier
        const pacingMultiplier = await this.budgetPacer.getPacingMultiplier(campaign.id)
        bidAmount *= pacingMultiplier

        // Apply competitive intelligence
        const competitiveMultiplier = await this.getCompetitiveMultiplier(
          campaign, 
          contextFeatures
        )
        bidAmount *= competitiveMultiplier

        return {
          campaignId: campaign.id,
          adId: campaign.ads[0]?.id, // Simplified - would select best ad
          bidAmount: Math.max(bidAmount, this.auctionConfig.bidFloor),
          qualityScore: campaign.quality_score,
          predictedCTR,
          predictedCVR,
          campaign,
          effectiveBid: bidAmount * campaign.quality_score // Quality-adjusted bid
        }
      })
    )

    return bids.filter(bid => bid.bidAmount >= this.auctionConfig.reservePrice)
  }

  async conductAuction(bids, userFeatures) {
    if (bids.length === 0) {
      return { winningAds: [], revenue: 0 }
    }

    // Sort by effective bid (bid * quality score) - highest first
    const sortedBids = bids.sort((a, b) => b.effectiveBid - a.effectiveBid)

    // Generalized Second Price (GSP) auction
    const winners = []
    let totalRevenue = 0

    for (let i = 0; i < Math.min(sortedBids.length, this.auctionConfig.maxAdsPerAuction); i++) {
      const winningBid = sortedBids[i]
      
      // Second price: winner pays the next highest bid (or reserve price)
      const secondPrice = i + 1 < sortedBids.length 
        ? sortedBids[i + 1].effectiveBid 
        : this.auctionConfig.reservePrice

      const actualPrice = Math.max(secondPrice, this.auctionConfig.reservePrice)

      winners.push({
        ...winningBid.campaign.ads[0],
        campaignId: winningBid.campaignId,
        bidAmount: winningBid.bidAmount,
        actualPrice,
        position: i + 1,
        qualityScore: winningBid.qualityScore,
        predictedCTR: winningBid.predictedCTR,
        predictedCVR: winningBid.predictedCVR,
        type: 'ad',
        auctionId: this.generateAuctionId()
      })

      totalRevenue += actualPrice
    }

    return {
      winningAds: winners,
      revenue: totalRevenue,
      participatingBids: bids.length,
      fillRate: winners.length / this.auctionConfig.maxAdsPerAuction
    }
  }

  calculateTargetingScore(targetingRules, userFeatures, contextFeatures) {
    let score = 0
    let maxScore = 0

    // Age match
    if (targetingRules.age_groups) {
      maxScore += 1
      if (targetingRules.age_groups.includes(userFeatures.age_group)) {
        score += 1
      }
    }

    // Interest match
    if (targetingRules.interests && userFeatures.top_categories) {
      maxScore += 2
      const matchingInterests = targetingRules.interests.filter(interest =>
        userFeatures.top_categories.includes(interest)
      ).length
      score += Math.min(matchingInterests / targetingRules.interests.length * 2, 2)
    }

    // Location match
    if (targetingRules.locations) {
      maxScore += 1
      if (targetingRules.locations.includes(contextFeatures.location)) {
        score += 1
      }
    }

    return maxScore > 0 ? score / maxScore : 0
  }

  async predictCTR(campaign, userFeatures) {
    // In production, use ML model for CTR prediction
    // For now, use historical data + simple heuristics
    const historicalCTR = campaign.historical_ctr || 0.02
    
    // Adjust based on user engagement patterns
    const userEngagementMultiplier = Math.min(
      userFeatures.ad_clicks_last_7d / 10, 
      2.0
    )
    
    return Math.min(historicalCTR * userEngagementMultiplier, 0.15)
  }

  async predictCVR(campaign, userFeatures) {
    // Conversion rate prediction
    const historicalCVR = campaign.historical_cvr || 0.05
    
    // Adjust based on user purchase history
    const userConversionMultiplier = userFeatures.ad_conversions_last_30d > 0 ? 1.5 : 0.8
    
    return Math.min(historicalCVR * userConversionMultiplier, 0.3)
  }

  async getCompetitiveMultiplier(campaign, contextFeatures) {
    // Adjust bids based on competitive landscape
    // Higher competition = higher multiplier
    const competitionLevel = await this.getCompetitionLevel(
      campaign.targeting_rules, 
      contextFeatures.hour
    )
    
    switch (competitionLevel) {
      case 'HIGH': return 1.3
      case 'MEDIUM': return 1.1
      case 'LOW': return 0.9
      default: return 1.0
    }
  }

  async getCompetitionLevel(targetingRules, hour) {
    // Analyze competition for similar targeting criteria
    // Peak hours typically have higher competition
    if (hour >= 19 && hour <= 22) return 'HIGH' // Prime time
    if (hour >= 12 && hour <= 14) return 'MEDIUM' // Lunch time
    return 'LOW'
  }

  async updatePostAuction(auctionResults, userId) {
    const promises = []

    for (const winner of auctionResults.winningAds) {
      // Update budget pacing
      promises.push(
        this.budgetPacer.recordSpend(winner.campaignId, winner.actualPrice)
      )

      // Update frequency caps
      promises.push(
        this.frequencyCapManager.recordImpression(winner.campaignId, userId)
      )
    }

    await Promise.all(promises)
  }

  async logAuctionMetrics(startTime, results) {
    const auctionTime = Date.now() - startTime
    
    this.metrics.auctionsRun++
    this.metrics.totalRevenue += results.revenue
    this.metrics.avgAuctionTime = (
      (this.metrics.avgAuctionTime * (this.metrics.auctionsRun - 1) + auctionTime) / 
      this.metrics.auctionsRun
    )
    this.metrics.fillRate = (
      (this.metrics.fillRate * (this.metrics.auctionsRun - 1) + results.fillRate) / 
      this.metrics.auctionsRun
    )

    // Log to analytics system
    await this.logAuctionEvent({
      timestamp: new Date().toISOString(),
      auctionTime,
      revenue: results.revenue,
      participatingBids: results.participatingBids,
      winningAds: results.winningAds.length,
      fillRate: results.fillRate
    })
  }

  generateAuctionId() {
    return `auction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async logAuctionEvent(eventData) {
    // Log to your analytics system
    console.log('Auction Event:', eventData)
  }
}
