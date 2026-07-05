// stores/useDiscovery.ts
import { defineStore } from 'pinia'
import { discoveryService } from '~/services/discovery'

interface DiscoveryItem {
  id: string
  type: 'match' | 'ad' | 'system'
  content: any
}

export const useDiscoveryStore = defineStore('discovery', {
  state: () => ({
    feed: [] as DiscoveryItem[],
    loading: false,
    lastFetched: null as number | null
  }),

  actions: {
    async warmupFeed() {
      if (this.loading) return
      
      this.loading = true
      try {
        // 1. Fetch data from our Layered Priority Pipeline
        const rawData = await discoveryService.getFeed()
        
        // 2. Map the data to a UI-friendly structure
        // This ensures the frontend feed loop is always consistent
        this.feed = rawData.map((item: any) => ({
          id: item.id || crypto.randomUUID(),
          type: item.is_ad ? 'ad' : 'match',
          content: item
        }))
        
        this.lastFetched = Date.now()
      } catch (err) {
        console.error("Discovery Engine Error:", err)
        // Handle fallback if necessary
        this.feed = []
      } finally {
        this.loading = false
      }
    },

    // Refresh feed without blocking UI
    async refreshFeed() {
      await this.warmupFeed()
    }
  }
})
