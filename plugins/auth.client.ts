// FILE: /plugins/auth.client.ts
// Auth Plugin - Initialize auth store safely

export default defineNuxtPlugin(() => {
  try {
    const authStore = useAuthStore()

    console.log('[Auth Plugin] Auth store initialized')
    console.log('[Auth Plugin] Token exists:', !!authStore.token)
    console.log('[Auth Plugin] Is authenticated:', authStore.isAuthenticated)

    return {
      provide: {
        authStore
      }
    }
  } catch (error) {
    console.error('[Auth Plugin] Failed to initialize:', error.message)
    // Return empty provide to prevent app crash
    return {
      provide: {}
    }
  }
})
