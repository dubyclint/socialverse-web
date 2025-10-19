// Bandit Engine - Multi-armed bandit for exploration/exploitation
export class BanditEngine {
  constructor() {
    this.bandits = new Map() // contextId -> bandit state
    
    this.config = {
      algorithm: 'LinUCB', // LinUCB, Thompson Sampling, UCB1
      alpha: 0.1, // Exploration parameter
      contextDimension: 50,
      maxArms: 1000,
      updateFrequency: 100, // Update every N interactions
      warmupPeriod: 50 // Minimum interactions before exploitation
    }
    
    this.interactionCount = 0
  }

  async initialize() {
    await this.loadBanditStates()
    console.log('✅ Bandit Engine initialized')
  }

  async shouldExplore(userId, userFeatures) {
    const context = this.extractBanditContext(userFeatures)
    const contextId = this.getContextId(context)
    
    let bandit = this.bandits.get(contextId)
    if (!bandit) {
      bandit = this.initializeBandit(contextId, context)
      this.bandits.set(contextId, bandit)
    }
    
    // Check if we're in warmup period
    if (bandit.totalInteractions < this.config.warmupPeriod) {
      return {
        isExploring: true,
        reason: 'warmup',
        explorationRate: 1.0,
        banditState: bandit
      }
    }
    
    // Calculate exploration probability based on uncertainty
    const uncertainty = this.calculateUncertainty(bandit, context)
    const explorationProb = Math.min(0.3, uncertainty * this.config.alpha)
    
    const shouldExplore = Math.random() < explorationProb
    
    return {
      isExploring: shouldExplore,
      reason: shouldExplore ? 'uncertainty' : 'exploitation',
      explorationRate: explorationProb,
      uncertainty,
      banditState: bandit
    }
  }

  async selectArm(bandit, context, availableArms) {
    switch (this.config.algorithm) {
      case 'LinUCB':
        return this.selectArmLinUCB(bandit, context, availableArms)
      case 'ThompsonSampling':
        return this.selectArmThompsonSampling(bandit, context, availableArms)
      case 'UCB1':
        return this.selectArmUCB1(bandit, availableArms)
      default:
        return this.selectArmLinUCB(bandit, context, availableArms)
    }
  }

  selectArmLinUCB(bandit, context, availableArms) {
    let bestArm = null
    let bestScore = -Infinity
    
    for (const arm of availableArms) {
      const armState = bandit.arms.get(arm.id) || this.initializeArm(arm.id)
      
      // Calculate confidence bound
      const theta = armState.theta || new Array(this.config.contextDimension).fill(0)
      const A_inv = armState.A_inv || this.createIdentityMatrix(this.config.contextDimension)
      
      // Expected reward
      const expectedReward = this.dotProduct(theta, context)
      
      // Confidence bound
      const confidence = this.config.alpha * Math.sqrt(
        this.quadraticForm(context, A_inv)
      )
      
      const ucbScore = expectedReward + confidence
      
      if (ucbScore > bestScore) {
        bestScore = ucbScore
        bestArm = {
          ...arm,
          expectedReward,
          confidence,
          ucbScore,
          armState
        }
      }
    }
    
    return bestArm
  }

  selectArmThompsonSampling(bandit, context, availableArms) {
    let bestArm = null
    let bestSample = -Infinity
    
    for (const arm of availableArms) {
      const armState = bandit.arms.get(arm.id) || this.initializeArm(arm.id)
      
      // Sample from posterior distribution
      const theta = armState.theta || new Array(this.config.contextDimension).fill(0)
      const A_inv = armState.A_inv || this.createIdentityMatrix(this.config.contextDimension)
      
      // Sample theta from multivariate normal
      const sampledTheta = this.sampleMultivariateNormal(theta, A_inv)
      const sampledReward = this.dotProduct(sampledTheta, context)
      
      if (sampledReward > bestSample) {
        bestSample = sampledReward
        bestArm = {
          ...arm,
          sampledReward,
          armState
        }
      }
    }
    
    return bestArm
  }

