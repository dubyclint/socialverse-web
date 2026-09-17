// services/discovery.ts
const $fetchLocal = (globalThis as any).$fetch ?? (async () => { throw new Error('$fetch not available') })

export const discoveryService = {
  // Fetch the ranked feed
  getFeed: async () => {
  return await $fetchLocal('/api/discovery/feed')
  },
  
  // Track interest interactions for the GIN-index discovery
  trackInterest: async (interestTag: string) => {
    return await $fetchLocal('/api/discovery/track', {
      method: 'POST',
      body: { tag: interestTag }
    })
  }
}
