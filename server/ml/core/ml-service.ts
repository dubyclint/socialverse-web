// FILE: /server/ml/core/ml-service.ts
// ============================================================================
// ML Service
// REFACTORED: Use dynamic imports for all dependencies
// ============================================================================

import type { FeatureStore } from './feature-store'
import type { RecommendationEngine } from './recommendation-engine'
import type { AdAuctionEngine } from './ad-auction-engine'
import type { CausalInferenceEngine } from './causal-inference-engine'
import type { BanditEngine } from './bandit-engine'
import type { ModelServing } from './model-serving'
import type { EventLogger } from './event-logger'

interface MLServiceConfig {
  explorationRate: number
  ghostAdRate: number
  maxAdsPerFeed: number
  diversityWeight: number
  engagementWeight: number
  revenueWeight: number
}

export class MLService {
  private featureStore: FeatureStore | null = null
  private recommendationEngine: RecommendationEngine | null = null
  private adAuctionEngine: AdAuctionEngine | null = null
  private causalEngine: CausalInferenceEngine | null = null
  private banditEngine: BanditEngine | null = null
  private modelServing: ModelServing | null = null
  private eventLogger: EventLogger | null = null
  private config: MLServiceConfig

  constructor() {
    this.config = {
      explorationRate: parseFloat(process.env.ML_EXPLORATION_RATE || '0.1'),
      ghostAdRate: parseFloat(process.env.ML_GHOST_AD_RATE || '0.05'),
      maxAdsPerFeed: parseInt(process.env.ML_MAX_ADS_PER_FEED || '3', 10),
      diversityWeight: parseFloat(process.env.ML_DIVERSITY_WEIGHT || '0.3'),
      engagementWeight: parseFloat(process.env.ML_ENGAGEMENT_WEIGHT || '0.5'),
      revenueWeight: parseFloat(process.env.ML_REVENUE_WEIGHT || '0.2')
    }
  }

  async initialize(): Promise<void> {
    try {
      console.log('[MLService] Initializing...')
      
      // Dynamically import and initialize all components
      const { FeatureStore } = await import('./feature-store')
      const { RecommendationEngine } = await import('./recommendation-engine')
      const { AdAuctionEngine } = await import('./ad-auction-engine')
      const { CausalInferenceEngine } = await import('./causal-inference-engine')
      const { BanditEngine } = await import('./bandit-engine')
      const { ModelServing } = await import('./model-serving')
      const { EventLogger } = await import('./event-logger')

      this.featureStore = new FeatureStore()
      this.recommendationEngine = new RecommendationEngine()
      this.adAuctionEngine = new AdAuctionEngine()
      this.causalEngine = new CausalInferenceEngine()
      this.banditEngine = new BanditEngine()
      this.modelServing = new ModelServing()
      this.eventLogger = new EventLogger()

      // Initialize all components
      await Promise.all([
        this.featureStore.initialize(),
        this.recommendationEngine.initialize(),
        this.adAuctionEngine.initialize(),
        this.causalEngine.initialize(),
        this.banditEngine.initialize(),
        this.modelServing.initialize(),
        this.eventLogger.initialize()
      ])

      console.log('[MLService] ✅ All components initialized')
    } catch (error) {
      console.error('[MLService] Initialization failed:', error)
      throw error
    }
  }

  async getRecommendations(userId: string, context: any): Promise<any[]> {
    if (!this.featureStore || !this.recommendationEngine) {
      throw new Error('MLService not initialized')
    }

    try {
      const userFeatures = await this.featureStore.getUserFeatures(userId)
      const recommendations = await this.recommendationEngine.generate(userFeatures, context)
      return recommendations
    } catch (error) {
      console.error('[MLService] Error getting recommendations:', error)
      throw error
    }
  }

  // ... rest of the methods
}
