// services/match.ts
export const matchService = {
  async submitIntent(interestId: string) {
    return await api('/match/submit', { 
      method: 'POST', 
      body: { interestId } 
    })
  },
  
  // This triggers the logic: Verified -> Auto-Match, Else -> Admin Queue
  async getStatus() {
    return await api('/match/status')
  }
}
