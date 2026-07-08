// stores/useWalletStore.ts
import { defineStore } from 'pinia'
import { walletService } from '~/services/financial/wallet/wallet-service'

export const useWalletStore = defineStore('wallet', {
  state: () => ({
    balance: 0,
    history: [],
    loading: false
  }),
  actions: {
    async performTransfer(counterpartId: string, amount: number, type: string) {
      if (this.loading) return; // Prevent double-submission
      
      const previousBalance = this.balance;
      this.loading = true;
      this.balance -= amount; // Optimistic update
      
      try {
        await walletService.transfer(counterpartId, amount, type);
        // Refresh balance from server to ensure accuracy
        await this.fetchBalance(); 
      } catch (e) {
        this.balance = previousBalance; // Rollback
        throw e;
      } finally {
        this.loading = false;
      }
    }
  }
})
