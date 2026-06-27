import Redis from 'ioredis';

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  errors: number;
}

export class ModelCache {
  private redis: Redis;
  private keyPrefix: string;
  private defaultTTL: number;
  private stats: CacheStats;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.keyPrefix = 'ml_cache:';
    this.defaultTTL = 300;

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      errors: 0
    };
  }

  async get(key: string): Promise<any | null> {
    try {
      const fullKey = this.keyPrefix + key;
      const cached = await this.redis.get(fullKey);

      if (cached) {
        this.stats.hits++;
        return JSON.parse(cached);
      } else {
        this.stats.misses++;
        return null;
      }
    } catch (error) {
      this.stats.errors++;
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<boolean> {
    try {
      const fullKey = this.keyPrefix + key;
      await this.redis.setex(fullKey, ttl, JSON.stringify(value));
      this.stats.sets++;
      return true;
    } catch (error) {
      this.stats.errors++;
      console.error('Cache set error:', error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const fullKey = this.keyPrefix + key;
      await this.redis.del(fullKey);
      return true;
    } catch (error) {
      this.stats.errors++;
      console.error('Cache delete error:', error);
      return false;
    }
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }
}
