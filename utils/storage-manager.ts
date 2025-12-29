import type { Ref } from 'vue'

/**
 * Storage Manager Configuration
 */
interface StorageConfig {
  prefix: string
  encrypt: boolean
  ttl?: number
  maxSize?: number
}

/**
 * Storage Item with metadata
 */
interface StorageItem<T = any> {
  value: T
  timestamp: number
  ttl?: number
  encrypted: boolean
}

/**
 * Storage Manager Class
 */
class StorageManager {
  private config: StorageConfig
  private isAvailable: boolean
  private cache: Map<string, any> = new Map()

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = {
      prefix: 'app_',
      encrypt: false,
      ttl: undefined,
      maxSize: 5 * 1024 * 1024,
      ...config
    }

    this.isAvailable = this.checkAvailability()
    
    if (this.isAvailable) {
      console.log('[StorageManager] ✅ Initialized with prefix:', this.config.prefix)
    } else {
      console.warn('[StorageManager] ⚠️ localStorage not available, using memory cache')
    }
  }

  private checkAvailability(): boolean {
    if (!process.client) return false

    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch (e) {
      console.warn('[StorageManager] localStorage not available:', e)
      return false
    }
  }

  private getKey(key: string): string {
    return `${this.config.prefix}${key}`
  }

  private isExpired(item: StorageItem): boolean {
    if (!item.ttl) return false
    return Date.now() - item.timestamp > item.ttl
  }

  public set<T = any>(key: string, value: T, ttl?: number): boolean {
    if (!process.client) return false

    try {
      const fullKey = this.getKey(key)
      
      const item: StorageItem<T> = {
        value,
        timestamp: Date.now(),
        ttl: ttl || this.config.ttl,
        encrypted: this.config.encrypt
      }

      const serialized = JSON.stringify(item)
      
      if (serialized.length > (this.config.maxSize || 5 * 1024 * 1024)) {
        console.warn('[StorageManager] ⚠️ Item too large:', key)
        return false
      }

      if (this.isAvailable) {
        try {
          localStorage.setItem(fullKey, serialized)
          console.log('[StorageManager] ✅ Set:', key)
        } catch (e) {
          console.error('[StorageManager] ❌ Failed to set in localStorage:', e)
          this.cache.set(fullKey, item)
        }
      } else {
        this.cache.set(fullKey, item)
      }

      return true
    } catch (err) {
      console.error('[StorageManager] ❌ Error setting item:', err)
      return false
    }
  }

  public get<T = any>(key: string, defaultValue?: T): T | null {
    if (!process.client) return defaultValue || null

    try {
      const fullKey = this.getKey(key)
      let serialized: string | null = null

      if (this.isAvailable) {
        try {
          serialized = localStorage.getItem(fullKey)
        } catch (e) {
          console.warn('[StorageManager] Failed to read from localStorage:', e)
        }
      }

      if (!serialized && this.cache.has(fullKey)) {
        const item = this.cache.get(fullKey)
        serialized = JSON.stringify(item)
      }

      if (!serialized) {
        return defaultValue || null
      }

      const item: StorageItem<T> = JSON.parse(serialized)

      if (this.isExpired(item)) {
        console.log('[StorageManager] Item expired:', key)
        this.remove(key)
        return defaultValue || null
      }

      console.log('[StorageManager] ✅ Get:', key)
      return item.value
    } catch (err) {
      console.error('[StorageManager] ❌ Error getting item:', err)
      return defaultValue || null
    }
  }

  public remove(key: string): boolean {
    if (!process.client) return false

    try {
      const fullKey = this.getKey(key)

      if (this.isAvailable) {
        try {
          localStorage.removeItem(fullKey)
        } catch (e) {
          console.warn('[StorageManager] Failed to remove from localStorage:', e)
        }
      }

      this.cache.delete(fullKey)
      console.log('[StorageManager] ✅ Removed:', key)
      return true
    } catch (err) {
      console.error('[StorageManager] ❌ Error removing item:', err)
      return false
    }
  }

  public clear(): boolean {
    if (!process.client) return false

    try {
      if (this.isAvailable) {
        try {
          const keys = Object.keys(localStorage)
          keys.forEach(key => {
            if (key.startsWith(this.config.prefix)) {
              localStorage.removeItem(key)
            }
          })
        } catch (e) {
          console.warn('[StorageManager] Failed to clear localStorage:', e)
        }
      }

      const keysToDelete: string[] = []
      this.cache.forEach((_, key) => {
        if (key.startsWith(this.config.prefix)) {
          keysToDelete.push(key)
        }
      })
      keysToDelete.forEach(key => this.cache.delete(key))

      console.log('[StorageManager] ✅ Cleared all items')
      return true
    } catch (err) {
      console.error('[StorageManager] ❌ Error clearing storage:', err)
      return false
    }
  }

  public keys(): string[] {
    if (!process.client) return []

    try {
      const keys: string[] = []

      if (this.isAvailable) {
        try {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.config.prefix)) {
              keys.push(key.replace(this.config.prefix, ''))
            }
          })
        } catch (e) {
          console.warn('[StorageManager] Failed to get keys from localStorage:', e)
        }
      }

      this.cache.forEach((_, key) => {
        if (key.startsWith(this.config.prefix)) {
          const cleanKey = key.replace(this.config.prefix, '')
          if (!keys.includes(cleanKey)) {
            keys.push(cleanKey)
          }
        }
      })

      return keys
    } catch (err) {
      console.error('[StorageManager] ❌ Error getting keys:', err)
      return []
    }
  }

  public getSize(): number {
    if (!process.client) return 0

    try {
      let size = 0

      if (this.isAvailable) {
        try {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.config.prefix)) {
              size += localStorage.getItem(key)?.length || 0
            }
          })
        } catch (e) {
          console.warn('[StorageManager] Failed to calculate size:', e)
        }
      }

      return size
    } catch (err) {
      console.error('[StorageManager] ❌ Error getting size:', err)
      return 0
    }
  }

  public cleanup(): number {
    if (!process.client) return 0

    try {
      let cleaned = 0
      const keys = this.keys()

      keys.forEach(key => {
        const value = this.get(key)
        if (value === null) {
          cleaned++
        }
      })

      console.log('[StorageManager] ✅ Cleanup complete, removed:', cleaned, 'items')
      return cleaned
    } catch (err) {
      console.error('[StorageManager] ❌ Error during cleanup:', err)
      return 0
    }
  }

  public getInfo(): {
    available: boolean
    size: number
    maxSize: number
    itemCount: number
    keys: string[]
  } {
    return {
      available: this.isAvailable,
      size: this.getSize(),
      maxSize: this.config.maxSize || 5 * 1024 * 1024,
      itemCount: this.keys().length,
      keys: this.keys()
    }
  }
}

let storageManager: StorageManager | null = null

export function useStorage(config?: Partial<StorageConfig>): StorageManager {
  if (!storageManager) {
    storageManager = new StorageManager(config)
  }
  return storageManager
}

export default StorageManager
