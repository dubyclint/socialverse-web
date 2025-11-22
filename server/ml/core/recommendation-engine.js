// Recommendation Engine - Content candidate generation and ranking
import { TensorFlowModel } from './tensor-flow-model.js'

export class RecommendationEngine {
  constructor() {
    this.candidateModel = new TensorFlowModel('candidate_generation')
    this.rankingModel = new TensorFlowModel('ranking')
    this.embeddingModel = new TensorFlowModel('embeddings')
    
    this.config = {
      maxCandidates: 1000,
      finalFeedSize: 50,
      diversityThreshold: 0.7,
      freshnessWeight: 0.3,
      popularityWeight: 0.2,
      personalizedWeight: 0.5
    }
  }

  async initialize() {
    await Promise.all([
      this.candidateModel.load(),
      this.rankingModel.load(),
      this.embeddingModel.load()
    ])
    console.log('✅ Recommendation Engine models loaded')
  }

  async generateCandidates(userId, userFeatures, contextFeatures) {
    // Multi-stage candidate generation
    const candidates = await Promise.all([
      this.getCollaborativeFilteringCandidates(userId, userFeatures),
      this.getContentBasedCandidates(userFeatures),
      this.getPopularityCandidates(contextFeatures),
      this.getSocialGraphCandidates(userId, userFeatures),
      this.getTrendingCandidates(contextFeatures)
    ])

    // Flatten and deduplicate
    const allCandidates = this.deduplicateCandidates(candidates.flat())
    
    // Apply initial filtering
    const filteredCandidates = await this.applyInitialFilters(
      allCandidates, 
      userId, 
      userFeatures
    )

    return filteredCandidates.slice(0, this.config.maxCandidates)
  }

  async getCollaborativeFilteringCandidates(userId, userFeatures) {
    // Two-tower model for user-item similarity
    const userEmbedding = await this.embeddingModel.getUserEmbedding(userId)
    
    // Find similar users
    const similarUsers = await this.findSimilarUsers(userEmbedding, 100)
    
    // Get items liked by similar users
    const candidates = []
    for (const similarUser of similarUsers) {
      const recentLikes = await this.getUserRecentLikes(similarUser.id, 20)
      candidates.push(...recentLikes.map(item => ({
        ...item,
        source: 'collaborative_filtering',
        similarity_score: similarUser.similarity,
        score: item.engagement_score * similarUser.similarity
      })))
    }

    return candidates.sort((a, b) => b.score - a.score).slice(0, 200)
  }

  async getContentBasedCandidates(userFeatures) {
    // Content-based filtering using user interests
    const userInterests = userFeatures.interest_embedding
    const topCategories = userFeatures.top_categories || []
    
    const candidates = []
    
    // Get items from user's top categories
    for (const category of topCategories.slice(0, 5)) {
      const categoryItems = await this.getItemsByCategory(category, 50)
      candidates.push(...categoryItems.map(item => ({
        ...item,
        source: 'content_based',
        category_match: category,
        score: item.engagement_score * 0.8 // Slight discount for content-based
      })))
    }

    // Get items with similar embeddings
    if (userInterests && userInterests.length > 0) {
      const similarItems = await this.findSimilarContent(userInterests, 100)
      candidates.push(...similarItems.map(item => ({
        ...item,
        source: 'content_similarity',
        score: item.similarity_score * item.engagement_score
      })))
    }

    return candidates.sort((a, b) => b.score - a.score).slice(0, 200)
  }

  async getPopularityCandidates(contextFeatures) {
    // Get trending/popular content based on context
    const timeWindow = this.getTimeWindow(contextFeatures)
    const location = contextFeatures.location
    
    const popularItems = await this.getPopularItems({
      timeWindow,
      location,
      limit: 100
    })

    return popularItems.map(item => ({
      ...item,
      source: 'popularity',
      score: item.popularity_score * this.config.popularityWeight
    }))
  }

  async getSocialGraphCandidates(userId, userFeatures) {
    // Get content from user's social network
    const following = await this.getUserFollowing(userId, 200)
    const candidates = []

    for (const followedUser of following) {
      const recentPosts = await this.getUserRecentPosts(followedUser.id, 10)
      candidates.push(...recentPosts.map(post => ({
        ...post,
        source: 'social_graph',
        author_relationship: 'following',
        score: post.engagement_score * 1.2 // Boost for social connections
      })))
    }

    return candidates.sort((a, b) => b.score - a.score).slice(0, 200)
  }

  async getTrendingCandidates(contextFeatures) {
    // Get trending content based on recent engagement spikes
    const trendingItems = await this.getTrendingItems({
      hours: 24,
      min_engagement_increase: 2.0,
      limit: 50
    })

    return trendingItems.map(item => ({
      ...item,
      source: 'trending',
      trend_score: item.engagement_velocity,
      score: item.engagement_velocity * this.config.freshnessWeight
    }))
  }

