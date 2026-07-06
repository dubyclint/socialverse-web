// services/discovery.ts
export const discoveryService = {
  // Fetch the ranked feed
  getFeed: async () => {
    return await $fetch('/api/discovery/feed')
  },
  
  // Track interest interactions for the GIN-index discovery
  trackInterest: async (interestTag: string) => {
    return await $fetch('/api/discovery/track', {
      method: 'POST',
      body: { tag: interestTag }
    })
  }
}
