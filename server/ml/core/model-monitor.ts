interface AlertThresholds {
  maxLatency: number;
  minAccuracy: number;
  maxErrorRate: number;
  maxMemoryUsage: number;
}

interface ModelAlert {
  type: string;
  modelName: string;
  data: any;
  timestamp: Date;
}

interface ModelMetrics {
  avgLatency: number;
  accuracy: number;
  errorRate: number;
  memoryUsage: number;
}

export class ModelMonitor {
  private models: Map<string, any> | null;
  private monitoringInterval: NodeJS.Timeout | null;
  private alertThresholds: AlertThresholds;
  private alerts: ModelAlert[];

  constructor() {
    this.models = null;
    this.monitoringInterval = null;
    this.alertThresholds = {
      maxLatency: 1000,
      minAccuracy: 0.7,
      maxErrorRate: 0.05,
      maxMemoryUsage: 1024 * 1024 * 1024
    };

    this.alerts = [];
  }

  startMonitoring(models: Map<string, any>): void {
    this.models = models;

    this.monitoringInterval = setInterval(() => {
      this.checkModelHealth();
    }, 30000);

    console.log('✅ Model monitoring started');
  }

  private async checkModelHealth(): Promise<void> {
    if (!this.models) return;

    for (const [modelName, model] of this.models.entries()) {
      const metrics = model.getMetrics() as ModelMetrics;

      if (metrics.avgLatency > this.alertThresholds.maxLatency) {
        this.createAlert('HIGH_LATENCY', modelName, {
          current: metrics.avgLatency,
          threshold: this.alertThresholds.maxLatency
        });
      }

      if (metrics.errorRate > this.alertThresholds.maxErrorRate) {
        this.createAlert('HIGH_ERROR_RATE', modelName, {
          current: metrics.errorRate,
          threshold: this.alertThresholds.maxErrorRate
        });
      }

      if (metrics.accuracy < this.alertThresholds.minAccuracy) {
        this.createAlert('LOW_ACCURACY', modelName, {
          current: metrics.accuracy,
          threshold: this.alertThresholds.minAccuracy
        });
      }
    }
  }

  private createAlert(type: string, modelName: string, data: any): void {
    const alert: ModelAlert = {
      type,
      modelName,
      data,
      timestamp: new Date()
    };

    this.alerts.push(alert);
    console.warn(`⚠️ Alert: ${type} on model ${modelName}`, data);
  }

  getAlerts(): ModelAlert[] {
    return [...this.alerts];
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}
