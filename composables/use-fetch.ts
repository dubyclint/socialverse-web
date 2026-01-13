// composables/use-fetch.ts
import { useAuthStore } from '~/stores/auth'

export const useFetchWithAuth = () => {
  const authStore = useAuthStore()

  return async (url: string, options: any = {}) => {
    // ✅ FIXED: Get fresh token from store each time
    const token = authStore.token
    
    console.log('[useFetchWithAuth] Fetching:', url)
    console.log('[useFetchWithAuth] Token available:', !!token)
    console.log('[useFetchWithAuth] Token value:', token ? `${token.substring(0, 20)}...` : 'MISSING')

    // ✅ FIXED: Validate token exists
    if (!token) {
      console.error('[useFetchWithAuth] ❌ NO TOKEN AVAILABLE - User may not be authenticated')
      throw new Error('Authentication token not available. Please log in again.')
    }

    const headers = {
      ...options.headers,
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`  // ✅ FIXED: Always add Authorization
    }

    console.log('[useFetchWithAuth] Headers being sent:', {
      'Content-Type': headers['Content-Type'],
      'Authorization': headers['Authorization'] ? `Bearer ${token.substring(0, 20)}...` : 'MISSING'
    })

    try {
      const response = await $fetch(url, {
        ...options,
        headers
      })
      
      console.log('[useFetchWithAuth] ✅ Request successful for:', url)
      return response
    } catch (error: any) {
      console.error('[useFetchWithAuth] ❌ Request failed:', {
        url,
        status: error.status,
        statusCode: error.statusCode,
        message: error.message,
        data: error.data
      })
      throw error
    }
  }
}
