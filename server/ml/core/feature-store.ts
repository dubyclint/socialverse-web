// FILE: /server/ml/core/feature-store.ts
// ============================================================================
// Feature Store for ML Service
// REFACTORED: Lazy-load Supabase to prevent bundling issues
// ============================================================================

import Redis from 'ioredis'
import type { SupabaseClient } from '@supabase/supabase-js'

interface FeatureConfig {
  ttl: number
  keys: string[]
}

interface FeatureStoreConfig {
  userFeatures: FeatureConfig
  itemFeatures: FeatureConfig
  contextFeatures: FeatureConfig
}

// ============================================================================
// LAZY-LOADED SUPABASE CLIENT
// ============================================================================
let supabaseInstance: SupabaseClient | null = null

async function getSupabaseClient(): Promise<SupabaseClient> {
  if (supabaseInstance) {
    return supabaseInstance
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    
    supabaseInstance = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )
    
    return supabaseInstance
  } catch (error) {
    console.error('[FeatureStore] Failed to initialize Supabase:', error)
    throw new Error('Supabase initialization failed')
  }
}

export class FeatureStore {
  private redis: Redis
  private supabase: SupabaseClient | null = null
  private featureConfig: FeatureStoreConfig

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
    
    this.featureConfig = {
      userFeatures: {
        ttl: 3600,
        keys: ['demographics', 'interests', 'behavior', 'social_graph']
      },
      itemFeatures: {
        ttl: 86400,
        keys: ['content_embedding', 'metadata', 'engagement_stats']
      },
      contextFeatures: {
        ttl: 300,
        keys: ['recent_actions', 'session_data', 'device_info']
      }
    }
  }

  async initialize(): Promise<void> {
    try {
      await this.redis.ping()
      console.log('✅ Feature Store connected to Redis')
      
      // Initialize Supabase on first use
      this.supabase = await getSupabaseClient()
      console.log('✅ Feature Store connected to Supabase')
    } catch (error) {
      console.error('[FeatureStore] Initialization error:', error)
      throw error
    }
  }

  private async ensureSupabase(): Promise<SupabaseClient> {
    if (!this.supabase) {
      this.supabase = await getSupabaseClient()
    }
    return this.supabase
  }

  async getUserFeatures(userId: string): Promise<any> {
    const cacheKey = `user_features:${userId}`

    try {
      const cached = await this.redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }
    } catch (error) {
      console.error('[FeatureStore] Cache get error:', error)
    }

    // Fetch from database
    try {
      const supabase = await this.ensureSupabase()
      const features = await this.fetchUserFeaturesFromDB(supabase, userId)
      
      // Cache the result
      try {
        await this.redis.setex(cacheKey, this.featureConfig.userFeatures.ttl, JSON.stringify(features))
      } catch (cacheError) {
        console.warn('[FeatureStore] Cache set error:', cacheError)
      }
      
      return features
    } catch (error) {
      console.error('[FeatureStore] Error fetching user features:', error)
      throw error
    }
  }

  private async fetchUserFeaturesFromDB(supabase: SupabaseClient, userId: string): Promise<any> {
    // Implementation here
    const { data, error } = await supabase
      .from('user_features')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('[FeatureStore] Database error:', error)
      throw error
    }

    return data
  }

  // ... rest of the methods follow the same pattern
}
