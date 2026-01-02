// ============================================================================
// FILE 4: /stores/auth.ts - COMPLETE FIXED VERSION
// ============================================================================
// FIXES:
// ✅ Verify setUser method properly extracts all fields
// ✅ Ensure username is accessible
// ✅ Verify token persistence
// ✅ Better computed properties
// ✅ Improved user data handling
// ============================================================================

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

  // ============================================================================
  // COMPUTED PROPERTIES - MUST BE BEFORE RETURN STATEMENT
  // ============================================================================
  const isAuthenticated = computed(() => !!token.value && !!user.value && !!userId.value)
  
  const isEmailVerified = computed(() => user.value?.email_confirmed_at || false)
  
  const isProfileComplete = computed(() => user.value?.user_metadata?.profile_completed || false)

  // ✅ FIXED: Username accessible from multiple sources
  const username = computed(() => {
    return user.value?.user_metadata?.username || 
           user.value?.username ||
           'Unknown'
  })

  const userDisplayName = computed(() => {
    if (user.value?.user_metadata?.full_name) return user.value.user_metadata.full_name
    if (user.value?.full_name) return user.value.full_name
    if (username.value) return username.value
    if (user.value?.email) return user.value.email
    return 'User'
  })

  // ✅ FIXED: Avatar accessible from multiple sources
  const userAvatar = computed(() => {
    return user.value?.user_metadata?.avatar_url || 
           user.value?.avatar_url ||
           '/default-avatar.png'
  })

  // ✅ FIXED: User stats from metadata
  const userFollowers = computed(() => {
    return user.value?.user_metadata?.followers_count || 0
  })

  const userFollowing = computed(() => {
    return user.value?.user_metadata?.following_count || 0
  })

  const userPosts = computed(() => {
    return user.value?.user_metadata?.posts_count || 0
  })

  // ✅ NEW: Email accessible
  const userEmail = computed(() => {
    return user.value?.email || ''
  })

  // ✅ NEW: Full name accessible
  const userFullName = computed(() => {
    return user.value?.user_metadata?.full_name || 
           user.value?.full_name ||
           ''
  })

  // ============================================================================
  // SET TOKEN METHOD - ✅ IMPROVED
  // ============================================================================
  const setToken = (newToken: string | null) => {
    console.log('[Auth Store] Setting token...')
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
    
    console.log('[Auth Store] Token updated:', !!newToken)
  }

  // ============================================================================
  // SET USER ID METHOD - ✅ IMPROVED
  // ============================================================================
  const setUserId = (id: string) => {
    console.log('[Auth Store] Setting user ID:', id)
    userId.value = id
    
    if (process.client) {
      localStorage.setItem('auth_user_id', id)
      console.log('[Auth Store] ✅ User ID stored in localStorage')
    }
    
    console.log('[Auth Store] User ID set:', id)
  }

  // ============================================================================
  // SET USER METHOD - ✅ COMPLETELY FIXED
  // ============================================================================
  const setUser = (newUser: any) => {
    console.log('[Auth Store] ============ SET USER START ============')
    
    if (!newUser) {
      console.log('[Auth Store] Clearing user data (newUser is null)')
      user.value = null
      userId.value = null
      
      if (process.client) {
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_user_id')
        console.log('[Auth Store] ✅ User data cleared from localStorage')
      }
      console.log('[Auth Store] ============ SET USER END ============')
      return
    }

    console.log('[Auth Store] Processing user object:', {
      hasId: !!newUser.id,
      hasEmail: !!newUser.email,
      hasMetadata: !!newUser.user_metadata
    })

    // ============================================================================
    // EXTRACT USER ID
    // ============================================================================
    const extractedId = newUser.id || newUser.user_id
    
    if (!extractedId) {
      console.error('[Auth Store] ❌ No user ID found in user object')
      console.log('[Auth Store] ============ SET USER END ============')
      return
    }

    console.log('[Auth Store] ✅ User ID extracted:', extractedId)

    // ============================================================================
    // EXTRACT USER METADATA
    // ============================================================================
    const metadata = newUser.user_metadata || {}
    
    console.log('[Auth Store] User metadata:', {
      username: metadata.username,
      full_name: metadata.full_name,
      avatar_url: metadata.avatar_url
    })

    // ============================================================================
    // BUILD COMPLETE USER OBJECT - ✅ FIXED
    // ============================================================================
    const userObj: User = {
      id: extractedId,
      email: newUser.email || '',
      full_name: metadata.full_name || newUser.full_name || null,
      username: metadata.username || newUser.username || null,
      avatar_url: metadata.avatar_url || newUser.avatar_url || null,
      email_confirmed_at: newUser.email_confirmed_at || null,
      user_metadata: {
        username: metadata.username || newUser.username || null,
        full_name: metadata.full_name || newUser.full_name || null,
        avatar_url: metadata.avatar_url || newUser.avatar_url || null,
        followers_count: metadata.followers_count || 0,
        following_count: metadata.following_count || 0,
        posts_count: metadata.posts_count || 0,
        profile_completed: metadata.profile_completed || false,
        ...metadata // Include all other metadata
      },
      role: metadata.role || 'user'
    }

    console.log('[Auth Store] ✅ Complete user object built:', {
      id: userObj.id,
      email: userObj.email,
      username: userObj.user_metadata.username,
      full_name: userObj.user_metadata.full_name
    })

    user.value = userObj
    userId.value = extractedId

    // ============================================================================
    // PERSIST TO LOCALSTORAGE
    // ============================================================================
    if (process.client) {
      try {
        localStorage.setItem('auth_user', JSON.stringify(userObj))
        localStorage.setItem('auth_user_id', extractedId)
        console.log('[Auth Store] ✅ User data stored in localStorage')
      } catch (err) {
        console.error('[Auth Store] ❌ Failed to store user in localStorage:', err)
      }
    }

    console.log('[Auth Store] ============ SET USER END ============')
  }

  // ============================================================================
  // SET REMEMBER ME METHOD
  // ============================================================================
  const setRememberMe = (value: boolean) => {
    console.log('[Auth Store] Setting remember me:', value)
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

  // ============================================================================
  // GET REMEMBER ME METHOD
  // ============================================================================
  const getRememberMe = (): boolean => {
    if (!process.client) return false
    
    const stored = localStorage.getItem('auth_remember_me')
    const value = stored === 'true'
    rememberMe.value = value
    
    console.log('[Auth Store] Remember me retrieved:', value)
    return value
  }

  // ============================================================================
  // CLEAR AUTH METHOD - ✅ IMPROVED
  // ============================================================================
  const clearAuth = () => {
    console.log('[Auth Store] ============ CLEAR AUTH START ============')
    console.log('[Auth Store] Clearing all auth data')
    
    token.value = null
    user.value = null
    userId.value = null
    rememberMe.value = false
    error.value = null
    lastTokenValidation.value = 0

    if (process.client) {
      try {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user_id')
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_remember_me')
        localStorage.removeItem('auth_token_validation')
        localStorage.removeItem('auth_refresh_token')
        console.log('[Auth Store] ✅ All auth data cleared from localStorage')
      } catch (err) {
        console.error('[Auth Store] ❌ Failed to clear localStorage:', err)
      }
    }
    
    console.log('[Auth Store] ============ CLEAR AUTH END ============')
  }

  // ============================================================================
  // VALIDATE TOKEN METHOD - ✅ IMPROVED
  // ============================================================================
  const validateToken = async () => {
    console.log('[Auth Store] ============ VALIDATE TOKEN START ============')
    
    if (!process.client || !token.value) {
      console.log('[Auth Store] No token to validate (client or token missing)')
      console.log('[Auth Store] ============ VALIDATE TOKEN END ============')
      return false
    }

    const now = Date.now()
    if (lastTokenValidation.value && now - lastTokenValidation.value < 60000) {
      console.log('[Auth Store] Token validation skipped (cached, less than 60s)')
      console.log('[Auth Store] ============ VALIDATE TOKEN END ============')
      return true
    }

    try {
      console.log('[Auth Store] Validating token with API...')
      
      const result = await $fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })

      if (result?.user) {
        console.log('[Auth Store] ✅ Token is valid')
        console.log('[Auth Store] User from validation:', {
          id: result.user.id,
          email: result.user.email
        })
        
        lastTokenValidation.value = now
        setUser(result.user)
        
        console.log('[Auth Store] ============ VALIDATE TOKEN END ============')
        return true
      }

      console.warn('[Auth Store] Token validation failed - invalid response')
      clearAuth()
      console.log('[Auth Store] ============ VALIDATE TOKEN END ============')
      return false

    } catch (err: any) {
      console.error('[Auth Store] ❌ Token validation failed:', err.message)
      clearAuth()
      console.log('[Auth Store] ============ VALIDATE TOKEN END ============')
      return false
    }
  }

  // ============================================================================
  // HYDRATE FROM STORAGE METHOD - ✅ IMPROVED
  // ============================================================================
  const hydrateFromStorage = async () => {
    console.log('[Auth Store] ============ HYDRATE FROM STORAGE START ============')
    
    if (!process.client || isHydrated.value) {
      console.log('[Auth Store] Hydration skipped (not client or already hydrated)')
      console.log('[Auth Store] ============ HYDRATE FROM STORAGE END ============')
      return
    }

    console.log('[Auth Store] Hydrating from localStorage...')

    try {
      // ============================================================================
      // RESTORE TOKEN
      // ============================================================================
      const storedToken = localStorage.getItem('auth_token')
      if (storedToken) {
        token.value = storedToken
        console.log('[Auth Store] ✅ Token restored from localStorage')
      } else {
        console.log('[Auth Store] No token in localStorage')
      }

      // ============================================================================
      // RESTORE USER ID
      // ============================================================================
      const storedUserId = localStorage.getItem('auth_user_id')
      if (storedUserId) {
        userId.value = storedUserId
        console.log('[Auth Store] ✅ User ID restored from localStorage:', storedUserId)
      } else {
        console.log('[Auth Store] No user ID in localStorage')
      }

      // ============================================================================
      // RESTORE USER DATA
      // ============================================================================
      const storedUser = localStorage.getItem('auth_user')
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          user.value = parsedUser
          console.log('[Auth Store] ✅ User data restored from localStorage:', {
            id: parsedUser.id,
            email: parsedUser.email,
            username: parsedUser.user_metadata?.username
          })
        } catch (parseError) {
          console.error('[Auth Store] ❌ Failed to parse stored user data:', parseError)
          localStorage.removeItem('auth_user')
        }
      } else {
        console.log('[Auth Store] No user data in localStorage')
      }

      // ============================================================================
      // RESTORE REMEMBER ME
      // ============================================================================
      const storedRememberMe = localStorage.getItem('auth_remember_me')
      if (storedRememberMe === 'true') {
        rememberMe.value = true
        console.log('[Auth Store] ✅ Remember me preference restored')
      }

      // ============================================================================
      // VALIDATE RESTORED TOKEN
      // ============================================================================
      if (token.value && user.value) {
        console.log('[Auth Store] Validating restored token...')
        const isValid = await validateToken()
        
        if (!isValid) {
          console.warn('[Auth Store] ⚠️ Restored token is invalid or user was deleted')
          clearAuth()
        } else {
          console.log('[Auth Store] ✅ Restored token is valid')
        }
      } else {
        console.log('[Auth Store] No token or user to validate')
      }

      isHydrated.value = true
      console.log('[Auth Store] ✅ Hydration complete')
      console.log('[Auth Store] ============ HYDRATE FROM STORAGE END ============')
      
    } catch (err) {
      console.error('[Auth Store] ❌ Hydration error:', err)
      isHydrated.value = true
      console.log('[Auth Store] ============ HYDRATE FROM STORAGE END ============')
    }
  }

  // ============================================================================
  // INITIALIZE SESSION METHOD
  // ============================================================================
  const initializeSession = () => {
    console.log('[Auth Store] Initializing session...')
    return hydrateFromStorage()
  }

  // ============================================================================
  // SET LOADING METHOD
  // ============================================================================
  const setLoading = (value: boolean) => {
    console.log('[Auth Store] Setting loading:', value)
    isLoading.value = value
  }

  // ============================================================================
  // SET ERROR METHOD
  // ============================================================================
  const setError = (err: string | null) => {
    error.value = err
    if (err) {
      console.error('[Auth Store] Error:', err)
    } else {
      console.log('[Auth Store] Error cleared')
    }
  }

  // ============================================================================
  // RETURN STATEMENT - INCLUDES ALL COMPUTED PROPERTIES & METHODS
  // ============================================================================
  return {
    // State
    token,
    userId,
    user,
    isLoading,
    error,
    isHydrated,
    rememberMe,
    
    // Computed Properties
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
