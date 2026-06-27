// ============================================================================
// FILE: /composables/use-fetch.ts
// Description: Custom fetch client utilizing deferred lazy store evaluations
//              to enforce authorization interceptors without circular dependency deadlocks.
// ============================================================================
import { navigateTo, createError } from '#app'

export const useFetchWithAuth = () => {
  // ============================================================================
  // LAZY STORE RESOLVERS (Prevents module-level circular import failure modes)
  // ============================================================================
  const getAuthStore = async () => {
    const { useAuthStore } = await import('~/stores/auth')
    return useAuthStore()
  }

  const getProfileStore = async () => {
    const { useProfileStore } = await import('~/stores/profile')
    return useProfileStore()
  }

  /**
   * Execution pipeline wrapper for adding live credentials to network requests
   */
  return async (url: string, options: any = {}) => {
    const authStore = await getAuthStore()
    const token = authStore.token

    // Do NOT hard-redirect immediately on missing token.
    // This avoids hydration-time redirect loops.
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    const headers: Record<string, string> = { ...(options.headers || {}) }
    headers.Authorization = `Bearer ${token}`

    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json'
    }

    try {
      return await $fetch(url, {
        ...options,
        headers
      })
    } catch (error: any) {
      const status = error?.statusCode || error?.response?.status

      // Redirect ONLY on explicit unauthorized API response
      if (status === 401 || status === 403) {
        try {
          const profileStore = await getProfileStore()
          
          authStore.clearAuth?.()
          profileStore.clearProfile?.()

          if (process.client) {
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_user')
            localStorage.removeItem('auth_user_id')
            localStorage.removeItem('refresh_token')
          }
        } catch (err) {
          console.error('[FetchWithAuth] Local storage teardown context error:', err)
        }

        if (process.client) {
          await navigateTo('/signin', { replace: true })
        }
      }

      throw error
    }
  }
}
