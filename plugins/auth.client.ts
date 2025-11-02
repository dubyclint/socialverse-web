// FILE: /plugins/auth.client.ts
// ============================================================================

export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()

  console.log('[Auth Plugin] Auth store initialized')
  console.log('[Auth Plugin] Token exists:', !!authStore.token)
  console.log('[Auth Plugin] Is authenticated:', authStore.isAuthenticated)

  return {
    provide: {
      authStore
    }
  }
})
