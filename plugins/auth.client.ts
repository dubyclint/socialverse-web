// FILE: /plugins/auth.client.ts - FIXED
// Auth plugin - Initialize auth store on client side
// ============================================================================

export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()

  console.log('[Auth Plugin] Initializing auth store')
  console.log('[Auth Plugin] Token exists:', !!authStore.token)
  console.log('[Auth Plugin] Is authenticated:', authStore.isAuthenticated)

  return {
    provide: {
      authStore
    }
  }
})
