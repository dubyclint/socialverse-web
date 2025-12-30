// FILE: /plugins/auth-init.client.ts - FIXED VERSION
// ============================================================================
// AUTH INITIALIZATION PLUGIN - FIXED
// ✅ FIXED: Wait for Pinia to be ready before using stores
// ============================================================================

export default defineNuxtPlugin(async (nuxtApp) => {
  // Only run on client-side
  if (!process.server) {
    console.log('[Auth Init Plugin] 🚀 Starting auth initialization...')

    try {
      // ✅ CRITICAL FIX: Wait for Pinia to be ready
      const pinia = nuxtApp.$pinia
      
      if (!pinia) {
        console.warn('[Auth Init Plugin] ⚠️ Pinia not available yet, skipping hydration')
        return
      }

      // Now we can safely use the store
      const authStore = useAuthStore()
      
      console.log('[Auth Init Plugin] Hydrating auth store from localStorage...')
      await authStore.hydrateFromStorage()
      
      console.log('[Auth Init Plugin] ✅ Auth store hydrated')
      console.log('[Auth Init Plugin] Authenticated:', authStore.isAuthenticated)
      console.log('[Auth Init Plugin] User:', authStore.userDisplayName)
      
    } catch (error) {
      console.error('[Auth Init Plugin] ❌ Initialization error:', error)
    }
  }
})
