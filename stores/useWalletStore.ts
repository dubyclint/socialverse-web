// stores/useWalletStore.ts
import { defineStore } from 'pinia'
import { walletService } from '~/services/wallet'

export const useWalletStore = defineStore('wallet', {
  state: () => ({
    balance: 0,
    history: [],
    loading: false
  }),
  actions: {
    async fetchBalance() {
      const data = await walletService.getBalance()
      this.balance = data.balance
    },
    // Optimistic Update: Change UI before the server responds
    async performTransfer(counterpartId: string, amount: number, type: string) {
      this.balance -= amount 
      try {
        await walletService.transfer(counterpartId, amount, type)
      } catch (e) {
        this.fetchBalance() // Rollback on failure
        throw e
      }
    }
  }
})
