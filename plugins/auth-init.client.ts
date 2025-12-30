export default defineNuxtPlugin({
  name: 'auth-init',
  enforce: 'pre', // ✅ CRITICAL: Run BEFORE all other plugins
  
  async setup(nuxtApp) {
    if (!process.client) return

    console.log('[Auth Init Plugin] 🚀 Starting auth initialization...')

    try {
      const authStore = useAuthStore()
      
      // ✅ CRITICAL FIX: Hydrate store from localStorage IMMEDIATELY
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
