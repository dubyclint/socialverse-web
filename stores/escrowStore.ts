// stores/escrowStore.ts
export const useEscrowStore = defineStore('escrow', {
  state: () => ({
    activeDisputes: [],
    loading: false
  }),
  actions: {
    async resolveDispute(txId: string, disputeId: string, action: 'released' | 'refunded') {
      this.loading = true
      try {
        const { data, error } = await $fetch('/api/admin/resolve-dispute', {
          method: 'POST',
          body: { transactionId: txId, disputeId, disputeId, action }
        })
        if (error) throw error
        // Update local state by removing the resolved dispute
        this.activeDisputes = this.activeDisputes.filter(d => d.id !== disputeId)
      } finally {
        this.loading = false
      }
    }
  }
})