  selectArmUCB1(bandit, availableArms) {
    let bestArm = null
    let bestScore = -Infinity
    
    const totalPlays = bandit.totalInteractions
    
    for (const arm of availableArms) {
      const armState = bandit.arms.get(arm.id) || this.initializeArm(arm.id)
      
      if (armState.plays === 0) {
        // Unplayed arms get infinite score
        return { ...arm, armState, reason: 'unplayed' }
      }
      
      const averageReward = armState.totalReward / armState.plays
      const confidence = Math.sqrt(2 * Math.log(totalPlays) / armState.plays)
      const ucbScore = averageReward + confidence
      
      if (ucbScore > bestScore) {
        bestScore = ucbScore
        bestArm = {
          ...arm,
          averageReward,
          confidence,
          ucbScore,
          armState
        }
      }
    }
    
    return bestArm
  }

  async updateBandit(bandit, context, selectedArm, reward) {
    const armState = bandit.arms.get(selectedArm.id) || this.initializeArm(selectedArm.id)
    
    // Update arm statistics
    armState.plays++
    armState.totalReward += reward
    armState.lastReward = reward
    armState.lastUpdate = Date.now()
    
    if (this.config.algorithm === 'LinUCB') {
      this.updateLinUCBArm(armState, context, reward)
    }
    
    // Update bandit statistics
    bandit.totalInteractions++
    bandit.totalReward += reward
    bandit.lastUpdate = Date.now()
    
    // Store updated state
    bandit.arms.set(selectedArm.id, armState)
    this.bandits.set(bandit.contextId, bandit)
    
    // Periodic model updates
    if (this.interactionCount % this.config.updateFrequency === 0) {
      await this.persistBanditStates()
    }
    
    this.interactionCount++
  }

  updateLinUCBArm(armState, context, reward) {
    // Update LinUCB parameters
    if (!armState.A) {
      armState.A = this.createIdentityMatrix(this.config.contextDimension)
      armState.b = new Array(this.config.contextDimension).fill(0)
    }
    
    // A = A + x * x^T
    for (let i = 0; i < this.config.contextDimension; i++) {
      for (let j = 0; j < this.config.contextDimension; j++) {
        armState.A[i][j] += context[i] * context[j]
      }
      // b = b + reward * x
      armState.b[i] += reward * context[i]
    }
    
    // Update A_inv and theta
    armState.A_inv = this.invertMatrix(armState.A)
    armState.theta = this.matrixVectorMultiply(armState.A_inv, armState.b)
  }

  extractBanditContext(userFeatures) {
    // Extract relevant features for bandit context
    const context = new Array(this.config.contextDimension).fill(0)
    
    // User demographic features
    context[0] = this.encodeAgeGroup(userFeatures.age_group)
    context[1] = userFeatures.follower_count ? Math.log(userFeatures.follower_count + 1) / 10 : 0
    context[2] = userFeatures.following_count ? Math.log(userFeatures.following_count + 1) / 10 : 0
    
    // Behavioral features
    context[3] = userFeatures.avg_session_length / 3600 // Normalize to hours
    context[4] = userFeatures.posts_per_week / 10
    context[5] = userFeatures.likes_per_week / 100
    context[6] = userFeatures.comments_per_week / 50
    
    // Temporal features
    const now = new Date()
    context[7] = Math.sin(2 * Math.PI * now.getHours() / 24) // Hour of day (cyclical)
    context[8] = Math.cos(2 * Math.PI * now.getHours() / 24)
    context[9] = Math.sin(2 * Math.PI * now.getDay() / 7) // Day of week (cyclical)
    context[10] = Math.cos(2 * Math.PI * now.getDay() / 7)
    
    // Ad interaction features
    context[11] = userFeatures.ad_clicks_last_7d / 10
    context[12] = userFeatures.ad_conversions_last_30d / 5
    
    // Interest embedding (first 30 dimensions)
    if (userFeatures.interest_embedding) {
      for (let i = 0; i < Math.min(30, userFeatures.interest_embedding.length); i++) {
        context[13 + i] = userFeatures.interest_embedding[i]
      }
    }
    
    // Normalize context vector
    return this.normalizeVector(context)
  }

  getContextId(context) {
    // Create context ID for bandit grouping
    // Group similar contexts together to share learning
    const discretizedContext = context.map(val => Math.round(val * 10) / 10)
    return `ctx_${discretizedContext.slice(0, 10).join('_')}`
  }

