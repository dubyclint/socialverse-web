// ============================================================================  
// FILE: /composables/use-fetch.ts  
// ============================================================================  
import { useAuthStore } from '~/stores/auth'  
export const useFetchWithAuth = () => {  
  const authStore = useAuthStore()  
  return async (url: string, options: any = {}) => {  
    console.log('[useFetchWithAuth] ============ REQUEST START ============')  
    console.log('[useFetchWithAuth] URL:', url)  
    console.log('[useFetchWithAuth] Method:', options.method || 'GET')  
    console.log('[useFetchWithAuth] Body type:', options.body instanceof FormData ? 'FormData' : typeof options.body)  
      
    // ✅ Get fresh token from store each time  
    const token = authStore.token  
      
    console.log('[useFetchWithAuth] Token available:', !!token)  
    console.log('[useFetchWithAuth] Token length:', token ? token.length : 0)  
    console.log('[useFetchWithAuth] Token preview:', token ? `${token.substring(0, 30)}...` : 'MISSING')  
    console.log('[useFetchWithAuth] Auth store state:', {  
      isAuthenticated: authStore.isAuthenticated,  
      userId: authStore.userId,  
      hasUser: !!authStore.user  
    })  
    // ✅ Validate token exists  
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
    // ✅ FIXED: Don't set Content-Type for FormData - let browser handle it  
    const headers: any = {  
      ...options.headers,  
      'Authorization': `Bearer ${token}`  
    }  
    // ✅ FIXED: Only set Content-Type for non-FormData requests  
    if (!(options.body instanceof FormData)) {  
      headers['Content-Type'] = 'application/json'  
    }  
    console.log('[useFetchWithAuth] Headers being sent:', {  
      'Content-Type': headers['Content-Type'] || 'auto (FormData - multipart/form-data)',  
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
        
      // ✅ Handle 401 specifically  
      if (error.status === 401 || error.statusCode === 401) {  
        console.error('[useFetchWithAuth] ❌ 401 UNAUTHORIZED - Attempting token refresh...')  
          
        // Try to refresh token if available  
        if (authStore.refreshToken) {  
          console.log('[useFetchWithAuth] Attempting to refresh token...')  
          try {  
            const refreshResponse = await $fetch('/api/auth/refresh', {  
              method: 'POST',  
              body: { refresh_token: authStore.refreshToken }  
            })  
              
            if (refreshResponse.token) {  
              console.log('[useFetchWithAuth] ✅ Token refreshed successfully')  
              authStore.setToken(refreshResponse.token)  
                
              // Retry original request with new token  
              console.log('[useFetchWithAuth] Retrying original request with new token...')  
              const retryResponse = await $fetch(url, {  
                ...options,  
                headers: {  
                  ...options.headers,  
                  'Authorization': `Bearer ${refreshResponse.token}`  
                }  
              })  
              return retryResponse  
            }  
          } catch (refreshError) {  
            console.error('[useFetchWithAuth] ❌ Token refresh failed:', refreshError)  
            authStore.clearAuth()  
            throw new Error('Session expired. Please log in again.')  
          }  
        } else {  
          console.error('[useFetchWithAuth] No refresh token available - user needs to re-login')  
          authStore.clearAuth()  
          throw new Error('Session expired. Please log in again.')  
        }  
      }  
        
      console.log('[useFetchWithAuth] ============ REQUEST END (ERROR) ============')  
      throw error  
    }  
  }  
}  

