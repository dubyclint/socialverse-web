import { BudgetPacingController } from './budget-pacing-controller';
import { FrequencyCapManager } from './frequency-cap-manager';

interface AuctionConfig {
  auctionType: 'GSP';
  reservePrice: number;
  maxAdsPerAuction: number;
  bidFloor: number;
  timeoutMs: number;
  qualityThreshold: number;
}

interface AuctionMetrics {
  auctionsRun: number;
  totalRevenue: number;
  avgAuctionTime: number;
  fillRate: number;
}

interface Ad {
  campaignId: string;
  bid: number;
  quality: number;
  [key: string]: any;
}

export class AdAuctionEngine {
  private budgetPacer: BudgetPacingController;
  private frequencyCapManager: FrequencyCapManager;
  private auctionConfig: AuctionConfig;
  private metrics: AuctionMetrics;

  constructor() {
    this.budgetPacer = new BudgetPacingController();
    this.frequencyCapManager = new FrequencyCapManager();

    this.auctionConfig = {
      auctionType: 'GSP',
      reservePrice: 0.01,
      maxAdsPerAuction: 10,
      bidFloor: 0.005,
      timeoutMs: 50,
      qualityThreshold: 0.3
    };

    this.metrics = {
      auctionsRun: 0,
      totalRevenue: 0,
      avgAuctionTime: 0,
      fillRate: 0
    };
  }

  async initialize(): Promise<void> {
    await Promise.all([
      this.budgetPacer.initialize(),
      this.frequencyCapManager.initialize()
    ]);
    console.log('✅ Ad Auction Engine initialized');
  }

  async runAuction(userId: string, userFeatures: any, candidates: Ad[]): Promise<Ad | null> {
    const startTime = Date.now();

    try {
      // Filter by budget pacing
      const pacedCandidates = await this.budgetPacer.filterByBudgetPacing(candidates);

      // Filter by frequency caps
      const frequencyCappedCandidates = await this.frequencyCapManager.filterByFrequencyCaps(
        pacedCandidates,
        userId
      );

      // Filter by quality threshold
      const qualityCandidates = frequencyCappedCandidates.filter(
        ad => ad.quality >= this.auctionConfig.qualityThreshold
      );

      if (qualityCandidates.length === 0) {
        return null;
      }

      // Sort by bid (GSP auction)
      qualityCandidates.sort((a, b) => b.bid - a.bid);

      const winningAd = qualityCandidates[0];

      // Update metrics
      this.metrics.auctionsRun++;
      this.metrics.totalRevenue += winningAd.bid;
      const auctionTime = Date.now() - startTime;
      this.metrics.avgAuctionTime =
        (this.metrics.avgAuctionTime * (this.metrics.auctionsRun - 1) + auctionTime) /
        this.metrics.auctionsRun;
      this.metrics.fillRate = qualityCandidates.length / candidates.length;

      return winningAd;
    } catch (error) {
      console.error('Auction error:', error);
      return null;
    }
  }

  getMetrics(): AuctionMetrics {
    return { ...this.metrics };
  }
}