  initializeBandit(contextId, context) {
    return {
      contextId,
      context,
      arms: new Map(),
      totalInteractions: 0,
      totalReward: 0,
      createdAt: Date.now(),
      lastUpdate: Date.now()
    }
  }

  initializeArm(armId) {
    return {
      armId,
      plays: 0,
      totalReward: 0,
      lastReward: 0,
      lastUpdate: Date.now(),
      
      // LinUCB specific
      A: null,
      A_inv: null,
      b: null,
      theta: null
    }
  }

  calculateUncertainty(bandit, context) {
    if (bandit.totalInteractions < 10) return 1.0
    
    // Calculate average confidence across arms
    let totalConfidence = 0
    let armCount = 0
    
    for (const [armId, armState] of bandit.arms) {
      if (armState.A_inv) {
        const confidence = Math.sqrt(this.quadraticForm(context, armState.A_inv))
        totalConfidence += confidence
        armCount++
      }
    }
    
    return armCount > 0 ? totalConfidence / armCount : 1.0
  }

  // Matrix operations
  createIdentityMatrix(size) {
    const matrix = []
    for (let i = 0; i < size; i++) {
      matrix[i] = new Array(size).fill(0)
      matrix[i][i] = 1
    }
    return matrix
  }

  invertMatrix(matrix) {
    // Simplified matrix inversion (would use proper numerical methods in production)
    const n = matrix.length
    const identity = this.createIdentityMatrix(n)
    
    // Gauss-Jordan elimination (simplified)
    const augmented = matrix.map((row, i) => [...row, ...identity[i]])
    
    // Forward elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k
        }
      }
      
      // Swap rows
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]]
      
      // Make diagonal element 1
      const pivot = augmented[i][i]
      if (Math.abs(pivot) < 1e-10) continue // Skip if pivot is too small
      
      for (let j = 0; j < 2 * n; j++) {
        augmented[i][j] /= pivot
      }
      
      // Eliminate column
      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = augmented[k][i]
          for (let j = 0; j < 2 * n; j++) {
            augmented[k][j] -= factor * augmented[i][j]
          }
        }
      }
    }
    
    // Extract inverse matrix
    const inverse = []
    for (let i = 0; i < n; i++) {
      inverse[i] = augmented[i].slice(n)
    }
    
    return inverse
  }

  dotProduct(a, b) {
    return a.reduce((sum, val, i) => sum + val * b[i], 0)
  }

  quadraticForm(x, A) {
    // x^T * A * x
    const Ax = this.matrixVectorMultiply(A, x)
    return this.dotProduct(x, Ax)
  }

  matrixVectorMultiply(matrix, vector) {
    return matrix.map(row => this.dotProduct(row, vector))
  }

  sampleMultivariateNormal(mean, covariance) {
    // Simplified multivariate normal sampling
    const samples = mean.map((mu, i) => {
      const variance = covariance[i][i]
      return mu + Math.sqrt(variance) * this.sampleNormal()
    })
    return samples
  }

  sampleNormal() {
    // Box-Muller transform for normal sampling
    const u1 = Math.random()
    const u2 = Math.random()
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  }

  normalizeVector(vector) {
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
    return norm > 0 ? vector.map(val => val / norm) : vector
  }

  encodeAgeGroup(ageGroup) {
    const mapping = {
      'under_18': 0.1,
      '18_24': 0.3,
      '25_34': 0.5,
      '35_44': 0.7,
      '45_54': 0.9,
      '55_plus': 1.0
    }
    return mapping[ageGroup] || 0.5
  }

  async loadBanditStates() {
    // Load bandit states from database
    const { data: states } = await this.supabase
      .from('bandit_states')
      .select('*')
      .eq('status', 'active')
    
    if (states) {
      states.forEach(state => {
        this.bandits.set(state.context_id, JSON.parse(state.bandit_data))
      })
    }
  }

  async persistBanditStates() {
    // Save bandit states to database
    const updates = []
    
    for (const [contextId, bandit] of this.bandits) {
      updates.push({
        context_id: contextId,
        bandit_data: JSON.stringify(bandit),
        last_update: new Date().toISOString(),
        total_interactions: bandit.totalInteractions
      })
    }
    
    if (updates.length > 0) {
      await this.supabase
        .from('bandit_states')
        .upsert(updates, { onConflict: 'context_id' })
    }
  }
}