  async rankCandidates(candidates, userFeatures, contextFeatures) {
    // Prepare features for ranking model
    const rankedCandidates = await Promise.all(
      candidates.map(async (candidate) => {
        const itemFeatures = await this.getItemFeatures(candidate.id, candidate.type)
        
        // Combine user, item, and context features
        const combinedFeatures = this.combineFeatures(
          userFeatures,
          itemFeatures,
          contextFeatures,
          candidate
        )

        // Get prediction from ranking model
        const prediction = await this.rankingModel.predict(combinedFeatures)
        
        return {
          ...candidate,
          ranking_score: prediction.engagement_probability,
          combined_score: this.calculateCombinedScore(candidate, prediction),
          features: combinedFeatures
        }
      })
    )

    return rankedCandidates.sort((a, b) => b.combined_score - a.combined_score)
  }

  calculateCombinedScore(candidate, prediction) {
    const baseScore = candidate.score || 0
    const mlScore = prediction.engagement_probability
    const diversityBonus = this.calculateDiversityBonus(candidate)
    const freshnessBonus = this.calculateFreshnessBonus(candidate)
    
    return (
      baseScore * 0.3 +
      mlScore * 0.5 +
      diversityBonus * 0.1 +
      freshnessBonus * 0.1
    )
  }

  calculateDiversityBonus(candidate) {
    // Bonus for content that adds diversity to the feed
    // This would be more sophisticated in production
    return Math.random() * 0.2
  }

  calculateFreshnessBonus(candidate) {
    if (!candidate.created_at) return 0
    
    const ageHours = (Date.now() - new Date(candidate.created_at).getTime()) / (1000 * 60 * 60)
    
    // Fresher content gets higher bonus
    if (ageHours < 1) return 0.3
    if (ageHours < 6) return 0.2
    if (ageHours < 24) return 0.1
    return 0
  }

  combineFeatures(userFeatures, itemFeatures, contextFeatures, candidate) {
    return {
      // User features
      user_age_group: userFeatures.age_group,
      user_avg_session_length: userFeatures.avg_session_length,
      user_posts_per_week: userFeatures.posts_per_week,
      user_follower_count: userFeatures.follower_count,
      
      // Item features
      item_age_hours: itemFeatures?.age_hours || 0,
      item_like_rate: itemFeatures?.like_rate || 0,
      item_comment_rate: itemFeatures?.comment_rate || 0,
      item_author_follower_count: itemFeatures?.author_follower_count || 0,
      
      // Context features
      hour_of_day: contextFeatures.hour,
      day_of_week: contextFeatures.dayOfWeek,
      device_type: contextFeatures.deviceType,
      
      // Interaction features
      user_item_similarity: this.calculateUserItemSimilarity(userFeatures, itemFeatures),
      source_type: candidate.source,
      
      // Temporal features
      time_since_last_interaction: contextFeatures.sessionLength
    }
  }

  calculateUserItemSimilarity(userFeatures, itemFeatures) {
    // Calculate cosine similarity between user interests and item content
    if (!userFeatures.interest_embedding || !itemFeatures?.text_embedding) {
      return 0
    }
    
    return this.cosineSimilarity(
      userFeatures.interest_embedding,
      itemFeatures.text_embedding
    )
  }

  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) return 0
    
    let dotProduct = 0
    let normA = 0
    let normB = 0
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i]
      normA += vecA[i] * vecA[i]
      normB += vecB[i] * vecB[i]
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  deduplicateCandidates(candidates) {
    const seen = new Set()
    return candidates.filter(candidate => {
      const key = `${candidate.type}:${candidate.id}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  async applyInitialFilters(candidates, userId, userFeatures) {
    // Filter out content user has already seen
    const seenContent = await this.getUserSeenContent(userId, 7) // Last 7 days
    const seenIds = new Set(seenContent.map(item => item.id))
    
    return candidates.filter(candidate => {
      // Remove already seen content
      if (seenIds.has(candidate.id)) return false
      
      // Remove blocked users' content
      if (userFeatures.blocked_users?.includes(candidate.user_id)) return false
      
      // Remove inappropriate content based on user preferences
      if (candidate.content_rating > userFeatures.max_content_rating) return false
      
      return true
    })
  }

  // Helper methods for database queries
  async findSimilarUsers(userEmbedding, limit) {
    // In production, use vector similarity search (FAISS, Pinecone, etc.)
    // Mock implementation
    return Array.from({ length: limit }, (_, i) => ({
      id: `user_${i}`,
      similarity: Math.random()
    })).sort((a, b) => b.similarity - a.similarity)
  }

  async getUserRecentLikes(userId, limit) {
    // Query user's recent likes from database
    return []
  }

  async getItemsByCategory(category, limit) {
    // Query items by category
    return []
  }

  async findSimilarContent(embedding, limit) {
    // Find content with similar embeddings
    return []
  }

  async getPopularItems(options) {
    // Get popular items based on engagement metrics
    return []
  }

  async getUserFollowing(userId, limit) {
    // Get users that this user follows
    return []
  }

  async getUserRecentPosts(userId, limit) {
    // Get recent posts from a user
    return []
  }

  async getTrendingItems(options) {
    // Get trending items based on engagement velocity
    return []
  }

  async getUserSeenContent(userId, days) {
    // Get content user has seen in the last N days
    return []
  }

  getTimeWindow(contextFeatures) {
    // Determine appropriate time window based on context
    return '24h'
  }
}
