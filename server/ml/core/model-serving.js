// Model serving orchestrator
import { TensorFlowModel } from './TensorFlowModel.js'
import { ModelCache } from './ModelCache.js'
import { ModelMonitor } from './ModelMonitor.js'

export class ModelServing {
  constructor() {
    this.models = new Map()
    this.cache = new ModelCache()
    this.monitor = new ModelMonitor()
    
    this.config = {
      maxConcurrentPredictions: 100,
      predictionTimeout: 5000, // 5 seconds
      cacheEnabled: true,
      monitoringEnabled: true,
      autoReload: true
    }
    
    this.loadQueue = []
    this.predictionQueue = []
    this.isProcessingQueue = false
  }

  async initialize() {
    // Load all required models
    const modelConfigs = [
      { name: 'engagement_predictor', path: './models/engagement', priority: 1 },
      { name: 'ctr_predictor', path: './models/ctr', priority: 1 },
      { name: 'cvr_predictor', path: './models/cvr', priority: 2 },
      { name: 'content_embedder', path: './models/embeddings', priority: 2 },
      { name: 'user_embedder', path: './models/user_embeddings', priority: 3 },
      { name: 'toxicity_classifier', path: './models/safety', priority: 1 }
    ]

    // Sort by priority and load
    modelConfigs.sort((a, b) => a.priority - b.priority)
    
    for (const config of modelConfigs) {
      await this.loadModel(config.name, config.path)
    }

    // Start monitoring
    if (this.config.monitoringEnabled) {
      this.monitor.startMonitoring(this.models)
    }

    // Start queue processor
    this.startQueueProcessor()

    console.log('✅ Model Serving initialized with', this.models.size, 'models')
  }

  async loadModel(modelName, modelPath) {
    try {
      const model = new TensorFlowModel(modelName, modelPath)
      await model.load()
      
      this.models.set(modelName, model)
      console.log(`Model ${modelName} loaded and ready`)
      
      return model
    } catch (error) {
      console.error(`Failed to load model ${modelName}:`, error)
      throw error
    }
  }

  async predictEngagement(item, userFeatures) {
    const cacheKey = `engagement:${item.id}:${userFeatures.user_id}`
    
    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = await this.cache.get(cacheKey)
      if (cached) return cached
    }

    const model = this.models.get('engagement_predictor')
    if (!model) {
      throw new Error('Engagement prediction model not available')
    }

    // Prepare features
    const features = this.prepareEngagementFeatures(item, userFeatures)
    
    // Make prediction
    const prediction = await this.queuePrediction(model, features, {
      timeout: this.config.predictionTimeout,
      priority: 'high'
    })

    // Cache result
    if (this.config.cacheEnabled) {
      await this.cache.set(cacheKey, prediction, 300) // 5 minutes
    }

