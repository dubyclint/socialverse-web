// ============================================================================
// FILE: /stores/auth.ts - FINAL FIXED PRODUCTION VERSION (COOKIE-BASED)
// ============================================================================
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '~/types/auth'

export const useAuthStore = defineStore('auth', () => {
  // ============================================================================
  // STATE (SSR-SAFE COOKIES)
  // Nuxt automatically synchronizes these across the server and client.
  // ============================================================================
  const cookieOptions = { maxAge: 60 * 60 * 24 * 7, path: '/' } // 7 Days
  
  const token = useCookie<string | null>('auth_token', cookieOptions)
  const refreshToken = useCookie<string | null>('auth_refresh_token', cookieOptions)
  const userId = useCookie<string | null>('auth_user_id', cookieOptions)
  const rememberMe = useCookie<boolean>('auth_remember_me', { default: () => false, ...cookieOptions })

  // ============================================================================
  // STATE (CLIENT-ONLY CACHE)
  // We keep the large user object out of cookies to avoid the 4KB browser limit.
  // ============================================================================
  const user = ref<User | null>(null)
  
  // Transient state
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isHydrated = ref(false)
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
    token.value = newToken // useCookie automatically syncs this to the browser
  }

  const setRefreshToken = (newRefreshToken: string | null) => {
    refreshToken.value = newRefreshToken
  }

  const getRefreshToken = (): string | null => {
    return refreshToken.value
  }

  const setUserId = (id: string | null) => {
    userId.value = id
  }

  const setUser = (newUser: any) => {
    if (!newUser) {
      user.value = null
      userId.value = null
      if (import.meta.client) localStorage.removeItem('auth_user')
      return
    }

    const extractedId = newUser.id || newUser.user_id

    if (!extractedId) {
      user.value = null
      userId.value = null
      if (import.meta.client) localStorage.removeItem('auth_user')
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
    userId.value = extractedId // Updates the cookie

    if (import.meta.client) {
      try {
        localStorage.setItem('auth_user', JSON.stringify(userObj))
      } catch (err) {
        console.error('[Auth Store] Failed to cache user data:', err)
      }
    }
  }

  const setRememberMe = (value: boolean) => {
    rememberMe.value = value
  }

  const getRememberMe = (): boolean => {
    return rememberMe.value
  }

  const setSignupFlow = (value: boolean) => {
    isInSignupFlow.value = value
    if (import.meta.client) {
      value ? sessionStorage.setItem('signup_flow', 'true') : sessionStorage.removeItem('signup_flow')
    }
  }

  const getSignupFlow = (): boolean => {
    if (!import.meta.client) return false
    const stored = sessionStorage.getItem('signup_flow')
    const value = stored === 'true'
    isInSignupFlow.value = value
    return value
  }

  const clearSignupFlow = () => {
    isInSignupFlow.value = false
    if (import.meta.client) sessionStorage.removeItem('signup_flow')
  }

  const clearAuth = () => {
    // Setting cookies to null automatically deletes them in the browser
    token.value = null
    refreshToken.value = null
    userId.value = null
    
    user.value = null
    rememberMe.value = false
    error.value = null
    lastTokenValidation.value = 0
    isHydrated.value = true
    isInSignupFlow.value = false

    if (import.meta.client) {
      try {
        localStorage.removeItem('auth_user')
        sessionStorage.removeItem('signup_flow')
      } catch (err) {
        console.error('[Auth Store] Storage cleanup error:', err)
      }
    }
  }

  const validateToken = async () => {
    // Both client and server can validate the token now
    if (!token.value) return false
    
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
    if (isHydrated.value) return
    
    // NOTE: Cookies (token, refreshToken, userId, rememberMe) are ALREADY 
    // populated by Nuxt before this function even runs!
    
    // We only need to hydrate the large user object and transient session data on the client
    if (import.meta.client) {
      try {
        const storedUser = localStorage.getItem('auth_user')
        if (storedUser) {
          user.value = JSON.parse(storedUser)
          // Self-heal: Ensure the cached user ID matches the secure cookie ID
          if (user.value?.id && user.value.id !== userId.value) {
             userId.value = user.value.id
          }
        }
        isInSignupFlow.value = sessionStorage.getItem('signup_flow') === 'true'
      } catch (err) {
        console.error('[Auth Store] User hydration error:', err)
        localStorage.removeItem('auth_user')
      }
    }

    // Trigger validation if we have a token but no user object
    if (token.value && !user.value) {
      validateToken().catch(() => console.warn('[Auth Store] Token validation failed.'))
    }

    isHydrated.value = true
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
