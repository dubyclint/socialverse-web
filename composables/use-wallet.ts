
// composables/use-wallet.ts
// ============================================================================
// CONSOLIDATED WALLET COMPOSABLE - MODULAR EXPORTS
// Combines: use-wallet, use-wallet-factory, use-wallet-lock
// ============================================================================

import { ref, computed, readonly } from 'vue'
import { ethers } from 'ethers'
import WalletFactoryABI from '@/abis/WalletFactory.json'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface WalletBalance {
  usdt: number
  usdc: number
  btc: number
  eth: number
  sol: number
  matic: number
  xaut: number
}

export interface ExtraWallet {
  symbol: string
  address: string
  balance: number
}

export interface Wallet {
  id: string
  userId: string
  balances: WalletBalance
  extraWallets: ExtraWallet[]
}

export interface WalletLock {
  id: string
  walletId: string
  amount: number
  reason: string
  lockedAt: Date
  unlockedAt?: Date
  scheduledUnlock?: Date
  status: 'active' | 'released' | 'expired'
}

export interface WalletTransaction {
  id: string
  walletId: string
  type: 'send' | 'receive' | 'lock' | 'unlock'
  amount: number
  currency: string
  timestamp: Date
  status: 'pending' | 'completed' | 'failed'
  description?: string
}

// ============================================================================
// CORE WALLET COMPOSABLE
// ============================================================================

export const useWallet = (userId: string) => {
  const wallet = ref<Wallet | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const transactions = ref<WalletTransaction[]>([])

  // Computed
  const totalBalance = computed(() => {
    if (!wallet.value) return 0
    const balances = Object.values(wallet.value.balances)
    return balances.reduce((sum: number, balance: number) => sum + balance, 0)
  })

  const hasBalance = computed(() => totalBalance.value > 0)

  const currencyBalances = computed(() => {
    if (!wallet.value) return {}
    return wallet.value.balances
  })

  // Methods
  const fetchWallet = async (): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 500))

      wallet.value = {
        id: `wallet-${userId}`,
        userId,
        balances: {
          usdt: 1000,
          usdc: 500,
          btc: 0.5,
          eth: 2,
          sol: 10,
          matic: 100,
          xaut: 5
        },
        extraWallets: []
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch wallet'
    } finally {
      loading.value = false
    }
  }

  const updateBalance = (currency: keyof WalletBalance, amount: number): void => {
    if (wallet.value) {
      wallet.value.balances[currency] = amount
    }
  }

  const addExtraWallet = (symbol: string, address: string, balance: number = 0): void => {
    if (wallet.value) {
      wallet.value.extraWallets.push({ symbol, address, balance })
    }
  }

  const removeExtraWallet = (address: string): void => {
    if (wallet.value) {
      wallet.value.extraWallets = wallet.value.extraWallets.filter(w => w.address !== address)
    }
  }

  const addTransaction = (transaction: WalletTransaction): void => {
    transactions.value.push(transaction)
  }

  const getTransactionHistory = (limit: number = 10): WalletTransaction[] => {
    return transactions.value.slice(-limit).reverse()
  }

  return {
    // State
    wallet: readonly(wallet),
    loading: readonly(loading),
    error: readonly(error),
    transactions: readonly(transactions),

    // Computed
    totalBalance,
    hasBalance,
    currencyBalances,

    // Methods
    fetchWallet,
    updateBalance,
    addExtraWallet,
    removeExtraWallet,
    addTransaction,
    getTransactionHistory
  }
}

// ============================================================================
// WALLET FACTORY COMPOSABLE (Modular Export)
// ============================================================================

export const useWalletFactory = () => {
  const contractAddress = '0xYourWalletFactoryAddress'
  const loading = ref(false)
  const error = ref<string | null>(null)

  let provider: ethers.BrowserProvider | null = null
  let signer: ethers.Signer | null = null
  let contract: ethers.Contract | null = null

  const initializeContract = async (): Promise<void> => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed')
      }

      provider = new ethers.BrowserProvider(window.ethereum)
      signer = await provider.getSigner()
      contract = new ethers.Contract(contractAddress, WalletFactoryABI, signer)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to initialize contract'
    }
  }

  const createWallet = async (userAddress: string): Promise<string> => {
    loading.value = true
    error.value = null

    try {
      if (!contract) {
        await initializeContract()
      }

      const tx = await contract!.createWallet(userAddress)
      const receipt = await tx.wait()

      return receipt.transactionHash
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create wallet'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getWalletAddress = async (userAddress: string): Promise<string> => {
    try {
      if (!contract) {
        await initializeContract()
      }

      return await contract!.getWalletAddress(userAddress)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to get wallet address'
      throw err
    }
  }

  const isWalletCreated = async (userAddress: string): Promise<boolean> => {
    try {
      if (!contract) {
        await initializeContract()
      }

      return await contract!.isWalletCreated(userAddress)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to check wallet status'
      throw err
    }
  }

  const deployWallet = async (userAddress: string, initialBalance: string): Promise<string> => {
    loading.value = true
    error.value = null

    try {
      if (!contract) {
        await initializeContract()
      }

      const tx = await contract!.deployWallet(userAddress, initialBalance)
      const receipt = await tx.wait()

      return receipt.transactionHash
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to deploy wallet'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),

    initializeContract,
    createWallet,
    getWalletAddress,
    isWalletCreated,
    deployWallet
  }
}

// ============================================================================
// WALLET LOCK COMPOSABLE (Modular Export)
// ============================================================================

export const useWalletLock = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const locks = ref<WalletLock[]>([])

  const lockWallet = async (
    walletId: string,
    amount: number,
    reason: string,
    scheduledUnlock?: Date
  ): Promise<WalletLock> => {
    loading.value = true
    error.value = null

    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 300))

      const lock: WalletLock = {
        id: `lock-${Date.now()}`,
        walletId,
        amount,
        reason,
        lockedAt: new Date(),
        scheduledUnlock,
        status: 'active'
      }

      locks.value.push(lock)
      return lock
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to lock wallet'
      throw err
    } finally {
      loading.value = false
    }
  }

  const unlockWallet = async (lockId: string): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 300))

      const lock = locks.value.find(l => l.id === lockId)
      if (lock) {
        lock.status = 'released'
        lock.unlockedAt = new Date()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to unlock wallet'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getActiveLocks = (walletId: string): WalletLock[] => {
    return locks.value.filter(l => l.walletId === walletId && l.status === 'active')
  }

  const getAllLocks = (walletId: string): WalletLock[] => {
    return locks.value.filter(l => l.walletId === walletId)
  }

  const getTotalLockedAmount = (walletId: string): number => {
    return getActiveLocks(walletId).reduce((sum, lock) => sum + lock.amount, 0)
  }

  const isWalletLocked = (walletId: string): boolean => {
    return getActiveLocks(walletId).length > 0
  }

  const scheduleUnlock = async (
    walletId: string,
    amount: number,
    unlockTime: Date
  ): Promise<WalletLock> => {
    return lockWallet(walletId, amount, 'Scheduled unlock', unlockTime)
  }

  const extendLock = async (lockId: string, newUnlockTime: Date): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const lock = locks.value.find(l => l.id === lockId)
      if (lock) {
        lock.scheduledUnlock = newUnlockTime
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to extend lock'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    locks: readonly(locks),

    lockWallet,
    unlockWallet,
    getActiveLocks,
    getAllLocks,
    getTotalLockedAmount,
    isWalletLocked,
    scheduleUnlock,
    extendLock
  }
}
