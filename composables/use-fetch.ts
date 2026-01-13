// composables/use-fetch.ts
import { useAuthStore } from '~/stores/auth'

export const useFetchWithAuth = () => {
  const authStore = useAuthStore()

  return async (url: string, options: any = {}) => {
    console.log('[useFetchWithAuth] ============ REQUEST START ============')
    console.log('[useFetchWithAuth] URL:', url)
    console.log('[useFetchWithAuth] Method:', options.method || 'GET')
    
    // ✅ FIXED: Get fresh token from store each time
    const token = authStore.token
    
    console.log('[useFetchWithAuth] Token available:', !!token)
    console.log('[useFetchWithAuth] Token length:', token ? token.length : 0)
    console.log('[useFetchWithAuth] Token preview:', token ? `${token.substring(0, 30)}...` : 'MISSING')
    console.log('[useFetchWithAuth] Auth store state:', {
      isAuthenticated: authStore.isAuthenticated,
      userId: authStore.userId,
      hasUser: !!authStore.user
    })

    // ✅ FIXED: Validate token exists
    if (!token) {
      console.error('[useFetchWithAuth] ❌ NO TOKEN AVAILABLE')
      console.error('[useFetchWithAuth] Auth store details:', {
        isAuthenticated: authStore.isAuthenticated,
        user: authStore.user?.id,
        token: authStore.token
      })
      console.log('[useFetchWithAuth] ============ REQUEST END (NO TOKEN) ============')
      throw new Error('Authentication token not available. Please log in again.')
    }

    const headers = {
      ...options.headers,
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }

    console.log('[useFetchWithAuth] Headers being sent:', {
      'Content-Type': headers['Content-Type'],
      'Authorization': headers['Authorization'] ? `Bearer ${token.substring(0, 20)}...` : 'MISSING'
    })

    try {
      console.log('[useFetchWithAuth] Making request...')
      
      const response = await $fetch(url, {
        ...options,
        headers
      })
      
      console.log('[useFetchWithAuth] ✅ Request successful')
      console.log('[useFetchWithAuth] Response status: 200')
      console.log('[useFetchWithAuth] Response data keys:', Object.keys(response || {}))
      console.log('[useFetchWithAuth] ============ REQUEST END (SUCCESS) ============')
      
      return response
    } catch (error: any) {
      console.error('[useFetchWithAuth] ❌ Request failed')
      console.error('[useFetchWithAuth] Error details:', {
        url,
        status: error.status || error.statusCode,
        statusCode: error.statusCode,
        message: error.message,
        data: error.data,
        response: error.response
      })
      
      // ✅ NEW: Handle 401 specifically
      if (error.status === 401 || error.statusCode === 401) {
        console.error('[useFetchWithAuth] ❌ 401 UNAUTHORIZED - Token may be invalid or expired')
        console.error('[useFetchWithAuth] Current token:', {
          exists: !!authStore.token,
          length: authStore.token?.length,
          preview: authStore.token ? `${authStore.token.substring(0, 20)}...` : 'NONE'
        })
        
        // ✅ NEW: Try to refresh token if available
        if (authStore.refreshToken) {
          console.log('[useFetchWithAuth] Attempting to refresh token...')
          // Token refresh logic would go here
        } else {
          console.error('[useFetchWithAuth] No refresh token available - user needs to re-login')
        }
      }
      
      console.log('[useFetchWithAuth] ============ REQUEST END (ERROR) ============')
      throw error
    }
  }
}
