// Feature Store - Unified feature management for training & serving
import Redis from 'ioredis'
import { createClient } from '@supabase/supabase-js'

export class FeatureStore {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    )
    
    this.featureConfig = {
      userFeatures: {
        ttl: 3600, // 1 hour
        keys: ['demographics', 'interests', 'behavior', 'social_graph']
      },
      itemFeatures: {
        ttl: 86400, // 24 hours
        keys: ['content_embedding', 'metadata', 'engagement_stats']
      },
      contextFeatures: {
        ttl: 300, // 5 minutes
        keys: ['recent_actions', 'session_data', 'device_info']
      }
    }
  }

  async initialize() {
    await this.redis.ping()
    console.log('✅ Feature Store connected to Redis')
  }

  async getUserFeatures(userId) {
    const cacheKey = `user_features:${userId}`
    
    // Try cache first
    const cached = await this.redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }
    
    // Compute features from database
    const features = await this.computeUserFeatures(userId)
    
    // Cache with TTL
    await this.redis.setex(
      cacheKey, 
      this.featureConfig.userFeatures.ttl, 
      JSON.stringify(features)
    )
    
    return features
  }

  async computeUserFeatures(userId) {
    const [profile, interactions, socialGraph, recentActivity] = await Promise.all([
      this.getUserProfile(userId),
      this.getUserInteractions(userId),
      this.getUserSocialGraph(userId),
      this.getRecentActivity(userId)
    ])

    return {
      // Demographics
      age_group: this.getAgeGroup(profile.age),
      location: profile.location,
      join_date: profile.created_at,
      
      // Behavioral features
      avg_session_length: interactions.avg_session_length,
      posts_per_week: interactions.posts_per_week,
      likes_per_week: interactions.likes_per_week,
      comments_per_week: interactions.comments_per_week,
      
      // Interest signals
      top_categories: interactions.top_categories,
      interest_embedding: await this.computeInterestEmbedding(interactions),
      
      // Social features
      follower_count: socialGraph.follower_count,
      following_count: socialGraph.following_count,
      mutual_connections: socialGraph.mutual_connections,
      
      // Temporal features
      most_active_hours: recentActivity.most_active_hours,
      last_seen: recentActivity.last_seen,
      session_count_today: recentActivity.session_count_today,
      
      // Ad-specific features
      ad_clicks_last_7d: interactions.ad_clicks_last_7d,
      ad_conversions_last_30d: interactions.ad_conversions_last_30d,
      avg_time_between_ad_clicks: interactions.avg_time_between_ad_clicks,
      
      // Computed at request time
      timestamp: Date.now()
    }
  }

  async getItemFeatures(itemId, itemType = 'post') {
    const cacheKey = `item_features:${itemType}:${itemId}`
    
    const cached = await this.redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }
    
    const features = await this.computeItemFeatures(itemId, itemType)
    
    await this.redis.setex(
      cacheKey,
      this.featureConfig.itemFeatures.ttl,
      JSON.stringify(features)
    )
    
    return features
  }

  async computeItemFeatures(itemId, itemType) {
    if (itemType === 'post') {
      return this.computePostFeatures(itemId)
    } else if (itemType === 'ad') {
      return this.computeAdFeatures(itemId)
    }
  }

  async computePostFeatures(postId) {
    const { data: post } = await this.supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id(username, follower_count),
        post_stats(likes, comments, shares, views)
      `)
      .eq('id', postId)
      .single()

    if (!post) return null

    // Text embedding (would use actual embedding service)
    const textEmbedding = await this.getTextEmbedding(post.content)
    
    return {
      // Content features
      text_length: post.content?.length || 0,
      has_media: !!post.media_url,
      media_type: post.media_type,
      text_embedding: textEmbedding,
      
      // Engagement features
      like_rate: post.post_stats?.likes || 0,
      comment_rate: post.post_stats?.comments || 0,
      share_rate: post.post_stats?.shares || 0,
      view_rate: post.post_stats?.views || 0,
      
      // Author features
      author_follower_count: post.profiles?.follower_count || 0,
      author_reputation: await this.getAuthorReputation(post.user_id),
      
      // Temporal features
      age_hours: (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60),
      created_hour: new Date(post.created_at).getHours(),
      
      // Category/topic features
      predicted_category: await this.predictContentCategory(post.content),
      hashtags: this.extractHashtags(post.content),
      
      timestamp: Date.now()
    }
  }

  async computeAdFeatures(adId) {
    const { data: ad } = await this.supabase
      .from('ads')
      .select(`
        *,
        ad_campaigns(*),
        ad_stats(impressions, clicks, conversions, spend)
      `)
      .eq('id', adId)
      .single()

    if (!ad) return null

    return {
      // Campaign features
      campaign_type: ad.ad_campaigns?.type,
      bid_amount: ad.bid_amount,
      daily_budget: ad.ad_campaigns?.daily_budget,
      target_audience: ad.target_audience,
      
      // Performance features
      historical_ctr: this.calculateCTR(ad.ad_stats),
      historical_cvr: this.calculateCVR(ad.ad_stats),
      cost_per_click: this.calculateCPC(ad.ad_stats),
      
      // Creative features
      ad_format: ad.format,
      has_video: ad.creative_type === 'video',
      text_length: ad.ad_text?.length || 0,
      
      // Targeting features
      age_targeting: ad.target_audience?.age_range,
      location_targeting: ad.target_audience?.locations,
      interest_targeting: ad.target_audience?.interests,
      
      timestamp: Date.now()
    }
  }

  // Helper methods
  async getTextEmbedding(text) {
    // In production, use actual embedding service (OpenAI, Cohere, etc.)
    // For now, return mock embedding
    return new Array(384).fill(0).map(() => Math.random() - 0.5)
  }

  async predictContentCategory(content) {
    // Mock category prediction - in production use ML model
    const categories = ['tech', 'lifestyle', 'business', 'entertainment', 'sports']
    return categories[Math.floor(Math.random() * categories.length)]
  }

  extractHashtags(content) {
    if (!content) return []
    return content.match(/#\w+/g) || []
  }

  getAgeGroup(age) {
    if (age < 18) return 'under_18'
    if (age < 25) return '18_24'
    if (age < 35) return '25_34'
    if (age < 45) return '35_44'
    if (age < 55) return '45_54'
    return '55_plus'
  }

  calculateCTR(stats) {
    if (!stats || !stats.impressions) return 0
    return stats.clicks / stats.impressions
  }

  calculateCVR(stats) {
    if (!stats || !stats.clicks) return 0
    return stats.conversions / stats.clicks
  }

  calculateCPC(stats) {
    if (!stats || !stats.clicks) return 0
    return stats.spend / stats.clicks
  }

  // Database query methods
  async getUserProfile(userId) {
    const { data } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return data
  }

  async getUserInteractions(userId) {
    // Complex query to get user interaction patterns
    const { data } = await this.supabase.rpc('get_user_interaction_stats', {
      user_id: userId,
      days_back: 30
    })
    return data
  }

  async getUserSocialGraph(userId) {
    const { data } = await this.supabase.rpc('get_user_social_stats', {
      user_id: userId
    })
    return data
  }

  async getRecentActivity(userId) {
    const { data } = await this.supabase.rpc('get_recent_activity_stats', {
      user_id: userId,
      hours_back: 24
    })
    return data
  }

  async getAuthorReputation(userId) {
    // Calculate author reputation score
    const { data } = await this.supabase.rpc('calculate_author_reputation', {
      user_id: userId
    })
    return data?.reputation_score || 0
  }
}
