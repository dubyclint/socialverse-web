// composables/use-fetch.ts
import { navigateTo, createError } from '#app'

export const useFetchWithAuth = () => {
  // 1. Unified Store Resolver
  const getUserStore = async () => {
    const { useUserStore } = await import('~/stores/user')
    return useUserStore()
  }

  return async (url: string, options: any = {}) => {
    const userStore = await getUserStore()

    // 2. Refresh logic: Delegate to the unified userStore
    if (userStore.isTokenExpired?.()) {
      await userStore.refreshToken?.()
    }

    const token = userStore.token

    if (!token) {
      throw createError({ 
        statusCode: 401, 
        statusMessage: 'Authentication required' 
      })
    }

    // 3. Prepare headers
    const headers: Record<string, string> = { 
      ...(options.headers || {}),
      'Authorization': `Bearer ${token}`
    }

    const isFormData = options.body instanceof FormData
    if (!isFormData) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json'
    }

    try {
      return await $fetch(url, { ...options, headers })
    } catch (error: any) {
      const status = error?.statusCode || error?.response?.status

      // 4. Handle Unauthorized: Centralized cleanup
      if (status === 401 || status === 403) {
        try {
          // Instead of manually clearing multiple stores, 
          // call one unified logout/teardown method
          await userStore.logout()

          if (process.client) {
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
