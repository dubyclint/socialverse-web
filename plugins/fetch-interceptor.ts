// ============================================================================
// FILE: /plugins/fetch-interceptor.ts
// ============================================================================
import { defineNuxtPlugin, navigateTo } from '#app'
import { useUserStore } from '~/stores/user' // Updated import

export default defineNuxtPlugin({
  name: 'socialverse-fetch-interceptor',

  // REMOVED 'socialverse-auth-client' as it no longer exists
  setup() {
    const userStore = useUserStore() // Use the new unified store

    globalThis.$fetch = $fetch.create({
      onRequest({ request, options }) {
        if (!options.headers) {
          options.headers = {}
        }

        const headers = options.headers as Record<string, string>

        // Use userStore.token
        if (userStore.token && !headers.Authorization && !headers.authorization) {
          headers.Authorization = `Bearer ${userStore.token}`
        }
      },

      onResponseError({ response }) {
        // Trap 401 Unauthorized
        if (response.status === 401) {
          // Call the unified logout method
          if (typeof userStore.logout === 'function') {
            userStore.logout()
          }
          
          navigateTo('/signin') // Ensure this path matches your actual signin route
        }
      }
    })
  }
})
