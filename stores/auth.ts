// FILE: /stores/auth.ts (COMPLETE FIXED VERSION WITH initializeSession)
// ============================================================================
// AUTH STORE - FIXED: Proper user ID extraction and session management
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
  
  const isProfileComplete = computed(() => user.value?.user_metadata?.profile_completed || false)

  const userDisplayName = computed(() => {
    if (user.value?.full_name) return user.value.full_name
    if (user.value?.username) return user.value.username
    if (user.value?.email) return user.value.email
    return 'User'
  })

  // ============================================================================
  // ACTIONS
  // ============================================================================

  /**
   * ✅ CRITICAL: Set token and persist to localStorage
   */
  const setToken = (newToken: string | null) => {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('auth_token', newToken)
    } else {
      localStorage.removeItem('auth_token')
    }
    console.log('[Auth Store] Token updated')
  }

  /**
   * ✅ CRITICAL: Set user and extract ID
   */
  const setUser = (newUser: any) => {
    if (!newUser) {
      user.value = null
      userId.value = null
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_user_id')
      return
    }

    // ✅ CRITICAL: Extract user ID from Supabase user object
    const extractedId = newUser.id || newUser.user_id
    
    if (!extractedId) {
      console.error('[Auth Store] ❌ No user ID found in user object')
      return
    }

    // ✅ Create user object with ID
    const userObj: User = {
      id: extractedId,
      email: newUser.email,
      full_name: newUser.user_metadata?.full_name || null,
      username: newUser.user_metadata?.username || null,
      avatar_url: newUser.user_metadata?.avatar_url || null,
      bio: newUser.user_metadata?.bio || null,
      email_confirmed_at: newUser.email_confirmed_at,
      user_metadata: newUser.user_metadata || {},
      profile: newUser.user_metadata?.profile || null
    }

    user.value = userObj
    userId.value = extractedId

    // ✅ Persist to localStorage
    localStorage.setItem('auth_user', JSON.stringify(userObj))
    localStorage.setItem('auth_user_id', extractedId)

    console.log('[Auth Store] ✅ User persisted to localStorage with ID:', extractedId)
  }

  /**
   * ✅ NEW: Initialize session from localStorage
   * This method restores the user session from localStorage on app startup
   */
  const initializeSession = (): boolean => {
    try {
      const storedToken = localStorage.getItem('auth_token')
      const storedUser = localStorage.getItem('auth_user')
      const storedUserId = localStorage.getItem('auth_user_id')
      
      // ✅ If all session data exists, restore it
      if (storedToken && storedUser && storedUserId) {
        token.value = storedToken
        user.value = JSON.parse(storedUser)
        userId.value = storedUserId
        
        console.log('[Auth Store] ✅ Session restored from localStorage')
        console.log('[Auth Store] ✅ User ID:', userId.value)
        console.log('[Auth Store] ✅ Authenticated:', isAuthenticated.value)
        
        return true
      }
      
      console.log('[Auth Store] ℹ️ No session found in localStorage')
      return false
    } catch (error) {
      console.error('[Auth Store] ❌ Error initializing session:', error)
      // Clear corrupted data
      clearAuth()
      return false
    }
  }

  /**
   * Clear authentication
   */
  const clearAuth = () => {
    token.value = null
    user.value = null
    userId.value = null
    error.value = null
    
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_user_id')
    
    console.log('[Auth Store] ✅ Auth cleared')
  }

  /**
   * Set error
   */
  const setError = (err: string | null) => {
    error.value = err
  }

  /**
   * Set loading
   */
  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  return {
    // State
    token,
    user,
    userId,
    isLoading,
    error,
    
    // Computed
    isAuthenticated,
    isEmailVerified,
    isProfileComplete,
    userDisplayName,
    
    // Actions
    setToken,
    setUser,
    initializeSession,
    clearAuth,
    setError,
    setLoading
  }
})
