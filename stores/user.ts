// FILE: /stores/user.ts - FULLY RECONCILED ARCHITECTURE
// ============================================================================
// ✅ FIXED: Using 'user_id' identity lookup key instead of old 'id' column
// ✅ FIXED: Replaced .single() with .maybeSingle() to prevent database errors
// ✅ FIXED: Integrated reactive profileMissing flag for clean frontend branching
// ✅ FIXED: Injected useNuxtApp import cleanly to handle runtime client extraction
// ============================================================================

import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { useNuxtApp } from '#app'

export const useUserStore = defineStore('user', () => {
  // ============================================================================
  // STATE
  // ============================================================================
  const currentUser = ref<any | null>(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const profileMissing = ref(false)

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

      if (!process.client) {
        console.log('[User Store] Server-side runtime context, skipping session initialization')
        return
      }

      const nuxtApp = useNuxtApp()
      const supabase = nuxtApp.$supabase?.client || (nuxtApp as any).$supabase

      if (!supabase) {
        console.warn('[User Store] Supabase engine not available, skipping session initialization')
        isAuthenticated.value = false
        return
      }

      console.log('[User Store] Initializing session...')
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        throw sessionError
      }

      if (session?.user) {
        console.log('[User Store] ✅ Active session located for user:', session.user.email)
        currentUser.value = session.user
        isAuthenticated.value = true
      } else {
        console.log('[User Store] No active user session located.')
        currentUser.value = null
        isAuthenticated.value = false
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err))
      console.error('[User Store] Session initialization failed:', errorObj.message)
      error.value = errorObj.message
      currentUser.value = null
      isAuthenticated.value = false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch user profile directly from Supabase via relational indexes
   */
  const fetchUserProfile = async (targetUserId: string) => {
    try {
      isLoading.value = true
      error.value = null

      const nuxtApp = useNuxtApp()
      const supabase = nuxtApp.$supabase?.client || (nuxtApp as any).$supabase

      if (!supabase) {
        console.warn('[User Store] Supabase engine not available, cannot fetch profile data records')
        return null
      }

      // Query mapped cleanly against relational index fields
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle()

      if (profileError) {
        throw profileError
      }

      // Expected onboarding logic flow: database profile row is simply missing
      if (!data) {
        console.log('[User Store] Profile row absent (User onboarding state) for ID:', targetUserId)
        if (String(targetUserId) === String(userId.value)) {
          profileMissing.value = true
        }
        return null
      }

      // Profile row matched successfully
      if (String(targetUserId) === String(userId.value)) {
        profileMissing.value = false
      }
      return data
    } catch (err: any) {
      const errorObj = err instanceof Error ? err : new Error(String(err))
      console.error('[User Store] Failed to fetch profile metadata:', errorObj.message)
      error.value = errorObj.message
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Clear user session cache
   */
  const clearSession = () => {
    currentUser.value = null
    isAuthenticated.value = false
    profileMissing.value = false
    error.value = null
  }

  /**
   * Logout user and drop state values securely
   */
  const logout = async () => {
    try {
      const nuxtApp = useNuxtApp()
      const supabase = nuxtApp.$supabase?.client || (nuxtApp as any).$supabase

      if (supabase) {
        await supabase.auth.signOut()
      }

      clearSession()
      console.log('[User Store] User signout completed successfully')
    } catch (err) {
      console.error('[User Store] Logout process intercepted an exception error:', err)
      clearSession()
    }
  }

  // ============================================================================
  // RETURN
  // ============================================================================
  return {
    currentUser: readonly(currentUser),
    isAuthenticated: readonly(isAuthenticated),
    isLoading: readonly(isLoading),
    error: readonly(error),
    profileMissing: readonly(profileMissing),
    
    userId,
    userEmail,
    userName,
    
    initializeSession,
    fetchUserProfile,
    clearSession,
    logout,
  }
})
