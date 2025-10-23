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
      return state.cache[userId] || null
    }
  },

  actions: {
    async fetchRank(userId: string): Promise<RankData> {
      if (this.cache[userId]) {
        return this.cache[userId]
      }

      try {
        this.loading = true
        this.error = null
        
        const response = await fetch(`/api/rank/get?userId=${encodeURIComponent(userId)}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch rank: ${response.statusText}`)
        }
        
        const data: RankData = await response.json()
        this.cache[userId] = data
        return data
      } catch (error: any) {
        console.error('Rank fetch error:', error)
        this.error = error.message || 'Failed to fetch rank'
        return { rank: 'Unknown', points: 0, level: 0 }
      } finally {
        this.loading = false
      }
    },

    clearCache() {
      this.cache = {}
    }
  }
})
