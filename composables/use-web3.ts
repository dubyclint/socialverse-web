// composables/use-web3.ts
// ============================================================================
// WEB3 COMPOSABLE - LAZY LOADING WRAPPER
// ============================================================================
// Provides lazy-loaded Web3 functionality for wallet, gift, p2p, and escrow
// Only loads Web3 when explicitly needed to reduce bundle size
// ============================================================================

import { ref, readonly, computed } from 'vue'

export const useWeb3 = () => {
  const isLoading = ref(false)
  const isLoaded = ref(false)
  const error = ref<string | null>(null)
  let web3Instance: any = null

  /**
   * Lazy load Web3 library
   */
  const loadWeb3 = async () => {
    if (isLoaded.value) {
      return web3Instance
    }

    isLoading.value = true
    error.value = null

    try {
      // Dynamically import Web3 only when needed
      const Web3Module = await import('web3')
      web3Instance = new Web3Module.default(window.ethereum)
      
      isLoaded.value = true
      console.log('[Web3] ✅ Loaded successfully')
      
      return web3Instance
    } catch (err: any) {
      error.value = err.message
      console.error('[Web3] ❌ Failed to load:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get current Web3 instance
   */
  const getInstance = () => {
    if (!isLoaded.value) {
      throw new Error('Web3 not loaded. Call loadWeb3() first.')
    }
    return web3Instance
  }

  /**
   * Unload Web3 and cleanup
   */
  const unload = () => {
    web3Instance = null
    isLoaded.value = false
    error.value = null
    console.log('[Web3] Unloaded')
  }

  /**
   * Check if Web3 is available (MetaMask or similar provider)
   */
  const isAvailable = computed(() => {
    if (process.client) {
      return typeof window !== 'undefined' && window.ethereum !== undefined
    }
    return false
  })

  return {
    // State
    isLoading: readonly(isLoading),
    isLoaded: readonly(isLoaded),
    error: readonly(error),
    isAvailable,

    // Methods
    loadWeb3,
    getInstance,
    unload,
  }
}
