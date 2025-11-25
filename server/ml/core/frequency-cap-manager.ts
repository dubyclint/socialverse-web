interface DefaultCaps {
  perHour: number;
  perDay: number;
  perWeek: number;
  perCampaign: number;
}

interface FrequencyInfo {
  userId: string;
  impressions: Map<string, number>;
  lastReset: Date;
}

export class FrequencyCapManager {
  private frequencyData: Map<string, FrequencyInfo>;
  private capRules: Map<string, any>;
  private defaultCaps: DefaultCaps;
  private updateInterval: number;

  constructor() {
    this.frequencyData = new Map();
    this.capRules = new Map();

    this.defaultCaps = {
      perHour: 5,
      perDay: 20,
      perWeek: 100,
      perCampaign: 3
    };

    this.updateInterval = 3600000;
  }

  async initialize(): Promise<void> {
    await this.loadFrequencyData();
    this.startCleanupLoop();
    console.log('✅ Frequency Cap Manager initialized');
  }

  async filterByFrequencyCaps(campaigns: any[], userId: string): Promise<any[]> {
    const eligibleCampaigns = [];
    const userFrequency = this.getOrCreateUserFrequency(userId);

    for (const campaign of campaigns) {
      const canShow = this.checkFrequencyCap(campaign, userId, userFrequency);
      if (canShow) {
        eligibleCampaigns.push(campaign);
      }
    }

    return eligibleCampaigns;
  }

  private checkFrequencyCap(campaign: any, userId: string, frequency: FrequencyInfo): boolean {
    const campaignImpressions = frequency.impressions.get(campaign.id) || 0;
    return campaignImpressions < this.defaultCaps.perCampaign;
  }

  private getOrCreateUserFrequency(userId: string): FrequencyInfo {
    let frequency = this.frequencyData.get(userId);

    if (!frequency) {
      frequency = {
        userId,
        impressions: new Map(),
        lastReset: new Date()
      };
      this.frequencyData.set(userId, frequency);
    }

    return frequency;
  }

  private startCleanupLoop(): void {
    setInterval(() => {
      this.cleanupOldData();
    }, this.updateInterval);
  }

  private cleanupOldData(): void {
    const now = Date.now();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

    for (const [userId, frequency] of this.frequencyData.entries()) {
      if (now - frequency.lastReset.getTime() > oneWeekMs) {
        this.frequencyData.delete(userId);
      }
    }
  }

  private async loadFrequencyData(): Promise<void> {
    // Load from database
  }
}
