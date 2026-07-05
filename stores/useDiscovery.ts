// stores/useDiscovery.ts
import { defineStore } from 'pinia'
import { discoveryService } from '~/services/discovery'

export const useDiscoveryStore = defineStore('discovery', {
  state: () => ({
    feed: [],
    loading: false
  }),
  actions: {
    async warmupFeed() {
      this.loading = true
      this.feed = await discoveryService.getFeed()
      this.loading = false
    }
  }
})
