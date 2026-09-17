// ============================================================================
// FILE: /services/api.ts - CENTRALIZED NETWORK ORCHESTRATOR
// ============================================================================
import { ofetch } from 'ofetch'

export const api = ofetch.create({
  baseURL: '/api',
  async onRequest({ options }) {
  // 1. Dynamically import the user store when needed (avoid circular deps)
  // Note: we only import inside onResponseError when we need to call logout to avoid unused symbols here.

    // 2. Inject Authorization headers using the token from our state/cookie
  const token = useCookie('auth_token')?.value
    if (token) {
      // ofetch options.headers can be different types; cast to any for staged remediation
      ;(options as any).headers = {
        ...((options as any).headers || {}),
        Authorization: `Bearer ${token}`
      }
    }
  },
  async onResponseError({ response }) {
    // 3. Centralized Error Handling
    if (response.status === 401) {
      console.warn('[API Service] Unauthorized - Clearing session...')
      const { useUserStore } = await import('~/stores/user')
      const userStore = useUserStore()
      if (userStore && typeof (userStore as any).logout === 'function') {
        (userStore as any).logout()
      }
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
