// services/discovery.ts
import type { DiscoveryFeedResponse } from '~/types/discovery'

export const discoveryService = {
  // Fetch the ranked feed
  getFeed: async (): Promise<DiscoveryFeedResponse> => {
    return await $fetch<DiscoveryFeedResponse>('/api/discovery/feed')
  },

  // Track interest interactions for the GIN-index discovery
  trackInterest: async (interestTag: string) => {
    return await $fetch('/api/discovery/track', {
      method: 'POST',
      body: { tag: interestTag }
    })
  }
}
