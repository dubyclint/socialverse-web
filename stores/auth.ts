import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '~/types/auth'

export const useAuthStore = defineStore('auth', () => {
  // --- STATE (SSR-SAFE COOKIES) ---
  const cookieOptions = { maxAge: 60 * 60 * 24 * 7, path: '/' }
  const token = useCookie<string | null>('auth_token', cookieOptions)
  const refreshToken = useCookie<string | null>('auth_refresh_token', cookieOptions)
  const userId = useCookie<string | null>('auth_user_id', cookieOptions)
  const rememberMe = useCookie<boolean>('auth_remember_me', { default: () => false, ...cookieOptions })

  // --- STATE (CLIENT-ONLY CACHE) ---
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isHydrated = ref(false)

  // --- COMPUTED PROPERTIES ---
  const isAuthenticated = computed(() => !!token.value && !!user.value && !!userId.value)
  const isEmailVerified = computed(() => user.value?.email_confirmed_at || false)
  const isProfileComplete = computed(() => user.value?.user_metadata?.profile_completed || false)

  // --- ACTIONS ---
  const setLoading = (val: boolean) => { isLoading.value = val }
  const setError = (err: string | null) => { error.value = err }
  const setToken = (t: string | null) => { token.value = t }
  const setRefreshToken = (t: string | null) => { refreshToken.value = t }
  const setUserId = (id: string | null) => { userId.value = id }
  const setRememberMe = (val: boolean) => { rememberMe.value = val }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const response: any = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      })
      if (!response?.token || !response?.user?.id) throw new Error('Invalid login response')
      setToken(response.token)
      setUser(response.user)
      if (response.refreshToken) setRefreshToken(response.refreshToken)
      return { success: true, redirectTo: response.redirectTo }
    } catch (err: any) {
      const msg = err.data?.statusMessage || err.message || 'Login failed'
      setError(msg)
      return { success: false, message: msg }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (data: any) => {
    setLoading(true)
    setError(null)
    try {
      const response: any = await $fetch('/api/auth/signup', {
        method: 'POST',
        body: data
      })
      // If your API automatically logs them in after sign up, 
      // you can call setUser(response.user) here.
      return { success: true, data: response }
    } catch (err: any) {
      const msg = err.data?.statusMessage || err.message || 'Registration failed'
      setError(msg)
      return { success: false, message: msg }
    } finally {
      setLoading(false)
    }
  }

  const setUser = (newUser: any) => {
    if (!newUser) {
      user.value = null
      userId.value = null
      if (import.meta.client) localStorage.removeItem('auth_user')
      return
    }
    const extractedId = newUser.id || newUser.user_id
    user.value = newUser
    userId.value = extractedId
    if (import.meta.client) localStorage.setItem('auth_user', JSON.stringify(newUser))
  }

  const clearAuth = () => {
    token.value = null
    refreshToken.value = null
    userId.value = null
    user.value = null
    setError(null)
    setLoading(false)
    if (import.meta.client) localStorage.removeItem('auth_user')
  }

  const hydrateFromStorage = async () => {
    if (isHydrated.value) return
    if (import.meta.client) {
      const stored = localStorage.getItem('auth_user')
      if (stored) user.value = JSON.parse(stored)
    }
    isHydrated.value = true
  }

  return {
    token, refreshToken, userId, user, isLoading, error, isHydrated,
    isAuthenticated, isEmailVerified, isProfileComplete,
    signIn, signUp, setUser, setToken, setRefreshToken, setUserId, 
    setRememberMe, setLoading, setError, clearAuth, hydrateFromStorage
  }
})