    return prediction
  }

  async predictCTR(ad, userFeatures) {
    const cacheKey = `ctr:${ad.id}:${userFeatures.user_id}`
    
    if (this.config.cacheEnabled) {
      const cached = await this.cache.get(cacheKey)
      if (cached) return cached
    }

    const model = this.models.get('ctr_predictor')
    if (!model) {
      throw new Error('CTR prediction model not available')
    }

    const features = this.prepareCTRFeatures(ad, userFeatures)
    const prediction = await this.queuePrediction(model, features)

    if (this.config.cacheEnabled) {
      await this.cache.set(cacheKey, prediction, 600) // 10 minutes
    }

    return prediction
  }

  async predictCVR(ad, userFeatures) {
    const cacheKey = `cvr:${ad.id}:${userFeatures.user_id}`
    
    if (this.config.cacheEnabled) {
      const cached = await this.cache.get(cacheKey)
      if (cached) return cached
    }

    const model = this.models.get('cvr_predictor')
    if (!model) {
      throw new Error('CVR prediction model not available')
    }

    const features = this.prepareCVRFeatures(ad, userFeatures)
    const prediction = await this.queuePrediction(model, features)

    if (this.config.cacheEnabled) {
      await this.cache.set(cacheKey, prediction, 1800) // 30 minutes
    }

    return prediction
  }

  async getUserEmbedding(userId) {
    const cacheKey = `user_embedding:${userId}`
    
    if (this.config.cacheEnabled) {
      const cached = await this.cache.get(cacheKey)
      if (cached) return cached
    }

    const model = this.models.get('user_embedder')
    if (!model) {
      throw new Error('User embedding model not available')
    }

    // Get user features for embedding
    const userFeatures = await this.getUserFeaturesForEmbedding(userId)
    const embedding = await this.queuePrediction(model, userFeatures)

    if (this.config.cacheEnabled) {
      await this.cache.set(cacheKey, embedding, 3600) // 1 hour
    }

    return embedding
  }

  async getContentEmbedding(content) {
    const cacheKey = `content_embedding:${this.hashContent(content)}`
    
    if (this.config.cacheEnabled) {
      const cached = await this.cache.get(cacheKey)
      if (cached) return cached
    }

    const model = this.models.get('content_embedder')
    if (!model) {
      throw new Error('Content embedding model not available')
    }

    const features = this.prepareContentFeatures(content)
    const embedding = await this.queuePrediction(model, features)

    if (this.config.cacheEnabled) {
      await this.cache.set(cacheKey, embedding, 86400) // 24 hours
    }

    return embedding
  }

  async classifyToxicity(content) {
    const model = this.models.get('toxicity_classifier')
    if (!model) {
      console.warn('Toxicity classifier not available')
      return { toxicity_score: 0, is_toxic: false }
    }

    const features = this.prepareToxicityFeatures(content)
    const prediction = await this.queuePrediction(model, features, {
      priority: 'high',
      timeout: 2000 // Fast response for safety
    })

    return {
      toxicity_score: prediction,
      is_toxic: prediction > 0.7
    }
  }

  async queuePrediction(model, features, options = {}) {
    return new Promise((resolve, reject) => {
      const predictionTask = {
        model,
        features,
        options,
        resolve,
        reject,
        timestamp: Date.now(),
        priority: options.priority || 'normal'
      }

      this.predictionQueue.push(predictionTask)
      
      // Sort by priority
      this.predictionQueue.sort((a, b) => {
        const priorityOrder = { high: 0, normal: 1, low: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })

      // Start processing if not already running
      if (!this.isProcessingQueue) {
        this.processQueue()
      }
    })
  }

  async processQueue() {
    if (this.isProcessingQueue) return
    this.isProcessingQueue = true

    while (this.predictionQueue.length > 0) {
      const batch = this.predictionQueue.splice(0, this.config.maxConcurrentPredictions)
      
      // Group by model for batch processing
      const modelBatches = new Map()
      
      batch.forEach(task => {
        const modelName = task.model.modelName
        if (!modelBatches.has(modelName)) {
          modelBatches.set(modelName, [])
        }
        modelBatches.get(modelName).push(task)
      })

      // Process each model batch
      const batchPromises = Array.from(modelBatches.entries()).map(
        async ([modelName, tasks]) => {
          try {
            const model = tasks[0].model
            const features = tasks.map(task => task.features)
            
            // Batch predict if multiple tasks for same model
            let results
            if (features.length === 1) {
              results = [await model.predict(features[0])]
            } else {
              results = await model.batchPredict(features)
            }

            // Resolve all tasks in batch
            tasks.forEach((task, index) => {
              task.resolve(results[index])
            })

          } catch (error) {
            // Reject all tasks in batch
            tasks.forEach(task => {
              task.reject(error)
            })
          }
        }
      )

      await Promise.all(batchPromises)
    }

    this.isProcessingQueue = false
  }

  startQueueProcessor() {
    // Process queue every 10ms for low latency
    setInterval(() => {
      if (this.predictionQueue.length > 0 && !this.isProcessingQueue) {
        this.processQueue()
      }
    }, 10)
  }

  // Feature preparation methods
  prepareEngagementFeatures(item, userFeatures) {
    return {
      // User features
      user_age_group: this.encodeAgeGroup(userFeatures.age_group),
      user_follower_count: Math.log(userFeatures.follower_count + 1),
      user_avg_session_length: userFeatures.avg_session_length / 3600,
      user_posts_per_week: userFeatures.posts_per_week,
      user_likes_per_week: userFeatures.likes_per_week,
      
      // Item features
      item_age_hours: item.age_hours || 0,
      item_like_rate: item.like_rate || 0,
      item_comment_rate: item.comment_rate || 0,
      item_share_rate: item.share_rate || 0,
      item_author_follower_count: Math.log(item.author_follower_count + 1),
      
      // Context features
      hour_of_day: new Date().getHours(),
      day_of_week: new Date().getDay(),
      
      // Interaction features
      user_item_similarity: this.calculateSimilarity(userFeatures, item),
      
      // Temporal features
      time_since_last_interaction: userFeatures.time_since_last_interaction || 0
    }
  }

  prepareCTRFeatures(ad, userFeatures) {
    return {
      // User features
      user_age_group: this.encodeAgeGroup(userFeatures.age_group),
      user_ad_clicks_last_7d: userFeatures.ad_clicks_last_7d || 0,
      user_avg_time_between_clicks: userFeatures.avg_time_between_ad_clicks || 0,
      
      // Ad features
      ad_bid_amount: ad.bidAmount || 0,
      ad_quality_score: ad.qualityScore || 0.5,
      ad_historical_ctr: ad.historical_ctr || 0.02,
      ad_format: this.encodeAdFormat(ad.format),
      
      // Campaign features
      campaign_daily_budget: ad.campaign?.daily_budget || 0,
      campaign_age_days: ad.campaign?.age_days || 0,
      
      // Targeting match
      targeting_score: ad.targetingScore || 0.5,
      
      // Context
      hour_of_day: new Date().getHours(),
      device_type: this.encodeDeviceType(userFeatures.device_type)
    }
  }

  prepareCVRFeatures(ad, userFeatures) {
    return {
      // User conversion history
      user_ad_conversions_last_30d: userFeatures.ad_conversions_last_30d || 0,
      user_avg_order_value: userFeatures.avg_order_value || 0,
      user_days_since_last_purchase: userFeatures.days_since_last_purchase || 999,
      
      // Ad features
      ad_landing_page_quality: ad.landing_page_quality || 0.5,
      ad_offer_type: this.encodeOfferType(ad.offer_type),
      ad_price_point: ad.price_point || 0,
      
      // Campaign features
      campaign_conversion_goal: this.encodeConversionGoal(ad.campaign?.conversion_goal),
      campaign_historical_cvr: ad.campaign?.historical_cvr || 0.05,
      
      // Contextual features
      is_weekend: [0, 6].includes(new Date().getDay()) ? 1 : 0,
      is_evening: new Date().getHours() >= 18 ? 1 : 0
    }
  }

  prepareContentFeatures(content) {
    return {
      text_length: content.length,
      word_count: content.split(' ').length,
      has_hashtags: content.includes('#') ? 1 : 0,
      has_mentions: content.includes('@') ? 1 : 0,
      has_urls: /https?:\/\//.test(content) ? 1 : 0,
      sentiment_score: this.calculateSentiment(content),
      readability_score: this.calculateReadability(content)
    }
  }

  prepareToxicityFeatures(content) {
    // Simplified toxicity features
    const words = content.toLowerCase().split(' ')
    
    return {
      text_length: content.length,
      word_count: words.length,
      caps_ratio: (content.match(/[A-Z]/g) || []).length / content.length,
      exclamation_count: (content.match(/!/g) || []).length,
      profanity_count: this.countProfanity(words),
      aggressive_words: this.countAggressiveWords(words)
    }
  }

  // Helper methods
  encodeAgeGroup(ageGroup) {
    const mapping = {
      'under_18': 0, '18_24': 1, '25_34': 2, 
      '35_44': 3, '45_54': 4, '55_plus': 5
    }
    return mapping[ageGroup] || 2
  }

  encodeAdFormat(format) {
    const mapping = {
      'banner': 0, 'video': 1, 'native': 2, 'carousel': 3
    }
    return mapping[format] || 0
  }

  encodeDeviceType(deviceType) {
    const mapping = { 'mobile': 0, 'desktop': 1, 'tablet': 2 }
    return mapping[deviceType] || 0
  }

  calculateSimilarity(userFeatures, item) {
    // Simplified similarity calculation
    if (!userFeatures.interest_embedding || !item.text_embedding) {
      return 0.5
    }
    
    // Cosine similarity
    let dotProduct = 0
    let normA = 0
    let normB = 0
    
    const minLength = Math.min(
      userFeatures.interest_embedding.length, 
      item.text_embedding.length
    )
    
    for (let i = 0; i < minLength; i++) {
      dotProduct += userFeatures.interest_embedding[i] * item.text_embedding[i]
      normA += userFeatures.interest_embedding[i] ** 2
      normB += item.text_embedding[i] ** 2
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  calculateSentiment(text) {
    // Simplified sentiment analysis
    const positiveWords = ['good', 'great', 'awesome', 'love', 'amazing']
    const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'horrible']
    
    const words = text.toLowerCase().split(' ')
    let score = 0
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1
      if (negativeWords.includes(word)) score -= 1
    })
    
    return Math.max(-1, Math.min(1, score / words.length))
  }

  calculateReadability(text) {
    // Simplified readability score
    const sentences = text.split(/[.!?]+/).length
    const words = text.split(' ').length
    const avgWordsPerSentence = words / sentences
    
    return Math.max(0, Math.min(1, 1 - (avgWordsPerSentence - 15) / 20))
  }

  countProfanity(words) {
    const profanityList = ['damn', 'hell'] // Simplified list
    return words.filter(word => profanityList.includes(word)).length
  }

  countAggressiveWords(words) {
    const aggressiveWords = ['kill', 'destroy', 'attack', 'fight']
    return words.filter(word => aggressiveWords.includes(word)).length
  }

  hashContent(content) {
    // Simple hash for caching
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString()
  }

  async getUserFeaturesForEmbedding(userId) {
    // Get comprehensive user features for embedding generation
    const supabase = serverSupabaseServiceRole()
    
    const { data: features } = await supabase
      .from('user_features')
      .select('feature_data')
      .eq('user_id', userId)
      .single()
    
    return features?.feature_data || {}
  }

  getModelMetrics() {
    const metrics = {}
    
    for (const [name, model] of this.models) {
      metrics[name] = model.getMetrics()
    }
    
    return {
      models: metrics,
      queue: {
        pending: this.predictionQueue.length,
        processing: this.isProcessingQueue
      },
      cache: this.cache.getStats(),
      system: {
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    }
  }

  async reloadModel(modelName) {
    const model = this.models.get(modelName)
    if (!model) {
      throw new Error(`Model ${modelName} not found`)
    }

    // Dispose old model
    model.dispose()
    
    // Load new version
    const newModel = new TensorFlowModel(modelName, model.modelPath)
    await newModel.load()
    
    this.models.set(modelName, newModel)
    console.log(`Model ${modelName} reloaded`)
  }

  dispose() {
    // Dispose all models
    for (const [name, model] of this.models) {
      model.dispose()
    }
    
    this.models.clear()
    this.predictionQueue = []
    
    if (this.monitor) {
      this.monitor.stop()
    }
    
    console.log('Model serving disposed')
  }
}
