import { ref, computed } from 'vue'

interface Wallet {
  id: string
  userId: string
  balances: {
    usdt: number
    usdc: number
    btc: number
    eth: number
    sol: number
    matic: number
    xaut: number
  }
  extraWallets: Array<{
    symbol: string
    address: string
    balance: number
  }>
}

export const useWallet = (userId: string) => {
  const wallet = ref<Wallet | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Fetch wallet
  const fetchWallet = async () => {
    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch('/api/wallet', {
        query: { userId }
      })

      wallet.value = data.wallet
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch wallet'
      console.error('Fetch wallet error:', err)
    } finally {
      loading.value = false
    }
  }

  // Create wallet
  const createWallet = async () => {
    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch('/api/wallet', {
        method: 'POST',
        body: { userId }
      })

      wallet.value = data.wallet
      return data.wallet
    } catch (err: any) {
      error.value = err.message || 'Failed to create wallet'
      console.error('Create wallet error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update balances
  const updateBalances = async (balances: Partial<Wallet['balances']>) => {
    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch('/api/wallet', {
        method: 'PUT',
        body: {
          userId,
          balances
        }
      })

      wallet.value = data.wallet
      return data.wallet
    } catch (err: any) {
      error.value = err.message || 'Failed to update wallet'
      console.error('Update wallet error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Add extra wallet
  const addExtraWallet = async (symbol: string, address: string, balance: number = 0) => {
    loading.value = true
    error.value = null

    try {
      if (!wallet.value) {
        throw new Error('Wallet not initialized')
      }

      const { data } = await $fetch('/api/wallet/extra', {
        method: 'POST',
        body: {
          userId,
          wallet: { symbol, address, balance }
        }
      })

      wallet.value = data.wallet
      return data.wallet
    } catch (err: any) {
      error.value = err.message || 'Failed to add wallet'
      console.error('Add wallet error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Computed properties
  const totalBalance = computed(() => {
    if (!wallet.value) return 0
    return Object.values(wallet.value.balances).reduce((sum, balance) => sum + balance, 0)
  })

  const hasWallet = computed(() => wallet.value !== null)

  // Initialize
  const init = async () => {
    try {
      await fetchWallet()
    } catch (err) {
      // Wallet might not exist yet
      console.log('Wallet not found, can be created')
    }
  }

  return {
    wallet,
    loading,
    error,
    fetchWallet,
    createWallet,
    updateBalances,
    addExtraWallet,
    totalBalance,
    hasWallet,
    init
  }
}
