// ============================================================================
// FILE: /plugins/fetch-interceptor.ts
// Description: Global Nuxt HTTP lifecycle request/response interceptor engine.
// ============================================================================
import { defineNuxtPlugin, navigateTo } from '#app'
import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin({
  name: 'socialverse-fetch-interceptor',

  // ✅ FIX: Force the global auth engine client layer to finish loading first
  dependsOn: ['socialverse-auth-client'],

  setup() {
    const authStore = useAuthStore()

    // ✅ FIX: Attach lifecycle hooks securely to the global interceptor layer
    globalThis.$fetch = $fetch.create({
      onRequest({ request, options }) {
        console.log('[Fetch Interceptor] Request outgoing:', request)
        
        // Ensure options headers record is safe to modify
        if (!options.headers) {
          options.headers = {}
        }

        // Map operational headers record record dictionary safely
        const headers = options.headers as Record<string, string>

        // Add Authorization Bearer JWT credential strings if available locally
        if (authStore.token && !headers.Authorization && !headers.authorization) {
          headers.Authorization = `Bearer ${authStore.token}`
          console.log('[Fetch Interceptor] ✅ Authorization header injected into application dispatch pipeline')
        }
      },

      onResponseError({ response }) {
        console.error('[Fetch Interceptor] Response error discovered:', response.status, response.statusText)
        
        // Trap runtime 401 Unauthorized exceptions to enforce session sanitation boundaries
        if (response.status === 401) {
          console.error('[Fetch Interceptor] ❌ Session invalid or expired - redirecting user to auth interface gateway')
          
          if (typeof authStore.logout === 'function') {
            authStore.logout()
          } else if (typeof authStore.clearAuth === 'function') {
            authStore.clearAuth()
          }
          
          navigateTo('/auth/login')
        }
      }
    })
  }
})
