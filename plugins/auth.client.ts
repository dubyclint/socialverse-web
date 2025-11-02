// FILE: /plugins/auth.client.ts - FIXED
// Auth plugin - Initialize auth store on client side
// ============================================================================

export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()

  // Don't call initialize() - it doesn't exist!
  // The store is already initialized with localStorage values
  console.log('[Auth Plugin] Auth store initialized')
  console.log('[Auth Plugin] Token exists:', !!authStore.token)
  console.log('[Auth Plugin] Is authenticated:', authStore.isAuthenticated)

  // Return auth store for global access
  return {
    provide: {
      authStore
    }
  }
})
