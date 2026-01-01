// ============================================================================
// FIXED: /stores/rank.ts
// ============================================================================
// RANK STORE - FIXED: Better error handling and logging
// ✅ FIXED: Improved error handling
// ✅ FIXED: Better logging for debugging
// ✅ FIXED: Proper TypeScript types
// ============================================================================

import { defineStore } from 'pinia'

interface RankData {
  rank: string
  points: number
  level: number
  next?: string
  nextLevelPoints?: number
  hidden?: boolean
}

interface RankState {
  cache: Record<string, RankData>
  loading: boolean
  error: string | null
}

export const useRankStore = defineStore('rank', {
  state: (): RankState => ({
    cache: {},
    loading: false,
    error: null
  }),

  getters: {
    getRankData: (state) => (userId: string): RankData | null => {
      console.log('[Rank Store] Getting cached rank for user:', userId)
      return state.cache[userId] || null
    },

    isLoading: (state) => state.loading,

    getError: (state) => state.error
  },

  actions: {
    async fetchRank(userId: string): Promise<RankData> {
      console.log('[Rank Store] Fetching rank for user:', userId)

      // ============================================================================
      // STEP 1: Check cache first
      // ============================================================================
      if (this.cache[userId]) {
        console.log('[Rank Store] ✅ Rank found in cache for user:', userId)
        return this.cache[userId]
      }

      try {
        this.loading = true
        this.error = null

        console.log('[Rank Store] Calling API: /api/rank/get?userId=' + userId)

        // ============================================================================
        // STEP 2: Fetch from API
        // ============================================================================
        const response = await fetch(`/api/rank/get?userId=${encodeURIComponent(userId)}`)

        console.log('[Rank Store] API Response status:', response.status)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('[Rank Store] ❌ API error:', response.status, errorText)
          throw new Error(`Failed to fetch rank: ${response.status} ${response.statusText}`)
        }

        const responseData = await response.json()
        console.log('[Rank Store] API Response data:', responseData)

        // ============================================================================
        // STEP 3: Extract rank data
        // ============================================================================
        const data: RankData = responseData.data || {
          rank: 'Bronze I',
          points: 0,
          level: 1
        }

        console.log('[Rank Store] ✅ Rank fetched successfully:', data.rank)

        // ============================================================================
        // STEP 4: Cache the data
        // ============================================================================
        this.cache[userId] = data
        console.log('[Rank Store] ✅ Rank cached for user:', userId)

        return data
      } catch (error: any) {
        const errorMsg = error.message || 'Failed to fetch rank'
        console.error('[Rank Store] ❌ Error:', errorMsg)
        this.error = errorMsg

        // ============================================================================
        // STEP 5: Return default rank on error
        // ============================================================================
        const defaultRank: RankData = {
          rank: 'Bronze I',
          points: 0,
          level: 1
        }

        console.log('[Rank Store] Returning default rank due to error')
        return defaultRank
      } finally {
        this.loading = false
      }
    },

    /**
     * Clear all cached rank data
     */
    clearCache() {
      console.log('[Rank Store] Clearing all cached rank data')
      this.cache = {}
    },

    /**
     * Clear cached rank for specific user
     */
    clearUserCache(userId: string) {
      console.log('[Rank Store] Clearing cached rank for user:', userId)
      delete this.cache[userId]
    },

    /**
     * Set error message
     */
    setError(error: string | null) {
      console.log('[Rank Store] Setting error:', error)
      this.error = error
    },

    /**
     * Manually set rank data (for updates)
     */
    setRankData(userId: string, rankData: RankData) {
      console.log('[Rank Store] Manually setting rank data for user:', userId, rankData)
      this.cache[userId] = rankData
    }
  }
})
