// ============================================================================
// FILE: /stores/auth.ts - FINAL FIXED PRODUCTION VERSION
// ============================================================================
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '~/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const userId = ref<string | null>(null)
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isHydrated = ref(false)
  const rememberMe = ref(false)
  const lastTokenValidation = ref<number>(0)
  const isInSignupFlow = ref(false)

  // ============================================================================
  // COMPUTED PROPERTIES
  // ============================================================================
  const isAuthenticated = computed(() => !!token.value && !!user.value && !!userId.value)
  const isEmailVerified = computed(() => user.value?.email_confirmed_at || false)
  const isProfileComplete = computed(() => user.value?.user_metadata?.profile_completed || false)

  const username = computed(() => user.value?.user_metadata?.username || user.value?.username || 'Unknown')
  const userDisplayName = computed(() => {
    const meta = user.value?.user_metadata
    return meta?.full_name || meta?.display_name || user.value?.full_name || username.value || user.value?.email || 'User'
  })
  const userAvatar = computed(() => user.value?.user_metadata?.avatar_url || user.value?.avatar_url || '/default-avatar.png')
  const userFollowers = computed(() => user.value?.user_metadata?.followers_count || 0)
  const userFollowing = computed(() => user.value?.user_metadata?.following_count || 0)
  const userPosts = computed(() => user.value?.user_metadata?.posts_count || 0)
  const userEmail = computed(() => user.value?.email || '')
  const userFullName = computed(() => user.value?.user_metadata?.full_name || user.value?.full_name || '')

  // ============================================================================
  // ACTIONS
  // ============================================================================
  const setToken = (newToken: string | null) => {
    token.value = newToken
    if (process.client) {
      newToken ? localStorage.setItem('auth_token', newToken) : localStorage.removeItem('auth_token')
    }
  }

  const setRefreshToken = (newRefreshToken: string | null) => {
    refreshToken.value = newRefreshToken
    if (process.client) {
      newRefreshToken ? localStorage.setItem('auth_refresh_token', newRefreshToken) : localStorage.removeItem('auth_refresh_token')
    }
  }

  const getRefreshToken = (): string | null => {
    if (!process.client) return null
    const stored = localStorage.getItem('auth_refresh_token')
    if (stored) refreshToken.value = stored
    return stored
  }

  const setUserId = (id: string | null) => {
    userId.value = id
    if (process.client) {
      id ? localStorage.setItem('auth_user_id', id) : localStorage.removeItem('auth_user_id')
    }
  }

  const setUser = (newUser: any) => {
    if (!newUser) {
      user.value = null
      userId.value = null
      if (process.client) {
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_user_id')
      }
      return
    }

    const extractedId = newUser.id || newUser.user_id

    // FIX: clear stale identity if incoming user has no id
    if (!extractedId) {
      user.value = null
      userId.value = null
      if (process.client) {
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_user_id')
      }
      return
    }

    const metadata = newUser.user_metadata || {}
    const userObj: User = {
      id: extractedId,
      email: newUser.email || '',
      full_name: metadata.full_name || newUser.display_name || newUser.full_name || null,
      username: metadata.username || newUser.username || null,
      avatar_url: metadata.avatar_url || newUser.avatar_url || null,
      email_confirmed_at: newUser.email_confirmed_at || null,
      user_metadata: {
        username: metadata.username || newUser.username || null,
        full_name: metadata.full_name || newUser.display_name || newUser.full_name || null,
        avatar_url: metadata.avatar_url || newUser.avatar_url || null,
        followers_count: metadata.followers_count || 0,
        following_count: metadata.following_count || 0,
        posts_count: metadata.posts_count || 0,
        profile_completed: metadata.profile_completed || false,
        location: metadata.location || newUser.location || null,
        is_verified: metadata.is_verified || newUser.is_verified || false,
        ...metadata
      },
      role: metadata.role || 'user'
    }

    user.value = userObj
    userId.value = extractedId

    if (process.client) {
      try {
        localStorage.setItem('auth_user', JSON.stringify(userObj))
        localStorage.setItem('auth_user_id', extractedId)
      } catch (err) {
        console.error('[Auth Store] Failed to cache user data:', err)
      }
    }
  }

  const setRememberMe = (value: boolean) => {
    rememberMe.value = value
    if (process.client) {
      value ? localStorage.setItem('auth_remember_me', 'true') : localStorage.removeItem('auth_remember_me')
    }
  }

  const getRememberMe = (): boolean => {
    if (!process.client) return false
    const stored = localStorage.getItem('auth_remember_me')
    const value = stored === 'true'
    rememberMe.value = value
    return value
  }

  const setSignupFlow = (value: boolean) => {
    isInSignupFlow.value = value
    if (process.client) {
      value ? sessionStorage.setItem('signup_flow', 'true') : sessionStorage.removeItem('signup_flow')
    }
  }

  const getSignupFlow = (): boolean => {
    if (!process.client) return false
    const stored = sessionStorage.getItem('signup_flow')
    const value = stored === 'true'
    isInSignupFlow.value = value
    return value
  }

  const clearSignupFlow = () => {
    isInSignupFlow.value = false
    if (process.client) sessionStorage.removeItem('signup_flow')
  }

  const clearAuth = () => {
    token.value = null
    refreshToken.value = null
    user.value = null
    userId.value = null
    rememberMe.value = false
    error.value = null
    lastTokenValidation.value = 0

    // FIX: keep hydration marked complete; do not set false
    isHydrated.value = true

    isInSignupFlow.value = false

    if (process.client) {
      try {
        const keys = ['auth_token', 'auth_user_id', 'auth_user', 'auth_remember_me', 'auth_refresh_token']
        keys.forEach(k => localStorage.removeItem(k))
        sessionStorage.removeItem('signup_flow')
      } catch (err) {
        console.error('[Auth Store] Storage cleanup error:', err)
      }
    }
  }

  const validateToken = async () => {
    if (!process.client || !token.value) return false
    if (!token.value.startsWith('eyJ') || token.value.split('.').length !== 3) {
      console.error('[Auth Store] Invalid token format detected.')
      clearAuth()
      return false
    }

    const now = Date.now()
    if (lastTokenValidation.value && now - lastTokenValidation.value < 60000) return true

    try {
      const result = await $fetch<any>('/api/auth/me', {
        headers: { Authorization: `Bearer ${token.value}` }
      })
      if (result?.user) {
        lastTokenValidation.value = now
        setUser(result.user)
        return true
      }
      clearAuth()
      return false
    } catch {
      clearAuth()
      return false
    }
  }

  async function hydrateFromStorage() {
    if (!process.client || isHydrated.value) return
    try {
      const storedToken = localStorage.getItem('auth_token')
      if (storedToken && storedToken.startsWith('eyJ') && storedToken.split('.').length === 3) {
        token.value = storedToken
      } else if (storedToken) {
        console.warn('[Auth Store] Discarded corrupted token.')
        localStorage.removeItem('auth_token')
      }

      refreshToken.value = localStorage.getItem('auth_refresh_token')
      userId.value = localStorage.getItem('auth_user_id')

      const storedUser = localStorage.getItem('auth_user')
      if (storedUser) {
        try {
          user.value = JSON.parse(storedUser)

          // FIX: sync userId from parsed user if missing/mismatched
          if (user.value?.id) {
            userId.value = user.value.id
            localStorage.setItem('auth_user_id', user.value.id)
          }
        } catch {
          localStorage.removeItem('auth_user')
        }
      }

      rememberMe.value = localStorage.getItem('auth_remember_me') === 'true'
      isInSignupFlow.value = sessionStorage.getItem('signup_flow') === 'true'

      if (token.value && user.value) {
        validateToken().catch(() => console.warn('[Auth Store] Token validation failed.'))
      }

      isHydrated.value = true
    } catch (err) {
      console.error('[Auth Store] Hydration error:', err)
      isHydrated.value = true
    }
  }

  const initializeSession = () => hydrateFromStorage()

  const setLoading = (value: boolean) => {
    isLoading.value = value
  }

  const setError = (err: string | null) => {
    error.value = err
  }

  return {
    token,
    refreshToken,
    userId,
    user,
    isLoading,
    error,
    isHydrated,
    rememberMe,
    isInSignupFlow,
    isAuthenticated,
    isEmailVerified,
    isProfileComplete,
    username,
    userDisplayName,
    userAvatar,
    userFollowers,
    userFollowing,
    userPosts,
    userEmail,
    userFullName,
    setToken,
    setRefreshToken,
    getRefreshToken,
    setUserId,
    setUser,
    setRememberMe,
    getRememberMe,
    setSignupFlow,
    getSignupFlow,
    clearSignupFlow,
    clearAuth,
    validateToken,
    hydrateFromStorage,
    initializeSession,
    setLoading,
    setError
  }
})
