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
  const lastTokenValidation = ref<number>(0)

  const isAuthenticated = computed(() => !!token.value && !!user.value && !!userId.value)
  
  const isEmailVerified = computed(() => user.value?.email_confirmed_at || false)
  
  const isProfileComplete = computed(() => user.value?.user_metadata?.profile_completed || false)

  const userDisplayName = computed(() => {
    if (user.value?.full_name) return user.value.full_name
    if (user.value?.username) return user.value.username
    if (user.value?.email) return user.value.email
    return 'User'
  })

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

  const setUserId = (id: string) => {
    userId.value = id
    
    if (process.client) {
      localStorage.setItem('auth_user_id', id)
      console.log('[Auth Store] ✅ User ID stored in localStorage:', id)
    }
    
    console.log('[Auth Store] User ID set:', id)
  }

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

  const clearAuth = () => {
    console.log('[Auth Store] Clearing all auth data')
    
    token.value = null
    user.value = null
    userId.value = null
    rememberMe.value = false
    error.value = null
    lastTokenValidation.value = 0

    if (process.client) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user_id')
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_remember_me')
      localStorage.removeItem('auth_token_validation')
      console.log('[Auth Store] ✅ All auth data cleared from localStorage')
    }
  }

  const validateToken = async () => {
    if (!process.client || !token.value) {
      console.log('[Auth Store] No token to validate')
      return false
    }

    // Don't validate more than once per minute
    const now = Date.now()
    if (lastTokenValidation.value && now - lastTokenValidation.value < 60000) {
      console.log('[Auth Store] Token validation skipped (cached)')
      return true
    }

    try {
      console.log('[Auth Store] Validating token...')
      
      const result = await $fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })

      if (result?.user) {
        console.log('[Auth Store] ✅ Token is valid')
        lastTokenValidation.value = now
        setUser(result.user)
        return true
      }

      console.warn('[Auth Store] Token validation failed - invalid response')
      clearAuth()
      return false

    } catch (err: any) {
      console.error('[Auth Store] Token validation failed:', err.message)
      clearAuth()
      return false
    }
  }

  const hydrateFromStorage = async () => {
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

      // CRITICAL: Validate token if we have one
      if (token.value && user.value) {
        console.log('[Auth Store] Validating restored token...')
        const isValid = await validateToken()
        
        if (!isValid) {
          console.warn('[Auth Store] Restored token is invalid or user was deleted')
          clearAuth()
        }
      }

      isHydrated.value = true
      console.log('[Auth Store] ✅ Hydration complete')
    } catch (err) {
      console.error('[Auth Store] ❌ Hydration error:', err)
      isHydrated.value = true
    }
  }

  const initializeSession = () => {
    return hydrateFromStorage()
  }

  const setLoading = (value: boolean) => {
    isLoading.value = value
  }

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
    validateToken,
    hydrateFromStorage,
    initializeSession,
    setLoading,
    setError
  }
})
