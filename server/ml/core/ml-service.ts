import { FeatureStore } from './feature-store';
import { RecommendationEngine } from './recommendation-engine';
import { AdAuctionEngine } from './ad-auction-engine';
import { CausalInferenceEngine } from './causal-inference-engine';
import { BanditEngine } from './bandit-engine';
import { ModelServing } from './model-serving';
import { EventLogger } from './event-logger';

interface MLServiceConfig {
  explorationRate: number;
  ghostAdRate: number;
  maxAdsPerFeed: number;
  diversityWeight: number;
  engagementWeight: number;
  revenueWeight: number;
}

export class MLService {
  private featureStore: FeatureStore;
  private recommendationEngine: RecommendationEngine;
  private adAuctionEngine: AdAuctionEngine;
  private causalEngine: CausalInferenceEngine;
  private banditEngine: BanditEngine;
  private modelServing: ModelServing;
  private eventLogger: EventLogger;
  private config: MLServiceConfig;

  constructor() {
    this.featureStore = new FeatureStore();
    this.recommendationEngine = new RecommendationEngine();
    this.adAuctionEngine = new AdAuctionEngine();
    this.causalEngine = new CausalInferenceEngine();
    this.banditEngine = new BanditEngine();
    this.modelServing = new ModelServing();
    this.eventLogger = new EventLogger();

    this.config = {
      explorationRate: 0.15,
      ghostAdRate: 0.05,
      maxAdsPerFeed: 3,
      diversityWeight: 0.2,
      engagementWeight: 0.4,
      revenueWeight: 0.4
    };
  }

  async initialize(): Promise<void> {
    await Promise.all([
      this.featureStore.initialize(),
      this.recommendationEngine.initialize(),
      this.adAuctionEngine.initialize(),
      this.causalEngine.initialize(),
      this.banditEngine.initialize(),
      this.modelServing.initialize(),
      this.eventLogger.initialize()
    ]);

    console.log('✅ ML Service fully initialized');
  }

  async generateFeed(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const userFeatures = await this.featureStore.getUserFeatures(userId);
      const candidates = await this.recommendationEngine.generateCandidates(userId, userFeatures, {});

      const feed = candidates.slice(0, limit);

      await this.eventLogger.logFeedGeneration({
        userId,
        feedSize: feed.length,
        timestamp: new Date().toISOString()
      });

      return feed;
    } catch (error) {
      console.error('Error generating feed:', error);
      return [];
    }
  }

  async logInteraction(userId: string, itemId: string, interactionType: string): Promise<void> {
    await this.eventLogger.logUserInteraction(userId, {
      itemId,
      type: interactionType,
      timestamp: new Date().toISOString()
    });
  }
}
