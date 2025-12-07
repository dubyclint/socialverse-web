// ============================================================================
// FILE: /server/ml/core/tensor-flow-model.ts - FIXED WITH LAZY LOADING
// ============================================================================

import { createRequire } from 'module'

const require = createRequire(import.meta.url)

// Lazy load TensorFlow
let tf: any = null;

async function getTensorFlow() {
  if (!tf) {
    try {
      tf = await import('@tensorflow/tfjs-node');
      console.log('[TensorFlow] Loaded successfully');
    } catch (error) {
      console.error('[TensorFlow] Failed to load:', error);
      // Fallback to browser version if node version fails
      try {
        tf = await import('@tensorflow/tfjs');
        console.log('[TensorFlow] Loaded browser version as fallback');
      } catch (fallbackError) {
        console.error('[TensorFlow] All versions failed to load');
        throw fallbackError;
      }
    }
  }
  return tf;
}

interface ModelMetrics {
  totalPredictions: number
  avgLatency: number
  errorCount: number
  lastUsed: Date | null
}

/**
 * TensorFlow Model Wrapper
 */
export class TensorFlowModel {
  private modelName: string
  private modelPath: string
  private model: any | null
  private isLoaded: boolean
  private version: string
  private inputShape: number[] | null
  private outputShape: number[] | null
  private preprocessor: ((input: any) => any) | null
  private postprocessor: ((output: any) => any) | null
  private metrics: ModelMetrics

  constructor(
    modelName: string,
    modelPath: string,
    version: string = '1.0.0',
    preprocessor: ((input: any) => any) | null = null,
    postprocessor: ((output: any) => any) | null =
  ) {
    this.modelName = modelName
    this.modelPath = modelPath
    this.model = null
    this.isLoaded = false
    this.version = version
    this.inputShape = null
    this.outputShape = null
    this.preprocessor = preprocessor
    this.postprocessor = postprocessor
    this.metrics = {
      totalPredictions: 0,
      avgLatency: 0,
      errorCount: 0,
      lastUsed: null
    }
  }

  /**
   * Load the model
   */
  async load(): Promise<void> {
    if (this.isLoaded && this.model) {
      console.log(`[TensorFlow] Model ${this.modelName} already loaded`)
      return
    }

    try {
      console.log(`[TensorFlow] Loading model ${this.modelName} from ${this.modelPath}`)
      
      const tfLib = await getTensorFlow();
      this.model = await tfLib.loadLayersModel(this.modelPath)
      
      // Get input/output shapes
      if (this.model.inputs && this.model.inputs.length > 0) {
        this.inputShape = this.model.inputs[0].shape
      }
      if (this.model.outputs && this.model.outputs.length > 0) {
        this.outputShape = this.model.outputs[0].shape
      }

      this.isLoaded = true
      console.log(`[TensorFlow] Model ${this.modelName} loaded successfully`)
      console.log(`[TensorFlow] Input shape:`, this.inputShape)
      console.log(`[TensorFlow] Output shape:`, this.outputShape)
    } catch (error) {
      console.error(`[TensorFlow] Failed to load model ${this.modelName}:`, error)
      this.isLoaded = false
      throw error
    }
  }

  /**
   * Make prediction
   */
  async predict(input: any): Promise<any> {
    if (!this.isLoaded || !this.model) {
      await this.load()
    }

    const startTime = Date.now()

    try {
      const tfLib = await getTensorFlow();
      
      // Preprocess input
      let processedInput = input
      if (this.preprocessor) {
        processedInput = this.preprocessor(input)
      }

      // Convert to tensor
      const inputTensor = tfLib.tensor(processedInput)

      // Make prediction
      const outputTensor = this.model.predict(inputTensor)
      
      // Convert back to array
      let output = await outputTensor.array()

      // Postprocess output
      if (this.postprocessor) {
        output = this.postprocessor(output)
      }

      // Cleanup tensors
      inputTensor.dispose()
      if (Array.isArray(outputTensor)) {
        outputTensor.forEach((t: any) => t.dispose())
      } else {
        outputTensor.dispose()
      }

      // Update metrics
      const latency = Date.now() - startTime
      this.metrics.totalPredictions++
      this.metrics.avgLatency = 
        (this.metrics.avgLatency * (this.metrics.totalPredictions - 1) + latency) / 
        this.metrics.totalPredictions
      this.metrics.lastUsed = new Date()

      return output
    } catch (error) {
      console.error(`[TensorFlow] Prediction failed for ${this.modelName}:`, error)
      this.metrics.errorCount++
      throw error
    }
  }

  /**
   * Unload model to free memory
   */
  async unload(): Promise<void> {
    if (this.model) {
      this.model.dispose()
      this.model = null
      this.isLoaded = false
      console.log(`[TensorFlow] Model ${this.modelName} unloaded`)
    }
  }

  /**
   * Get model metrics
   */
  getMetrics(): ModelMetrics {
    return { ...this.metrics }
  }

  /**
   * Get model info
   */
  getInfo() {
    return {
      name: this.modelName,
      version: this.version,
      path: this.modelPath,
      isLoaded: this.isLoaded,
      inputShape: this.inputShape,
      outputShape: this.outputShape,
      metrics: this.metrics
    }
  }
}
