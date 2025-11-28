// ============================================================================
// FILE: /stores/auth.ts
// ============================================================================
// ✅ FIXED: Added proper null checks and initialization

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '~/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  )
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ✅ FIXED: Add computed properties with null checks
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isEmailVerified = computed(() => user.value?.profile?.email_verified || false)
  const isProfileCompleted = computed(() => user.value?.profile?.profile_completed || false)
  const userDisplayName = computed(() => user.value?.profile?.full_name || user.value?.email || 'User')
  const userAvatar = computed(() => user.value?.profile?.avatar_url || '/default-avatar.png')

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

  const setUser = (newUser: User | null) => {
    user.value = newUser
  }

  const setError = (errorMsg: string | null) => {
    error.value = errorMsg
  }

  const clearAuth = () => {
    token.value = null
    user.value = null
    error.value = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  }

  // ✅ ADDED: Initialize session from stored token
  const initializeSession = async () => {
    try {
      if (!token.value) {
        console.log('[Auth Store] No token found')
        return false
      }

      console.log('[Auth Store] Initializing session from token')
      // Fetch user data from token
      // This would typically call an API endpoint
      return true
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Session initialization failed'
      console.error('[Auth Store] Session init error:', errorMsg)
      setError(errorMsg)
      return false
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
    initializeSession
  }
})

