// services/match.ts
const apiLocal = (globalThis as any).api ?? (async () => { throw new Error('api helper not available') })

export const matchService = {
  async submitIntent(interestId: string) {
    return await apiLocal('/match/submit', { 
      method: 'POST', 
      body: { interestId } 
    })
  },
  
  // This triggers the logic: Verified -> Auto-Match, Else -> Admin Queue
  async getStatus() {
    return await apiLocal('/match/status')
  }
}
