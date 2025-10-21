// composables/useWalletLock.js - FIXED
import { ref, computed } from 'vue'

export const useWalletLock = () => {
  const loading = ref(false)
  const error = ref(null)
  const api = useApi()

  const lockWallet = async (amount, reason, scheduledUnlock = null) => {
    loading.value = true
    error.value = null

    try {
      const result = await api.walletLock.lock(amount, reason, scheduledUnlock)
      if (!result.success) {
        throw new Error(result.message || 'Failed to lock wallet')
      }
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const unlockWallet = async (lockId) => {
    loading.value = true
    error.value = null

    try {
      const result = await api.walletLock.unlock(lockId)
      if (!result.success) {
        throw new Error(result.message || 'Failed to unlock wallet')
      }
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const getWalletLocks = async () => {
    loading.value = true
    error.value = null

    try {
      const result = await api.walletLock.getLocks()
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch locks')
      }
      return result.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const isLocked = computed(() => {
    return error.value === null
  })

  return {
    loading,
    error,
    isLocked,
    lockWallet,
    unlockWallet,
    getWalletLocks
  }
}
