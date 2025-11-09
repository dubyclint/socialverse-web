// Model prediction caching system
import Redis from 'ioredis'

export class ModelCache {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
    this.keyPrefix = 'ml_cache:'
    this.defaultTTL = 300 // 5 minutes
    
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      errors: 0
    }
  }

  async get(key) {
    try {
      const fullKey = this.keyPrefix + key
      const cached = await this.redis.get(fullKey)
      
      if (cached) {
        this.stats.hits++
        return JSON.parse(cached)
      } else {
        this.stats.misses++
        return null
      }
    } catch (error) {
      this.stats.errors++
      console.error('Cache get error:', error)
      return null
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      const fullKey = this.keyPrefix + key
      await this.redis.setex(fullKey, ttl, JSON.stringify(value))
      this.stats.sets++
      return true
    } catch (error) {
      this.stats.errors++
      console.error('Cache set error:', error)
      return false
    }
  }

  async mget(keys) {
    try {
      const fullKeys = keys.map(key => this.keyPrefix + key)
      const results = await this.redis.mget(fullKeys)
      
      return results.map((result, index) => {
        if (result) {
          this.stats.hits++
          return JSON.parse(result)
        } else {
          this.stats.misses++
          return null
        }
      })
    } catch (error) {
      this.stats.errors++
      console.error('Cache mget error:', error)
      return keys.map(() => null)
    }
  }

  async mset(keyValuePairs, ttl = this.defaultTTL) {
    try {
      const pipeline = this.redis.pipeline()
      
      keyValuePairs.forEach(([key, value]) => {
        const fullKey = this.keyPrefix + key
        pipeline.setex(fullKey, ttl, JSON.stringify(value))
      })
      
      await pipeline.exec()
      this.stats.sets += keyValuePairs.length
      return true
    } catch (error) {
      this.stats.errors++
      console.error('Cache mset error:', error)
      return false
    }
  }

  async invalidate(pattern) {
    try {
      const keys = await this.redis.keys(this.keyPrefix + pattern)
      if (keys.length > 0) {
        await this.redis.del(keys)
      }
      return keys.length
    } catch (error) {
      this.stats.errors++
      console.error('Cache invalidate error:', error)
      return 0
    }
  }

  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? this.stats.hits / (this.stats.hits + this.stats.misses) 
      : 0

    return {
      ...this.stats,
      hitRate: hitRate.toFixed(3)
    }
  }

  resetStats() {
    this.stats = { hits: 0, misses: 0, sets: 0, errors: 0 }
  }
}
