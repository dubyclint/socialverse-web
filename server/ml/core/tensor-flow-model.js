// TensorFlow model serving infrastructure
import * as tf from '@tensorflow/tfjs-node'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

export class TensorFlowModel {
  constructor(modelName, modelPath = null) {
    this.modelName = modelName
    this.modelPath = modelPath || `./models/${modelName}`
    this.model = null
    this.isLoaded = false
    this.version = '1.0.0'
    this.inputShape = null
    this.outputShape = null
    this.preprocessor = null
    this.postprocessor = null
    
    // Performance metrics
    this.metrics = {
      totalPredictions: 0,
      avgLatency: 0,
      errorCount: 0,
      lastUsed: null
    }
  }

  async load() {
    try {
      console.log(`Loading TensorFlow model: ${this.modelName}`)
      
      // Load model from file or URL
      if (this.modelPath.startsWith('http')) {
        this.model = await tf.loadLayersModel(this.modelPath)
      } else {
        this.model = await tf.loadLayersModel(`file://${this.modelPath}/model.json`)
      }
      
      // Get model metadata
      this.inputShape = this.model.inputs[0].shape
      this.outputShape = this.model.outputs[0].shape
      
      // Load preprocessor and postprocessor if they exist
      await this.loadProcessors()
      
      this.isLoaded = true
      console.log(`✅ Model ${this.modelName} loaded successfully`)
      console.log(`Input shape: ${this.inputShape}`)
      console.log(`Output shape: ${this.outputShape}`)
      
    } catch (error) {
      console.error(`Failed to load model ${this.modelName}:`, error)
      throw error
    }
  }

  async loadProcessors() {
    try {
      // Load preprocessing function
      const preprocessorPath = `${this.modelPath}/preprocessor.js`
      if (await this.fileExists(preprocessorPath)) {
        const { preprocess } = await import(preprocessorPath)
        this.preprocessor = preprocess
      }
      
      // Load postprocessing function
      const postprocessorPath = `${this.modelPath}/postprocessor.js`
      if (await this.fileExists(postprocessorPath)) {
        const { postprocess } = await import(postprocessorPath)
        this.postprocessor = postprocess
      }
      
    } catch (error) {
      console.warn(`Could not load processors for ${this.modelName}:`, error.message)
    }
  }

  async predict(inputData, options = {}) {
    if (!this.isLoaded) {
      throw new Error(`Model ${this.modelName} is not loaded`)
    }

    const startTime = Date.now()
    
    try {
      // Preprocess input data
      let processedInput = this.preprocessor 
        ? await this.preprocessor(inputData, options)
        : this.defaultPreprocess(inputData)
      
      // Convert to tensor
      const inputTensor = tf.tensor(processedInput)
      
      // Make prediction
      const outputTensor = this.model.predict(inputTensor)
      
      // Convert back to JavaScript array
      const outputData = await outputTensor.data()
      
      // Postprocess output
      let result = this.postprocessor
        ? await this.postprocessor(outputData, options)
        : this.defaultPostprocess(outputData)
      
      // Clean up tensors
      inputTensor.dispose()
      outputTensor.dispose()
      
      // Update metrics
      this.updateMetrics(Date.now() - startTime)
      
      return result
      
    } catch (error) {
      this.metrics.errorCount++
      console.error(`Prediction error in ${this.modelName}:`, error)
      throw error
    }
  }

  async batchPredict(inputBatch, options = {}) {
    if (!this.isLoaded) {
      throw new Error(`Model ${this.modelName} is not loaded`)
    }

    const batchSize = inputBatch.length
    const startTime = Date.now()
    
    try {
      // Preprocess batch
      const processedBatch = await Promise.all(
        inputBatch.map(input => 
          this.preprocessor 
            ? this.preprocessor(input, options)
            : this.defaultPreprocess(input)
        )
      )
      
      // Convert to tensor
      const inputTensor = tf.tensor(processedBatch)
      
      // Make batch prediction
      const outputTensor = this.model.predict(inputTensor)
      
      // Convert back to JavaScript arrays
      const outputData = await outputTensor.data()
      const outputArray = Array.from(outputData)
      
      // Reshape output based on batch size and output shape
      const outputDim = this.outputShape.slice(1).reduce((a, b) => a * b, 1)
      const results = []
      
      for (let i = 0; i < batchSize; i++) {
        const start = i * outputDim
        const end = start + outputDim
        const batchOutput = outputArray.slice(start, end)
        
        const result = this.postprocessor
          ? await this.postprocessor(batchOutput, options)
          : this.defaultPostprocess(batchOutput)
        
        results.push(result)
      }
      
      // Clean up tensors
      inputTensor.dispose()
      outputTensor.dispose()
      
      // Update metrics
      this.updateMetrics(Date.now() - startTime, batchSize)
      
      return results
      
    } catch (error) {
      this.metrics.errorCount++
      console.error(`Batch prediction error in ${this.modelName}:`, error)
      throw error
    }
  }

  defaultPreprocess(inputData) {
    // Default preprocessing - normalize features
    if (Array.isArray(inputData)) {
      return inputData.map(val => typeof val === 'number' ? val : 0)
    }
    
    if (typeof inputData === 'object') {
      // Convert object to array based on expected input shape
      const expectedLength = this.inputShape.slice(1).reduce((a, b) => a * b, 1)
      const result = new Array(expectedLength).fill(0)
      
      // Map known features to array positions
      const featureMap = this.getFeatureMap()
      
      for (const [key, value] of Object.entries(inputData)) {
        const index = featureMap[key]
        if (index !== undefined && typeof value === 'number') {
          result[index] = value
        }
      }
      
      return result
    }
    
    throw new Error('Invalid input data format')
  }

  defaultPostprocess(outputData) {
    // Default postprocessing - return raw output
    if (outputData.length === 1) {
      return outputData[0]
    }
    
    return Array.from(outputData)
  }

  getFeatureMap() {
    // Default feature mapping - override in specific models
    return {
      'user_age_group': 0,
      'user_follower_count': 1,
      'item_age_hours': 2,
      'item_like_rate': 3,
      'hour_of_day': 4,
      'day_of_week': 5
      // ... more features
    }
  }

  updateMetrics(latency, batchSize = 1) {
    this.metrics.totalPredictions += batchSize
    this.metrics.avgLatency = (
      (this.metrics.avgLatency * (this.metrics.totalPredictions - batchSize) + latency) /
      this.metrics.totalPredictions
    )
    this.metrics.lastUsed = new Date()
  }

  getMetrics() {
    return {
      ...this.metrics,
      modelName: this.modelName,
      version: this.version,
      isLoaded: this.isLoaded,
      memoryUsage: this.getMemoryUsage()
    }
  }

  getMemoryUsage() {
    if (!this.model) return 0
    
    // Calculate approximate memory usage
    let totalParams = 0
    this.model.layers.forEach(layer => {
      if (layer.countParams) {
        totalParams += layer.countParams()
      }
    })
    
    // Assume 4 bytes per parameter (float32)
    return totalParams * 4
  }

  async fileExists(path) {
    try {
      const fs = require('fs').promises
      await fs.access(path)
      return
      return true
    } catch {
      return false
    }
  }

  dispose() {
    if (this.model) {
      this.model.dispose()
      this.model = null
      this.isLoaded = false
      console.log(`Model ${this.modelName} disposed`)
    }
  }
}
