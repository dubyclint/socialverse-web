// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Profile } from '~/types/profile'
import { authService } from '~/services/authService'
import { profileService } from '~/services/profileService'

export const useUserStore = defineStore('user', () => {
  const user = ref<any>(null)
  const profile = ref<Profile | null>(null)
  const isLoading = ref(false)
  const error = ref(null) // Added
  const rememberMe = ref(false) // Added

  // ✅ Added: consumed by use-api.ts, use-chat.ts, plugins/socket.client.ts,
  // plugins/fetch-interceptor.ts, services/api.ts, middleware/* guards
  const token = ref<string | null>(null)
  const posts = ref<any[]>([])
  const notifications = ref<any[]>([])

  const userId = computed<string | null>(() => user.value?.id || profile.value?.user_id || null)
  const isAuthenticated = computed<boolean>(() => !!user.value)

  const setError = (val: any) => { error.value = val }
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

      user.value = data.user
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
      const session = (data as any)?.session
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

  return {
    user,
    profile,
    isLoading,
    error,
    rememberMe,
    token,
    posts,
    notifications,
    userId,
    isAuthenticated,
    setError,
    setRememberMe,
    setToken,
    signIn,
    fetchProfile,
    refreshProfile,
    logout,
    initializeSession,
    isTokenExpired,
    refreshToken
  }
})
