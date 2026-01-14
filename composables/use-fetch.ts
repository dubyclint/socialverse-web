// composables/use-fetch.ts  
export const useFetchWithAuth = () => {  
  const authStore = useAuthStore()  
  return async (url: string, options: any = {}) => {  
    console.log('[useFetchWithAuth] ============ REQUEST START ============')  
    console.log('[useFetchWithAuth] URL:', url)  
    console.log('[useFetchWithAuth] Method:', options.method || 'GET')  
      
    const token = authStore.token  
      
    console.log('[useFetchWithAuth] Token available:', !!token)  
    if (!token) {  
      console.error('[useFetchWithAuth] ❌ NO TOKEN AVAILABLE')  
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
      'Content-Type': headers['Content-Type'] || 'auto (FormData)',  
      'Authorization': headers['Authorization'] ? `Bearer ${token.substring(0, 20)}...` : 'MISSING'  
    })  
    try {  
      console.log('[useFetchWithAuth] Making request...')  
        
      const response = await $fetch(url, {  
        ...options,  
        headers  
      })  
        
      console.log('[useFetchWithAuth] ✅ Request successful')  
      console.log('[useFetchWithAuth] ============ REQUEST END (SUCCESS) ============')  
        
      return response  
    } catch (error: any) {  
      console.error('[useFetchWithAuth] ❌ Request failed')  
      console.error('[useFetchWithAuth] Error details:', {  
        url,  
        status: error.status || error.statusCode,  
        message: error.message,  
        data: error.data  
      })  
        
      if (error.status === 401 || error.statusCode === 401) {  
        console.error('[useFetchWithAuth] ❌ 401 UNAUTHORIZED')  
      }  
        
      console.log('[useFetchWithAuth] ============ REQUEST END (ERROR) ============')  
      throw error  
    }  
  }  
}  

      
    
