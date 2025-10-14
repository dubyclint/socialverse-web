// composables/useWalletLock.js - Wallet Lock Management Composable
import { ref, computed } from 'vue'

export const useWalletLock = () => {
  const loading = ref(false)
  const error = ref(null)

  /**
   * Lock a wallet balance
   */
  const lockWallet = async (walletId, reason, scheduledUnlock = null) => {
    loading.value = true
    error.value = null

    try {
      const { $fetch } = useNuxtApp()
      
      const payload = {
        walletId,
        reason
      }

      if (scheduledUnlock) {
        payload.scheduledUnlock = scheduledUnlock
      }

      const result = await $fetch('/api/wallet/lock', {
        method: 'POST',
        body: payload
      })

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

  /**
   * Unlock a wallet balance
   */
  const unlockWallet = async (walletId, reason) => {
    loading.value = true
    error.value = null

    try {
      const { $fetch } = useNuxtApp()
      
      const result = await $fetch('/api/wallet/unlock', {
        method: 'POST',
        body: {
          walletId,
          reason
        }
      })

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

  /**
   * Schedule wallet unlock
   */
  const scheduleUnlock = async (walletId, unlockTime, reason) => {
    loading.value = true
    error.value = null

    try {
      const { $fetch } = useNuxtApp()
      
      const result = await $fetch('/api/wallet/schedule-unlock', {
        method: 'POST',
        body: {
          walletId,
          unlockTime,
          reason
        }
      })

      if (!result.success) {
        throw new Error(result.message || 'Failed to schedule unlock')
      }

      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Toggle wallet lock status
   */
  const toggleWalletLock = async (walletId, reason) => {
    loading.value = true
    error.value = null

    try {
      const { $fetch } = useNuxtApp()
      
      const result = await $fetch(`/api/wallet/${walletId}/toggle-lock`, {
        method: 'POST',
        body: { reason }
      })

      if (!result.success) {
        throw new Error(result.message || 'Failed to toggle wallet lock')
      }

      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get wallet lock status and history
   */
  const getWalletLockStatus = async (walletId) => {
    loading.value = true
    error.value = null

    try {
      const { $fetch } = useNuxtApp()
      
      const result = await $fetch(`/api/wallet/${walletId}/lock-status`)

      if (!result.success) {
        throw new Error(result.message || 'Failed to get lock status')
      }

      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get all locked wallets (admin only)
   */
  const getLockedWallets = async (filters = {}) => {
    loading.value = true
    error.value = null

    try {
      const { $fetch } = useNuxtApp()
      
      const query = new URLSearchParams()
      if (filters.currency) query.append('currency', filters.currency)
      if (filters.user) query.append('user', filters.user)

      const result = await $fetch(`/api/wallet/locked?${query.toString()}`)

      if (!result.success) {
        throw new Error(result.message || 'Failed to get locked wallets')
      }

      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Check if wallet operations are allowed
   */
  const checkWalletOperationAllowed = (wallet) => {
    if (!wallet.is_locked) return true

    // Check if scheduled unlock time has passed
    if (wallet.unlock_scheduled_at) {
      const unlockTime = new Date(wallet.unlock_scheduled_at)
      return new Date() >= unlockTime
    }

    return false
  }

  /**
   * Get lock status display info
   */
  const getLockStatusInfo = (wallet) => {
    if (!wallet.is_locked) {
      return {
        status: 'unlocked',
        icon: 'fas fa-lock-open',
        color: 'success',
        text: 'Unlocked'
      }
    }

    if (wallet.unlock_scheduled_at) {
      const unlockTime = new Date(wallet.unlock_scheduled_at)
      const now = new Date()
      
      if (now >= unlockTime) {
        return {
          status: 'auto-unlock-ready',
          icon: 'fas fa-clock',
          color: 'info',
          text: 'Ready to Auto-Unlock'
        }
      }

      return {
        status: 'scheduled-unlock',
        icon: 'fas fa-clock',
        color: 'warning',
        text: `Unlocks ${unlockTime.toLocaleString()}`
      }
    }

    return {
      status: 'locked',
      icon: 'fas fa-lock',
      color: 'danger',
      text: 'Locked'
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    lockWallet,
    unlockWallet,
    scheduleUnlock,
    toggleWalletLock,
    getWalletLockStatus,
    getLockedWallets,
    checkWalletOperationAllowed,
    getLockStatusInfo
  }
}
