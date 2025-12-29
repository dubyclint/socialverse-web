 FIXED FILE 2: /stores/auth.ts
# ============================================================================
# AUTH STORE - FIXED: Proper localStorage management with store methods
# ============================================================================
# ✅ FIXED: Added setRememberMe() method
# ✅ FIXED: Added getRememberMe() method
# ✅ FIXED: Centralized all localStorage access
# ✅ FIXED: Proper hydration handling
# ✅ FIXED: Comprehensive error handling
# ============================================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '~/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const userId = ref<string | null>(null)
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isHydrated = ref(false)
  const rememberMe = ref(false)

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
  // ✅ FIXED: Token Management
  // ============================================================================
  const setToken = (newToken: string | null) => {
    token.value = newToken
    
    if (process.client) {
      if (newToken) {
        localStorage.setItem('auth_token', newToken)
        console.log('[Auth Store] ✅ Token stored in localStorage')
      } else {
        localStorage.removeItem('auth_token')
        console.log('[Auth Store] ✅ Token removed from localStorage')
      }
    }
    
    console.log('[Auth Store] Token updated')
  }

  // ============================================================================
  // ✅ FIXED: User ID Management
  // ============================================================================
  const setUserId = (id: string) => {
    userId.value = id
    
    if (process.client) {
      localStorage.setItem('auth_user_id', id)
      console.log('[Auth Store] ✅ User ID stored in localStorage:', id)
    }
    
    console.log('[Auth Store] User ID set:', id)
  }

  // ============================================================================
  // ✅ FIXED: User Data Management
  // ============================================================================
  const setUser = (newUser: any) => {
    if (!newUser) {
      user.value = null
      userId.value = null
      
      if (process.client) {
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_user_id')
        console.log('[Auth Store] ✅ User data cleared from localStorage')
      }
      return
    }

    const extractedId = newUser.id || newUser.user_id
    
    if (!extractedId) {
      console.error('[Auth Store] No user ID found in user object')
      return
    }

    const userObj: User = {
      id: extractedId,
      email: newUser.email,
      full_name: newUser.user_metadata?.full_name || null,
      username: newUser.user_metadata?.username || null,
      avatar_url: newUser.user_metadata?.avatar_url || null,
      email_confirmed_at: newUser.email_confirmed_at,
      user_metadata: newUser.user_metadata || {},
      role: newUser.user_metadata?.role || 'user'
    }

    user.value = userObj
    userId.value = extractedId

    if (process.client) {
      localStorage.setItem('auth_user', JSON.stringify(userObj))
      localStorage.setItem('auth_user_id', extractedId)
      console.log('[Auth Store] ✅ User data stored in localStorage')
    }

    console.log('[Auth Store] User set:', extractedId)
  }

  // ============================================================================
  // ✅ FIXED: Remember Me Management (NEW)
  // ============================================================================
  const setRememberMe = (value: boolean) => {
    rememberMe.value = value
    
    if (process.client) {
      if (value) {
        localStorage.setItem('auth_remember_me', 'true')
        console.log('[Auth Store] ✅ Remember me enabled')
      } else {
        localStorage.removeItem('auth_remember_me')
        console.log('[Auth Store] ✅ Remember me disabled')
      }
    }
  }

  const getRememberMe = (): boolean => {
    if (!process.client) return false
    
    const stored = localStorage.getItem('auth_remember_me')
    const value = stored === 'true'
    rememberMe.value = value
    
    console.log('[Auth Store] Remember me retrieved:', value)
    return value
  }

  // ============================================================================
  // ✅ FIXED: Clear All Auth Data
  // ============================================================================
  const clearAuth = () => {
    console.log('[Auth Store] Clearing all auth data')
    
    token.value = null
    userId.value = null
    user.value = null
    rememberMe.value = false
    error.value = null

    if (process.client) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user_id')
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_remember_me')
      console.log('[Auth Store] ✅ All auth data cleared from localStorage')
    }
  }

  // ============================================================================
  // ✅ FIXED: Hydrate from localStorage
  // ============================================================================
  const hydrateFromStorage = () => {
    if (!process.client || isHydrated.value) return

    console.log('[Auth Store] Hydrating from localStorage...')

    try {
      // Restore token
      const storedToken = localStorage.getItem('auth_token')
      if (storedToken) {
        token.value = storedToken
        console.log('[Auth Store] ✅ Token restored from localStorage')
      }

      // Restore user ID
      const storedUserId = localStorage.getItem('auth_user_id')
      if (storedUserId) {
        userId.value = storedUserId
        console.log('[Auth Store] ✅ User ID restored from localStorage')
      }

      // Restore user data
      const storedUser = localStorage.getItem('auth_user')
      if (storedUser) {
        try {
          user.value = JSON.parse(storedUser)
          console.log('[Auth Store] ✅ User data restored from localStorage')
        } catch (parseError) {
          console.error('[Auth Store] ❌ Failed to parse stored user data:', parseError)
          localStorage.removeItem('auth_user')
        }
      }

      // Restore remember me preference
      const storedRememberMe = localStorage.getItem('auth_remember_me')
      if (storedRememberMe === 'true') {
        rememberMe.value = true
        console.log('[Auth Store] ✅ Remember me preference restored')
      }

      isHydrated.value = true
      console.log('[Auth Store] ✅ Hydration complete')
    } catch (err) {
      console.error('[Auth Store] ❌ Hydration error:', err)
      isHydrated.value = true
    }
  }

  // ============================================================================
  // ✅ FIXED: Set Loading State
  // ============================================================================
  const setLoading = (value: boolean) => {
    isLoading.value = value
  }

  // ============================================================================
  // ✅ FIXED: Set Error
  // ============================================================================
  const setError = (err: string | null) => {
    error.value = err
    if (err) {
      console.error('[Auth Store] Error:', err)
    }
  }

  return {
    // State
    token,
    userId,
    user,
    isLoading,
    error,
    isHydrated,
    rememberMe,

    // Computed
    isAuthenticated,
    isEmailVerified,
    isProfileComplete,
    userDisplayName,

    // Methods
    setToken,
    setUserId,
    setUser,
    setRememberMe,
    getRememberMe,
    clearAuth,
    hydrateFromStorage,
    setLoading,
    setError
  }
})
