import { defineStore } from 'pinia'
import { useSupabaseClient } from '~/composables/useSupabaseClient'

export const useEscrowStore = defineStore('escrow', {
  state: () => ({
    activeDisputes: [] as any[],
    loading: false
  }),
  actions: {
    async resolveDispute(txId: string, disputeId: string, action: 'released' | 'refunded') {
      this.loading = true
      const supabase = useSupabaseClient()
      
      try {
        // We use supabase.functions.invoke to call your Edge Function directly.
        // This is the standard way to trigger your 'admin-resolve-dispute' service.
        const { data, error } = await supabase.functions.invoke('admin-resolve-dispute', {
          body: { 
            transactionId: txId, 
            disputeId: disputeId, 
            action 
          }
        })

        if (error) throw error

        // Update local state by removing the resolved dispute
        this.activeDisputes = this.activeDisputes.filter(d => d.id !== disputeId)
        return data
      } catch (err) {
        console.error('Failed to resolve dispute:', err)
        throw err
      } finally {
        this.loading = false
      }
    }
  }
})
