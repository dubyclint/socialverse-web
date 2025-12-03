// FILE: /stores/user.ts - COMPLETE FIXED VERSION
// ============================================================================
// ✅ FIXED: Added missing currentUser ref definition
// ✅ FIXED: Proper null checking and error handling
// ============================================================================

import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'

export const useUserStore = defineStore('user', () => {
  // ============================================================================
  // STATE - ✅ FIXED: Added missing currentUser definition
  // ============================================================================
  const currentUser = ref<any | null>(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ============================================================================
  // COMPUTED
  // ============================================================================
  const userId = computed(() => currentUser.value?.id || null)
  const userEmail = computed(() => currentUser.value?.email || null)
  const userName = computed(() => currentUser.value?.user_metadata?.username || null)

  // ============================================================================
  // METHODS
  // ============================================================================

  /**
   * Initialize session with proper error handling
   */
  const initializeSession = async () => {
    try {
      isLoading.value = true
      error.value = null

      // ✅ Check if we're on client side
      if (typeof window === 'undefined') {
        console.log('[User Store] Server-side, skipping session initialization')
        return
      }

      // ✅ Get Supabase client safely
      const nuxtApp = useNuxtApp()
      const supabase = nuxtApp.$supabase

      if (!supabase) {
        console.warn('[User Store] Supabase not available, skipping session initialization')
        isAuthenticated.value = false
        return
      }

      console.log('[User Store] Initializing session...')
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        throw sessionError
      }

      if (session?.user) {
        console.log('[User Store] ✅ Session found for user:', session.user.email)
        currentUser.value = session.user
        isAuthenticated.value = true
      } else {
        console.log('[User Store] No active session')
        currentUser.value = null
        isAuthenticated.value = false
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err))
      console.error('[User Store] Session initialization failed:', errorObj.message)
      error.value = errorObj.message
      currentUser.value = null
      isAuthenticated.value = false
      // Don't throw - allow app to continue
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch user profile
   */
  const fetchUserProfile = async (userId: string) => {
    try {
      isLoading.value = true
      error.value = null

      const nuxtApp = useNuxtApp()
      const supabase = nuxtApp.$supabase

      if (!supabase) {
        console.warn('[User Store] Supabase not available, cannot fetch profile')
        return null
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        throw profileError
      }

      return data
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err))
      console.error('[User Store] Failed to fetch profile:', errorObj.message)
      error.value = errorObj.message
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Clear user session
   */
  const clearSession = () => {
    currentUser.value = null
    isAuthenticated.value = false
    error.value = null
  }

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      const nuxtApp = useNuxtApp()
      const supabase = nuxtApp.$supabase

      if (supabase) {
        await supabase.auth.signOut()
      }

      clearSession()
      console.log('[User Store] User logged out')
    } catch (err) {
      console.error('[User Store] Logout error:', err)
      // Clear session anyway
      clearSession()
    }
  }

  // ============================================================================
  // RETURN
  // ============================================================================
  return {
    // State (readonly)
    currentUser: readonly(currentUser),
    isAuthenticated: readonly(isAuthenticated),
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // Computed
    userId,
    userEmail,
    userName,
    
    // Methods
    initializeSession,
    fetchUserProfile,
    clearSession,
    logout,
  }
})
