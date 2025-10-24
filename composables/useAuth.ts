// composables/useAuth.ts - FIXED VERSION
import { ref, computed } from 'vue'
import type { User } from '@supabase/supabase-js'

export const useAuth = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const userStore = useUserStore()
  
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
      
      // CRITICAL: Verify user ID exists
      if (!data.user?.id) {
        throw new Error('User ID not available from authentication')
      }

      console.log('[useAuth] User logged in with ID:', data.user.id)
      
      // Initialize user store
      await userStore.initializeSession()
      
      return { success: true, user: data.user }
    } catch (err: any) {
      error.value = err.message
      console.error('[useAuth] Login error:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }
  
  const signup = async (email: string, password: string) => {
    try {
      loading.value = true
      error.value = ''
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password
      })
      
      if (signUpError) throw signUpError
      
      // CRITICAL: Verify user ID exists
      if (!data.user?.id) {
        throw new Error('User ID not available from authentication')
      }

      console.log('[useAuth] User signed up with ID:', data.user.id)
      
      // Initialize user store
      await userStore.initializeSession()
      
      return { success: true, user: data.user }
    } catch (err: any) {
      error.value = err.message
      console.error('[useAuth] Signup error:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }
  
  const logout = async () => {
    try {
      loading.value = true
      error.value = ''
      
      await supabase.auth.signOut()
      userStore.clearProfile()
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      
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
    user,
    loading,
    error,
    isAuthenticated,
    login,
    signup,
    logout
  }
}
