// FILE: /stores/auth.ts (FIXED - COMPLETE VERSION)
// ============================================================================
// AUTH STORE - FIXED: Proper user ID extraction and session management
// ============================================================================
// ✅ CRITICAL FIX: Now properly extracts and stores user ID from Supabase
// ✅ User ID is extracted from supabaseUser.id and stored separately
// ✅ All API calls can now access user ID via authStore.user?.id
// ============================================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '~/types/auth'

export const useAuthStore = defineStore('auth', () => {
  // ============================================================================
  // STATE
  // ============================================================================
  
  const token = ref<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  )
  
  // ✅ CRITICAL: Store user ID separately for quick access
  const userId = ref<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('auth_user_id') : null
  )
  
  const user = ref<User | null>(
    typeof window !== 'undefined' 
      ? (() => {
          try {
            const stored = localStorage.getItem('auth_user')
            return stored ? JSON.parse(stored) : null
          } catch (e) {
            console.error('[Auth Store] Error parsing stored user:', e)
            return null
          }
        })()
      : null
  )
  
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ============================================================================
  // COMPUTED
  // ============================================================================
  
  const isAuthenticated = computed(() => !!token.value && !!user.value && !!userId.value)
  
  const isEmailVerified = computed(() => user.value?.email_confirmed_at || false)
  
  const isProfileCompleted = computed(() => {
    return user.value && (
      user.value.user_metadata?.username || 
      user.value.profile?.username
    )
  })
  
  const userDisplayName = computed(() => {
    return (
      user.value?.user_metadata?.full_name ||
      user.value?.profile?.full_name ||
      user.value?.user_metadata?.username ||
      user.value?.email?.split('@')[0] ||
      'User'
    )
  })
  
  const userAvatar = computed(() => {
    return (
      user.value?.user_metadata?.avatar_url ||
      user.value?.profile?.avatar_url ||
      '/default-avatar.svg'
    )
  })

  // ============================================================================
  // METHODS
  // ============================================================================

  /**
   * Set authentication token
   */
  const setToken = (newToken: string | null) => {
    token.value = newToken
    if (typeof window !== 'undefined') {
      if (newToken) {
        localStorage.setItem('auth_token', newToken)
      } else {
        localStorage.removeItem('auth_token')
      }
    }
  }

  /**
   * ✅ CRITICAL FIX: Set user data with proper ID extraction
   * Extracts user ID from Supabase user object and stores it separately
   */
  const setUser = (supabaseUser: any) => {
    if (!supabaseUser) {
      user.value = null
      userId.value = null
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_user_id')
      }
      console.log('[Auth Store] ✅ User cleared')
      return
    }

    // ✅ CRITICAL: Extract ID from Supabase user object
    const extractedUserId = supabaseUser.id
    
    if (!extractedUserId) {
      console.error('[Auth Store] ❌ No user ID found in Supabase user object')
      return
    }

    // ✅ Create user object with ID
    const userData: User = {
      id: extractedUserId, // ✅ MUST include ID
      email: supabaseUser.email || '',
      username: supabaseUser.user_metadata?.username || '',
      role: supabaseUser.user_metadata?.role || 'user',
      profile: supabaseUser.user_metadata?.profile || {},
      ranks: supabaseUser.user_metadata?.ranks || [],
      wallets: supabaseUser.user_metadata?.wallets || [],
      privacySettings: supabaseUser.user_metadata?.privacySettings || {},
      userSettings: supabaseUser.user_metadata?.userSettings || {},
      walletLock: supabaseUser.user_metadata?.walletLock || {},
      interests: supabaseUser.user_metadata?.interests || [],
      email_confirmed_at: supabaseUser.email_confirmed_at,
      user_metadata: supabaseUser.user_metadata || {}
    }

    user.value = userData
    userId.value = extractedUserId // ✅ Store ID separately
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('auth_user', JSON.stringify(userData))
        localStorage.setItem('auth_user_id', extractedUserId) // ✅ Persist ID
        console.log('[Auth Store] ✅ User persisted to localStorage with ID:', extractedUserId)
      } catch (e) {
        console.error('[Auth Store] Error persisting user:', e)
      }
    }
  }

  /**
   * Set error message
   */
  const setError = (errorMsg: string | null) => {
    error.value = errorMsg
  }

  /**
   * Clear all authentication data
   */
  const clearAuth = () => {
    token.value = null
    user.value = null
    userId.value = null
    error.value = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_user_id') // ✅ Also clear ID
      localStorage.removeItem('refresh_token')
    }
    console.log('[Auth Store] ✅ Auth cleared')
  }

  /**
   * Initialize session from stored token and user
   */
  const initializeSession = async () => {
    try {
      if (!token.value || !user.value || !userId.value) {
        console.log('[Auth Store] No stored session found')
        return false
      }

      console.log('[Auth Store] ✅ Session initialized from storage')
      console.log('[Auth Store] User ID:', userId.value)
      console.log('[Auth Store] User:', userDisplayName.value)
      return true
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Session initialization failed'
      console.error('[Auth Store] Session init error:', errorMsg)
      setError(errorMsg)
      return false
    }
  }

  /**
   * Update user profile data (partial update)
   */
  const updateUserProfile = (updates: Partial<User>) => {
    if (user.value) {
      user.value = { ...user.value, ...updates }
      setUser(user.value)
      console.log('[Auth Store] ✅ User profile updated')
    }
  }

  return {
    // State
    token,
    user,
    userId, // ✅ Export userId for easy access
    isLoading,
    error,

    // Computed
    isAuthenticated,
    isEmailVerified,
    isProfileCompleted,
    userDisplayName,
    userAvatar,

    // Methods
    setToken,
    setUser,
    setError,
    clearAuth,
    initializeSession,
    updateUserProfile
  }
})
