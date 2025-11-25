import * as tf from '@tensorflow/tfjs-node';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

interface ModelMetrics {
  totalPredictions: number;
  avgLatency: number;
  errorCount: number;
  lastUsed: Date | null;
}

export class TensorFlowModel {
  private modelName: string;
  private modelPath: string;
  private model: tf.LayersModel | null;
  private isLoaded: boolean;
  private version: string;
  private inputShape: number[] | null;
  private outputShape: number[] | null;
  private preprocessor: ((input: any) => any) | null;
  private postprocessor: ((output: any) => any) | null;
  private metrics: ModelMetrics;

  constructor(modelName: string, modelPath: string | null = null) {
    this.modelName = modelName;
    this.modelPath = modelPath || `./models/${modelName}`;
    this.model = null;
    this.isLoaded = false;
    this.version = '1.0.0';
    this.inputShape = null;
    this.outputShape = null;
    this.preprocessor = null;
    this.postprocessor = null;

    this.metrics = {
      totalPredictions: 0,
      avgLatency: 0,
      errorCount: 0,
      lastUsed: null
    };
  }

  async load(): Promise<void> {
    try {
      console.log(`Loading TensorFlow model: ${this.modelName}`);

      if (this.modelPath.startsWith('http')) {
        this.model = await tf.loadLayersModel(this.modelPath);
      } else {
        this.model = await tf.loadLayersModel(`file://${this.modelPath}/model.json`);
      }

      this.isLoaded = true;
      console.log(`✅ Model ${this.modelName} loaded successfully`);
    } catch (error) {
      console.error(`Failed to load model ${this.modelName}:`, error);
      throw error;
    }
  }

  async predict(input: any): Promise<any> {
    if (!this.isLoaded || !this.model) {
      throw new Error(`Model ${this.modelName} is not loaded`);
    }

    const startTime = Date.now();

    try {
      let processedInput = input;
      if (this.preprocessor) {
        processedInput = this.preprocessor(input);
      }

      const tensorInput = tf.tensor(processedInput);
      const output = this.model.predict(tensorInput) as tf.Tensor;
      const result = await output.data();

      let processedOutput = Array.from(result);
      if (this.postprocessor) {
        processedOutput = this.postprocessor(processedOutput);
      }

      // Update metrics
      const latency = Date.now() - startTime;
      this.metrics.totalPredictions++;
      this.metrics.avgLatency =
        (this.metrics.avgLatency * (this.metrics.totalPredictions - 1) + latency) /
        this.metrics.totalPredictions;
      this.metrics.lastUsed = new Date();

      // Cleanup
      tensorInput.dispose();
      output.dispose();

      return processedOutput;
    } catch (error) {
      this.metrics.errorCount++;
      console.error(`Prediction error in model ${this.modelName}:`, error);
      throw error;
    }
  }

  setPreprocessor(fn: (input: any) => any): void {
    this.preprocessor = fn;
  }

  setPostprocessor(fn: (output: any) => any): void {
    this.postprocessor = fn;
  }

  getMetrics(): ModelMetrics {
    return { ...this.metrics };
  }

  async unload(): Promise<void> {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.isLoaded = false;
      console.log(`Model ${this.modelName} unloaded`);
    }
  }

  isModelLoaded(): boolean {
    return this.isLoaded;
  }
}
