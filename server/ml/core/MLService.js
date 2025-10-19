// Core ML Service - Orchestrates all ML components
import { FeatureStore } from './FeatureStore.js'
import { RecommendationEngine } from './RecommendationEngine.js'
import { AdAuctionEngine } from './AdAuctionEngine.js'
import { CausalInferenceEngine } from './CausalInferenceEngine.js'
import { BanditEngine } from './BanditEngine.js'
import { ModelServing } from './ModelServing.js'
import { EventLogger } from './EventLogger.js'

export class MLService {
  constructor() {
    this.featureStore = new FeatureStore()
    this.recommendationEngine = new RecommendationEngine()
    this.adAuctionEngine = new AdAuctionEngine()
    this.causalEngine = new CausalInferenceEngine()
    this.banditEngine = new BanditEngine()
    this.modelServing = new ModelServing()
    this.eventLogger = new EventLogger()
    
    this.config = {
      explorationRate: 0.15,
      ghostAdRate: 0.05,
      maxAdsPerFeed: 3,
      diversityWeight: 0.2,
      engagementWeight: 0.4,
      revenueWeight: 0.4
    }
  }

  async initialize() {
    await Promise.all([
      this.featureStore.initialize(),
      this.recommendationEngine.initialize(),
      this.adAuctionEngine.initialize(),
      this.causalEngine.initialize(),
      this.banditEngine.initialize(),
      this.modelServing.initialize()
    ])
    
    console.log('🤖 ML Service initialized successfully')
  }

  // Main recommendation pipeline
  async generateFeed(userId, context = {}) {
    try {
      const startTime = Date.now()
      
      // 1. Get user features and context
      const userFeatures = await this.featureStore.getUserFeatures(userId)
      const contextFeatures = this.extractContextFeatures(context)
      
      // 2. Generate content candidates
      const contentCandidates = await this.recommendationEngine.generateCandidates(
        userId, 
        userFeatures, 
        contextFeatures
      )
      
      // 3. Generate ad candidates with auction
      const adCandidates = await this.adAuctionEngine.runAuction(
        userId, 
        userFeatures, 
        contextFeatures
      )
      
      // 4. Apply bandit exploration strategy
      const explorationDecision = await this.banditEngine.shouldExplore(
        userId, 
        userFeatures
      )
      
      // 5. Rank and merge content + ads
      const rankedFeed = await this.rankAndMergeFeed(
        contentCandidates,
        adCandidates,
        userFeatures,
        contextFeatures,
        explorationDecision
      )
      
      // 6. Apply guardrails and diversity constraints
      const finalFeed = await this.applyGuardrails(rankedFeed, userId)
      
      // 7. Log for causal inference
      await this.logFeedGeneration(userId, finalFeed, contextFeatures, startTime)
      
      return {
        feed: finalFeed,
        metadata: {
          generationTime: Date.now() - startTime,
          candidatesConsidered: contentCandidates.length + adCandidates.length,
          explorationMode: explorationDecision.isExploring,
          diversityScore: this.calculateDiversityScore(finalFeed)
        }
      }
      
    } catch (error) {
      console.error('Feed generation error:', error)
      return this.getFallbackFeed(userId)
    }
  }

  async rankAndMergeFeed(contentCandidates, adCandidates, userFeatures, contextFeatures, explorationDecision) {
    // Multi-objective scoring with sophisticated ranking
    const scoredContent = await Promise.all(
      contentCandidates.map(async (item) => {
        const engagementScore = await this.modelServing.predictEngagement(item, userFeatures)
        const diversityScore = this.calculateContentDiversity(item, userFeatures)
        
        return {
          ...item,
          type: 'content',
          score: engagementScore * this.config.engagementWeight + 
                 diversityScore * this.config.diversityWeight,
          engagementScore,
          diversityScore
        }
      })
    )

    const scoredAds = await Promise.all(
      adCandidates.map(async (ad) => {
        const ctrScore = await this.modelServing.predictCTR(ad, userFeatures)
        const revenueScore = ad.bidAmount * ctrScore
        const incrementalityScore = await this.causalEngine.getIncrementalityScore(ad, userFeatures)
        
        return {
          ...ad,
          type: 'ad',
          score: revenueScore * this.config.revenueWeight * incrementalityScore,
          ctrScore,
          revenueScore,
          incrementalityScore
        }
      })
    )

    // Merge and sort by score
    const allItems = [...scoredContent, ...scoredAds].sort((a, b) => b.score - a.score)
    
    // Apply exploration strategy
    if (explorationDecision.isExploring) {
      return this.applyExplorationStrategy(allItems, explorationDecision)
    }
    
    return allItems
  }

  extractContextFeatures(context) {
    const now = new Date()
    return {
      timestamp: now.getTime(),
      hour: now.getHours(),
      dayOfWeek: now.getDay(),
      deviceType: context.deviceType || 'unknown',
      location: context.location || null,
      sessionLength: context.sessionLength || 0,
      previousActions: context.previousActions || []
    }
  }

  async applyGuardrails(feed, userId) {
    // Diversity constraints
    const diversifiedFeed = this.enforceDiversity(feed)
    
    // Ad frequency capping
    const cappedFeed = await this.enforceAdFrequencyCaps(diversifiedFeed, userId)
    
    // Content safety filters
    const safeFeed = await this.applyContentSafetyFilters(cappedFeed)
    
    // Well-being constraints
    const wellBeingFeed = await this.applyWellBeingConstraints(safeFeed, userId)
    
    return wellBeingFeed
  }

  enforceDiversity(feed) {
    // Ensure no more than 2 consecutive items of same type/category
    const diversified = []
    let lastType = null
    let typeCount = 0
    
    for (const item of feed) {
      if (item.type === lastType) {
        typeCount++
        if (typeCount >= 2 && item.type === 'ad') continue
        if (typeCount >= 3) continue
      } else {
        typeCount = 1
        lastType = item.type
      }
      
      diversified.push(item)
    }
    
    return diversified
  }

  async logFeedGeneration(userId, feed, context, startTime) {
    const logData = {
      userId,
      timestamp: new Date().toISOString(),
      generationTime: Date.now() - startTime,
      feedItems: feed.map(item => ({
        id: item.id,
        type: item.type,
        score: item.score,
        position: feed.indexOf(item)
      })),
      context,
      experimentGroup: await this.getExperimentGroup(userId)
    }
    
    await this.eventLogger.logFeedGeneration(logData)
  }

  async getFallbackFeed(userId) {
    // Simple fallback when ML pipeline fails
    return {
      feed: await this.getPopularContent(userId),
      metadata: { fallback: true }
    }
  }
}
