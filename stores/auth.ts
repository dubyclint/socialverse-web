// FILE: /stores/auth.ts (FIXED - COMPLETE VERSION)
// ============================================================================
// AUTH STORE - FIXED: Proper user persistence and session management
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
  
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  
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
      '/default-avatar.png'
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
   * Set user data and persist to localStorage
   */
  const setUser = (newUser: User | null) => {
    user.value = newUser
    if (typeof window !== 'undefined') {
      if (newUser) {
        try {
          localStorage.setItem('auth_user', JSON.stringify(newUser))
          console.log('[Auth Store] ✅ User persisted to localStorage')
        } catch (e) {
          console.error('[Auth Store] Error persisting user:', e)
        }
      } else {
        localStorage.removeItem('auth_user')
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
    error.value = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      localStorage.removeItem('refresh_token')
    }
    console.log('[Auth Store] ✅ Auth cleared')
  }

  /**
   * Initialize session from stored token and user
   */
  const initializeSession = async () => {
    try {
      if (!token.value || !user.value) {
        console.log('[Auth Store] No stored session found')
        return false
      }

      console.log('[Auth Store] ✅ Session initialized from storage')
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
