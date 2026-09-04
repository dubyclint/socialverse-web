// services/wallet.ts
import { api } from '~/lib/api'

export const walletService = {
  // Fetches balance from your 'wallets' table
  async getBalance() {
    return await api('/wallet/balance')
  },

  // Atomic transfer using your validated SQL function
  async transfer(counterpartId: string, amount: number, type: string) {
    return await api('/wallet/transfer', { 
      method: 'POST', 
      body: { counterpartId, amount, type } 
    })
  }
}
