// composables/useAuth.ts - FIXED VERSION WITH PROPER ERROR HANDLING
import { ref, computed } from 'vue'
import type { User } from '@supabase/supabase-js'

export const useAuth = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const authStore = useAuthStore()
  
  const loading = ref(false)
  const error = ref('')
  
  const isAuthenticated = computed(() => !!user.value?.id)
  
  const login = async (email: string, password: string) => {
    try {
      loading.value = true
      error.value = ''
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (signInError) throw signInError
      
      if (!data.user?.id) {
        throw new Error('User ID not available from authentication')
      }

      console.log('[useAuth] User logged in with ID:', data.user.id)
      
      // ✅ FIXED: Use authStore instead of userStore
      await authStore.initialize()
      
      return { success: true, user: data.user }
    } catch (err: any) {
      error.value = err.message
      console.error('[useAuth] Login error:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }
  
  // ✅ FIXED: Proper $fetch error handling
  const signup = async (signupData: {
    email: string
    password: string
    username: string
    fullName: string
    phone: string
    bio?: string
    location?: string
  }) => {
    try {
      loading.value = true
      error.value = ''
      
      console.log('[useAuth] Starting signup with data:', {
        email: signupData.email,
        username: signupData.username,
        fullName: signupData.fullName
      })
      
      // ✅ FIXED: $fetch throws errors directly, don't destructure
      // Use try-catch to handle errors properly
      let signupResponse
      try {
        signupResponse = await $fetch('/api/auth/signup', {
          method: 'POST',
          body: signupData
        })
      } catch (fetchErr: any) {
        console.error('[useAuth] Signup API error:', {
          message: fetchErr.message,
          statusCode: fetchErr.statusCode,
          statusMessage: fetchErr.statusMessage,
          data: fetchErr.data
        })
        throw new Error(fetchErr.statusMessage || fetchErr.message || 'Signup failed')
      }
      
      if (!signupResponse?.success) {
        throw new Error(signupResponse?.message || 'Signup failed')
      }
      
      if (!signupResponse.user?.id) {
        throw new Error('User ID not available from signup response')
      }
      
      console.log('[useAuth] User signed up with ID:', signupResponse.user.id)
      
      // ✅ FIXED: Verify authStore is available before calling handshake
      if (!authStore) {
        throw new Error('Auth store not available')
      }
      
      // ✅ FIXED: Use authStore to perform signup handshake
      console.log('[useAuth] Performing signup handshake...')
      const handshakeResult = await authStore.performSignupHandshake()
      
      if (!handshakeResult.success) {
        console.error('[useAuth] Handshake failed:', handshakeResult.error)
        throw new Error(handshakeResult.error || 'Signup handshake failed')
      }
      
      console.log('[useAuth] ✅ Signup handshake complete')
      
      return { 
        success: true, 
        user: signupResponse.user,
        needsConfirmation: signupResponse.needsConfirmation || false
      }
    } catch (err: any) {
      error.value = err.message || 'An unexpected error occurred during signup'
      console.error('[useAuth] Signup error:', {
        message: err.message,
        stack: err.stack
      })
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }
  
  const logout = async () => {
    try {
      loading.value = true
      error.value = ''
      
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
      
      // ✅ FIXED: Use authStore to clear auth
      authStore.clearAuth()
      
      console.log('[useAuth] User logged out successfully')
      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('[useAuth] Logout error:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }
  
  return {
    login,
    signup,
    logout,
    isAuthenticated,
    loading,
    error,
    user
  }
}
