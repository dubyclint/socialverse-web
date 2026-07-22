// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Profile } from '~/types/profile'
import type { AuthUser, CallRecord } from '~/types/user'
import { authService } from '~/services/authService'
import { profileService } from '~/services/profileService'

export const useUserStore = defineStore('user', () => {
  const user = ref<AuthUser | null>(null)
  const profile = ref<Profile | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null) // Added
  const rememberMe = ref(false) // Added

  // ✅ Added: consumed by use-api.ts, use-chat.ts, plugins/socket.client.ts,
  // plugins/fetch-interceptor.ts, services/api.ts, middleware/* guards
  const token = ref<string | null>(null)
  const posts = ref<any[]>([])
  const notifications = ref<any[]>([])
  const callHistory = ref<CallRecord[]>([])

  const userId = computed<string | null>(() => user.value?.id || profile.value?.user_id || null)
  const isAuthenticated = computed<boolean>(() => !!user.value)

  const userDisplayName = computed<string>(() =>
    user.value?.full_name ||
    user.value?.username ||
    profile.value?.full_name ||
    profile.value?.username ||
    'User'
  )

  const userInitials = computed<string>(() =>
    userDisplayName.value
      .split(' ')
      .map(part => part.charAt(0))
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
    user.value?.email || profile.value?.email || null
  )

  const isEmailVerified = computed<boolean>(() => !!user.value?.email_confirmed_at)

  // Merge a (partial) user payload into the session user.
  const setUser = (payload: Partial<AuthUser> | null): void => {
    if (payload === null) {
      user.value = null
      return
    }
    user.value = { ...(user.value ?? {}), ...payload } as AuthUser
  }

  // Merge profile field updates into the cached profile.
  const updateProfile = (input: Partial<Profile>): void => {
    const base = profile.value ?? ({ user_id: user.value?.id ?? '' } as Profile)
    profile.value = { ...base, ...input }
  }

  const setError = (val: string | null) => { error.value = val }
  const setRememberMe = (val: boolean) => { rememberMe.value = val }

  // Keep in-memory token and the 'auth_token' cookie (read by services/api.ts,
  // middleware/guest.ts) in sync from a single call site.
  const setToken = (val: string | null) => {
    token.value = val
    try {
      const tokenCookie = useCookie('auth_token')
      tokenCookie.value = val
    } catch {
      // useCookie requires a Nuxt request/app context; ignore outside of it
    }
  }

  const signIn = async (email: string, password: string) => {
    isLoading.value = true
    error.value = null // Clear previous error
    try {
      const { data, error: authErr } = await authService.signIn(email, password)
      if (authErr) throw authErr

      user.value = data.user as AuthUser | null
      setToken(data.session?.access_token || null)
      profile.value = await profileService.getMe()
      
      return { success: true }
    } catch (err: any) {
      error.value = err.message
      return { success: false, message: err.message }
    } finally {
      isLoading.value = false
    }
  }

  // ✅ Added: fetch/refresh the current user's profile.
  // middleware/{auth,route-guard,security-middleware,status-middleware}.ts and
  // pages/{manager/user,manager/dashboard,stream}.vue call fetchProfile();
  // composables/useSocialFeed.ts calls refreshProfile() as an alias.
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

  // ✅ Added: clears local + provider session state.
  // Consumed by middleware/*, plugins/{fetch-interceptor,socket.client,session-timeout}.client.ts,
  // services/api.ts (on 401)
  const logout = async (): Promise<void> => {
    try {
      await authService.signOut()
    } catch (err) {
      console.warn('[UserStore] Provider sign-out failed, clearing local state anyway:', err)
    }
    user.value = null
    profile.value = null
    posts.value = []
    notifications.value = []
    setToken(null)
  }

  // ✅ Added: hydrates session/profile on app boot.
  // Called by plugins/00-init-sequence.client.ts as userStore.initializeSession()
  const initializeSession = async (): Promise<void> => {
    isLoading.value = true
    try {
      const { data } = await authService.getSession()
      const session = (data as { session?: { user: AuthUser; access_token?: string } | null } | null)?.session
      if (session) {
        user.value = session.user
        setToken(session.access_token || null)
        await fetchProfile()
      }
    } catch (err: any) {
      error.value = err?.message || 'Failed to initialize session'
    } finally {
      isLoading.value = false
    }
  }

  // ✅ Added: token lifecycle helpers consumed by composables/use-fetch.ts
  const isTokenExpired = (): boolean => {
    // Permissive default: let the server reject expired tokens via 401 handler.
    // Replace with real JWT exp parsing when token refresh is wired end-to-end.
    return false
  }

  const refreshToken = async (): Promise<void> => {
    // Best-effort rehydration from the provider session.
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
      user.value = (data.user as AuthUser | null) ?? null
      setToken(data.session?.access_token ?? null)
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
