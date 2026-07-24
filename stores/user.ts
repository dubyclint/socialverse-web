// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Profile } from '~/types/profile'
import type { AuthUser, CallRecord } from '~/types/user'
import { authService } from '~/services/authService'
import { profileService } from '~/services/profileService'
import { useSupabaseUser, useSupabaseClient } from '#imports'

export const useUserStore = defineStore('user', () => {
  const supabaseUser = useSupabaseUser()
  const supabase = useSupabaseClient()

  const user = ref<AuthUser | null>(null)
  const profile = ref<Profile | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const rememberMe = ref(false)

  const token = ref<string | null>(null)
  const posts = ref<any[]>([])
  const notifications = ref<any[]>([])
  const callHistory = ref<CallRecord[]>([])

  const userId = computed<string | null>(() => user.value?.id || profile.value?.user_id || supabaseUser.value?.id || null)
  const isAuthenticated = computed<boolean>(() => !!user.value || !!supabaseUser.value)

  const userDisplayName = computed<string>(() =>
    user.value?.full_name ||
    user.value?.username ||
    profile.value?.full_name ||
    profile.value?.username ||
    supabaseUser.value?.email ||
    'User'
  )

  const userInitials = computed<string>(() =>
    userDisplayName.value
      .split(' ')
      .map((part: string) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase()
  )

  const userAvatar = computed<string | null>(() =>
    user.value?.avatar ||
    user.value?.avatar_url ||
    profile.value?.avatar_url ||
    null
  )

  const userEmail = computed<string | null>(() =>
    user.value?.email || profile.value?.email || supabaseUser.value?.email || null
  )

  const isEmailVerified = computed<boolean>(() => !!user.value?.email_confirmed_at || !!supabaseUser.value?.email_confirmed_at)

  const setUser = (payload: Partial<AuthUser> | null): void => {
    if (payload === null) {
      user.value = null
      return
    }
    user.value = { ...(user.value ?? {}), ...payload } as AuthUser
  }

  const updateProfile = (input: Partial<Profile>): void => {
    const base = profile.value ?? ({ user_id: user.value?.id || supabaseUser.value?.id || '' } as Profile)
    profile.value = { ...base, ...input }
  }

  const setError = (val: string | null) => { error.value = val }
  const setRememberMe = (val: boolean) => { rememberMe.value = val }

  const setToken = (val: string | null) => {
    token.value = val
  }

  const signIn = async (email: string, password: string) => {
    isLoading.value = true
    error.value = null
    try {
      const { data, error: authErr } = await authService.signIn(email, password)
      if (authErr) throw authErr

      user.value = (data?.user as AuthUser) || (supabaseUser.value as unknown as AuthUser) || null
      setToken(data?.session?.access_token || null)
      
      try {
        profile.value = await profileService.getMe()
      } catch {
        profile.value = null
      }
      
      return { success: true }
    } catch (err: any) {
      error.value = err?.message || 'Sign in failed'
      return { success: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const fetchProfile = async (): Promise<void> => {
    try {
      profile.value = await profileService.getMe()
    } catch (err: any) {
      error.value = err?.message || 'Failed to load profile'
      throw err
    }
  }

  const refreshProfile = async (): Promise<void> => {
    await fetchProfile()
  }

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('[UserStore] Provider sign-out failed, clearing local state anyway:', err)
    }
    user.value = null
    profile.value = null
    posts.value = []
    notifications.value = []
    setToken(null)
  }

  const initializeSession = async (): Promise<void> => {
    isLoading.value = true
    try {
      if (supabaseUser.value) {
        user.value = supabaseUser.value as unknown as AuthUser
        try {
          profile.value = await profileService.getMe()
        } catch {
          profile.value = null
        }
      } else {
        const { data } = await authService.getSession()
        const session = (data as { session?: { user: AuthUser; access_token?: string } | null } | null)?.session
        if (session) {
          user.value = session.user
          setToken(session.access_token || null)
          try {
            profile.value = await profileService.getMe()
          } catch {
            profile.value = null
          }
        }
      }
    } catch (err: any) {
      error.value = err?.message || 'Failed to initialize session'
    } finally {
      isLoading.value = false
    }
  }

  const isTokenExpired = (): boolean => {
    return false
  }

  const refreshToken = async (): Promise<void> => {
    await initializeSession()
  }

  const signUp = async (
    email: string,
    password: string,
    options?: { data?: Record<string, unknown> }
  ): Promise<{ success: boolean; message?: string; user?: AuthUser | null }> => {
    isLoading.value = true
    error.value = null
    try {
      const { data, error: authErr } = await authService.signUp(email, password, options)
      if (authErr) throw authErr
      user.value = (data?.user as AuthUser | null) ?? null
      setToken(data?.session?.access_token ?? null)
      return { success: true, user: user.value }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed'
      error.value = message
      return { success: false, message }
    } finally {
      isLoading.value = false
    }
  }

  return {
    user,
    profile,
    isLoading,
    error,
    rememberMe,
    token,
    posts,
    notifications,
    callHistory,
    userId,
    isAuthenticated,
    userDisplayName,
    userInitials,
    userAvatar,
    userEmail,
    isEmailVerified,
    setError,
    setRememberMe,
    setToken,
    setUser,
    updateProfile,
    signIn,
    signUp,
    fetchProfile,
    refreshProfile,
    logout,
    initializeSession,
    isTokenExpired,
    refreshToken
  }
})
