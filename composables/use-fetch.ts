// ============================================================================
// FILE: /composables/use-fetch.ts
// Description: Custom fetch client with token refresh, FormData handling,
//              and authorization interceptors.
// ============================================================================
import { navigateTo, createError } from '#app'

export const useFetchWithAuth = () => {
  // ============================================================================
  // LAZY STORE RESOLVERS
  // ============================================================================
  const getAuthStore = async () => {
    const { useAuthStore } = await import('~/stores/auth')
    return useAuthStore()
  }

  const getProfileStore = async () => {
    const { useProfileStore } = await import('~/stores/profile')
    return useProfileStore()
  }

  return async (url: string, options: any = {}) => {
    const authStore = await getAuthStore()

    // 1. Refresh logic: Check if we need to refresh before executing
    if (authStore.isTokenExpired?.()) {
      await authStore.refreshToken?.()
    }

    const token = authStore.token

    if (!token) {
      throw createError({ 
        statusCode: 401, 
        statusMessage: 'Authentication required' 
      })
    }

    // 2. Prepare headers
    const headers: Record<string, string> = { 
      ...(options.headers || {}),
      'Authorization': `Bearer ${token}`
    }

    // Handle Content-Type: Use 'application/json' unless it's FormData
    const isFormData = options.body instanceof FormData
    if (!isFormData) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json'
    }

    try {
      return await $fetch(url, { ...options, headers })
    } catch (error: any) {
      const status = error?.statusCode || error?.response?.status

      // 3. Handle Unauthorized: Teardown session and redirect
      if (status === 401 || status === 403) {
        try {
          const profileStore = await getProfileStore()
          
          authStore.clearAuth?.()
          profileStore.clearProfile?.()

          if (process.client) {
            // Clear local storage keys
            ['auth_token', 'auth_user', 'auth_user_id', 'refresh_token'].forEach(key => 
              localStorage.removeItem(key)
            )
            await navigateTo('/signin', { replace: true })
          }
        } catch (err) {
          console.error('[FetchWithAuth] Session cleanup error:', err)
        }
      }
      
      throw error
    }
  }
}
