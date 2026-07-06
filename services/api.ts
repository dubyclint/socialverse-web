// ============================================================================
// FILE: /services/api.ts - CENTRALIZED NETWORK ORCHESTRATOR
// ============================================================================
import { ofetch } from 'ofetch'

export const api = ofetch.create({
  baseURL: '/api',
  async onRequest({ options }) {
    // 1. Get the user store dynamically to avoid circular dependencies
    const { useUserStore } = await import('~/stores/user')
    const userStore = useUserStore()

    // 2. Inject Authorization headers using the token from our state/cookie
    const token = useCookie('auth_token').value
    if (token) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`
      }
    }
  },
  async onResponseError({ response }) {
    // 3. Centralized Error Handling
    if (response.status === 401) {
      console.warn('[API Service] Unauthorized - Clearing session...')
      const { useUserStore } = await import('~/stores/user')
      useUserStore().logout()
    }
    
    if (response.status >= 500) {
      console.error('[API Service] Server error:', response._data?.message || 'Internal Server Error')
    }
  }
})

/**
 * Helper to unwrap standard backend responses
 */
export const unwrap = <T>(res: any): T => (res?.data ?? res) as T
