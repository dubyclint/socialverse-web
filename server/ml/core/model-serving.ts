import { TensorFlowModel } from './tensor-flow-model';
import { ModelCache } from './model-cache';
import { ModelMonitor } from './model-monitor';

interface ModelConfig {
  name: string;
  path: string;
  priority: number;
}

interface ServingConfig {
  maxConcurrentPredictions: number;
  predictionTimeout: number;
  cacheEnabled: boolean;
  monitoringEnabled: boolean;
  autoReload: boolean;
}

export class ModelServing {
  private models: Map<string, TensorFlowModel>;
  private cache: ModelCache;
  private monitor: ModelMonitor;
  private config: ServingConfig;
  private loadQueue: any[];
  private predictionQueue: any[];
  private isProcessingQueue: boolean;

  constructor() {
    this.models = new Map();
    this.cache = new ModelCache();
    this.monitor = new ModelMonitor();

    this.config = {
      maxConcurrentPredictions: 100,
      predictionTimeout: 5000,
      cacheEnabled: true,
      monitoringEnabled: true,
      autoReload: true
    };

    this.loadQueue = [];
    this.predictionQueue = [];
    this.isProcessingQueue = false;
  }

  async initialize(): Promise<void> {
    const modelConfigs: ModelConfig[] = [
      { name: 'engagement_predictor', path: './models/engagement', priority: 1 },
      { name: 'ctr_predictor', path: './models/ctr', priority: 1 },
      { name: 'cvr_predictor', path: './models/cvr', priority: 2 },
      { name: 'content_embedder', path: './models/embeddings', priority: 2 },
      { name: 'user_embedder', path: './models/user_embeddings', priority: 2 }
    ];

    for (const config of modelConfigs) {
      const model = new TensorFlowModel(config.name, config.path);
      await model.load();
      this.models.set(config.name, model);
    }

    if (this.config.monitoringEnabled) {
      this.monitor.startMonitoring(this.models);
    }

    console.log('✅ Model Serving initialized');
  }

  async predict(modelName: string, input: any): Promise<any> {
    try {
      const cacheKey = `${modelName}:${JSON.stringify(input)}`;

      if (this.config.cacheEnabled) {
        const cached = await this.cache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const model = this.models.get(modelName);
      if (!model) {
        throw new Error(`Model ${modelName} not found`);
      }

      const prediction = await model.predict(input);

      if (this.config.cacheEnabled) {
        await this.cache.set(cacheKey, prediction);
      }

      return prediction;
    } catch (error) {
      console.error(`Prediction error for model ${modelName}:`, error);
      throw error;
    }
  }

  getModel(modelName: string): TensorFlowModel | undefined {
    return this.models.get(modelName);
  }

  getAllModels(): Map<string, TensorFlowModel> {
    return new Map(this.models);
  }
}
