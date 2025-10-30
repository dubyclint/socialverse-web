// composables/useAuth.ts - UPDATED VERSION
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
  
  // ✅ FIX: Updated signup to accept all required fields
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
      
      // Call backend signup endpoint
      const { data, error: signupError } = await $fetch('/api/auth/signup', {
        method: 'POST',
        body: signupData
      })
      
      if (signupError) throw signupError
      
      console.log('[useAuth] User signed up with ID:', data.user.id)
      
      // ✅ FIXED: Use authStore to perform signup handshake
      const handshakeResult = await authStore.performSignupHandshake()
      
      if (!handshakeResult.success) {
        throw new Error(handshakeResult.error || 'Signup handshake failed')
      }
      
      return { 
        success: true, 
        user: data.user,
        needsConfirmation: data.needsConfirmation
      }
    } catch (err: any) {
      error.value = err.message || err.data?.statusMessage
      console.error('[useAuth] Signup error:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }
  
  const logout = async () => {
    try {
      loading.value = true
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
      
      // ✅ FIXED: Use authStore to clear auth
      authStore.clearAuth()
      
      return { success: true }
    } catch (err: any) {
      error.value = err.message
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
