// stores/auth.ts
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
      } else {
        localStorage.removeItem('auth_token')
      }
    }
    
    console.log('[Auth Store] Token updated')
  }

  const setUserId = (id: string) => {
    userId.value = id
    
    if (process.client) {
      localStorage.setItem('auth_user_id', id)
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
      bio: newUser.user_metadata?.bio || null,
      email_confirmed_at: newUser.email_confirmed_at,
      user_metadata: newUser.user_metadata || {},
      profile: newUser.user_metadata?.profile || null
    }

    user.value = userObj
    userId.value = extractedId

    if (process.client) {
      localStorage.setItem('auth_user', JSON.stringify(userObj))
      localStorage.setItem('auth_user_id', extractedId)
      console.log('[Auth Store] User persisted to localStorage with ID:', extractedId)
    }
  }

  const initializeSession = (): boolean => {
    if (!process.client) {
      console.log('[Auth Store] Skipping session init on server')
      return false
    }

    try {
      const storedToken = localStorage.getItem('auth_token')
      const storedUser = localStorage.getItem('auth_user')
      const storedUserId = localStorage.getItem('auth_user_id')
      
      if (storedToken && storedUser && storedUserId) {
        token.value = storedToken
        user.value = JSON.parse(storedUser)
        userId.value = storedUserId
        isHydrated.value = true
        
        console.log('[Auth Store] Session restored from localStorage')
        console.log('[Auth Store] User ID:', userId.value)
        console.log('[Auth Store] Authenticated:', isAuthenticated.value)
        
        return true
      }
      
      isHydrated.value = true
      console.log('[Auth Store] No session found in localStorage')
      return false
    } catch (error) {
      console.error('[Auth Store] Error initializing session:', error)
      clearAuth()
      isHydrated.value = true
      return false
    }
  }

  const hydrate = () => {
    return initializeSession()
  }

  const clearAuth = () => {
    console.log('[Auth Store] Clearing authentication...')
    
    token.value = null
    user.value = null
    userId.value = null
    error.value = null
    isHydrated.value = false
    
    if (process.client) {
      try {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_user_id')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        localStorage.removeItem('session')
        
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (
            key.includes('auth') || 
            key.includes('session') || 
            key.includes('user') ||
            key.includes('token')
          )) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key)
          } catch (e) {
            console.warn(`[Auth Store] Failed to remove ${key}:`, e)
          }
        })
        
        console.log('[Auth Store] Auth cleared from localStorage')
      } catch (error) {
        console.error('[Auth Store] Error clearing localStorage:', error)
      }
    }
    
    console.log('[Auth Store] Auth cleared completely')
  }

  const updateUserProfile = (profileData: Partial<User>) => {
    if (!user.value) {
      console.error('[Auth Store] Cannot update profile - no user')
      return
    }

    user.value = {
      ...user.value,
      ...profileData
    }

    if (process.client) {
      localStorage.setItem('auth_user', JSON.stringify(user.value))
    }
    
    console.log('[Auth Store] User profile updated')
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage
  }

  return {
    token,
    userId,
    user,
    isLoading,
    error,
    isHydrated,
    
    isAuthenticated,
    isEmailVerified,
    isProfileComplete,
    userDisplayName,
    
    setToken,
    setUserId,
    setUser,
    initializeSession,
    hydrate,
    clearAuth,
    updateUserProfile,
    setLoading,
    setError
  }
})
