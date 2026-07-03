// ============================================================================
// FILE: /services/chatCacheService.ts
// ============================================================================
export const chatCacheService = {
  /**
   * Saves a state snapshot to localStorage.
   */
  save(key: string, data: any) {
    try {
      const serialized = JSON.stringify({
        ...data,
        _timestamp: Date.now()
      })
      localStorage.setItem(key, serialized)
    } catch (err) {
      console.error('[ChatCache] Persistence error:', err)
    }
  },

  /**
   * Retrieves a state snapshot.
   */
  load(key: string) {
    try {
      const cached = localStorage.getItem(key)
      return cached ? JSON.parse(cached) : null
    } catch (err) {
      console.error('[ChatCache] Retrieval error:', err)
      return null
    }
  },

  /**
   * Clears specific cache keys.
   */
  remove(key: string) {
    try {
      localStorage.removeItem(key)
    } catch (err) {
      console.error('[ChatCache] Removal error:', err)
    }
  }
}
