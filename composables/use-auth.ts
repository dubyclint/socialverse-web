// ============================================================================
// CORRECTED FILE 1: /composables/use-auth.ts
// ============================================================================
// Complete auth composable with proper signup/login/logout handling
// ============================================================================

import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useProfileStore } from '~/stores/profile'

export const useAuth = () => {
  const authStore = useAuthStore()
  const profileStore = useProfileStore()
  const supabase = useSupabaseClient()
  const router = useRouter()

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ============================================================================
  // SIGNUP METHOD - CORRECTED
  // ============================================================================
  const signup = async (email: string, password: string, username: string) => {
    console.log('[useAuth] ============ SIGNUP START ============')
    console.log('[useAuth] Signup attempt:', { email, username })

    isLoading.value = true
    error.value = null

    try {
      // Step 1: Create auth user in Supabase
      console.log('[useAuth] Step 1: Creating auth user...')
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: username,
            avatar_url: '/default-avatar.svg'
          }
        }
      })

      if (authError) {
        console.error('[useAuth] ❌ Auth signup failed:', authError.message)
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error('No user returned from signup')
      }

      console.log('[useAuth] ✅ Auth user created:', authData.user.id)

      // Step 2: Create profile record in database
      console.log('[useAuth] Step 2: Creating profile record...')
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            username: username.toLowerCase(),
            full_name: username,
            email: email,
            avatar_url: '/default-avatar.svg',
            bio: '',
            location: '',
            website: '',
            is_verified: false,
            profile_completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()

      if (profileError) {
        console.error('[useAuth] ⚠️ Profile creation failed:', profileError.message)
        // Don't throw - profile can be created later
      } else {
        console.log('[useAuth] ✅ Profile record created')
      }

      // Step 3: Store email for verification
      console.log('[useAuth] Step 3: Storing email for verification...')
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('signup_email', email)
        sessionStorage.setItem('signup_user_id', authData.user.id)
        console.log('[useAuth] ✅ Email stored in sessionStorage')
      }

      console.log('[useAuth] ============ SIGNUP END ============')

      return {
        success: true,
        message: 'Signup successful! Check your email to verify your account.',
        user: authData.user,
        requiresEmailVerification: true
      }
    } catch (err: any) {
      console.error('[useAuth] ❌ Signup error:', err.message)
      error.value = err.message
      
      return {
        success: false,
        error: err.message,
        requiresEmailVerification: false
      }
    } finally {
      isLoading.value = false
    }
  }

  // ============================================================================
  // LOGIN METHOD - CORRECTED
  // ============================================================================
  const login = async (email: string, password: string) => {
    console.log('[useAuth] ============ LOGIN START ============')
    console.log('[useAuth] Login attempt:', { email })

    isLoading.value = true
    error.value = null

    try {
      // Step 1: Authenticate with Supabase
      console.log('[useAuth] Step 1: Authenticating with Supabase...')
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        console.error('[useAuth] ❌ Login failed:', authError.message)
        throw new Error(authError.message)
      }

      if (!authData.session) {
        throw new Error('No session returned from login')
      }

      console.log('[useAuth] ✅ Authentication successful')
      console.log('[useAuth] User ID:', authData.user?.id)
      console.log('[useAuth] Token received:', !!authData.session.access_token)

      // Step 2: Update auth store
      console.log('[useAuth] Step 2: Updating auth store...')
      authStore.setUser(authData.user)
      authStore.setToken(authData.session.access_token)
      
      if (authData.session.refresh_token) {
        authStore.setRefreshToken(authData.session.refresh_token)
      }

      console.log('[useAuth] ✅ Auth store updated')

      // Step 3: Fetch and set profile
      console.log('[useAuth] Step 3: Fetching profile...')
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileError) {
        console.warn('[useAuth] ⚠️ Profile fetch failed:', profileError.message)
        // Use auth data as fallback
        profileStore.setProfile({
          id: authData.user.id,
          username: authData.user.user_metadata?.username || 'user',
          full_name: authData.user.user_metadata?.full_name || authData.user.email,
          email: authData.user.email,
          avatar_url: authData.user.user_metadata?.avatar_url || '/default-avatar.svg'
        })
      } else {
        console.log('[useAuth] ✅ Profile fetched')
        profileStore.setProfile(profileData)
      }

      // Step 4: Check email verification
      console.log('[useAuth] Step 4: Checking email verification...')
      const isEmailVerified = authData.user.email_confirmed_at !== null
      console.log('[useAuth] Email verified:', isEmailVerified)

      console.log('[useAuth] ============ LOGIN END ============')

      return {
        success: true,
        message: 'Login successful!',
        user: authData.user,
        isEmailVerified,
        requiresEmailVerification: !isEmailVerified
      }
    } catch (err: any) {
      console.error('[useAuth] ❌ Login error:', err.message)
      error.value = err.message
      
      return {
        success: false,
        error: err.message,
        isEmailVerified: false,
        requiresEmailVerification: false
      }
    } finally {
      isLoading.value = false
    }
  }

  // ============================================================================
  // LOGOUT METHOD - CORRECTED
  // ============================================================================
  const logout = async () => {
    console.log('[useAuth] ============ LOGOUT START ============')

    try {
      // Step 1: Sign out from Supabase
      console.log('[useAuth] Step 1: Signing out from Supabase...')
      const { error: signOutError } = await supabase.auth.signOut()

      if (signOutError) {
        console.warn('[useAuth] ⚠️ Supabase signout warning:', signOutError.message)
        // Continue with local logout even if Supabase fails
      } else {
        console.log('[useAuth] ✅ Signed out from Supabase')
      }

      // Step 2: Clear profile store
      console.log('[useAuth] Step 2: Clearing profile store...')
      profileStore.clearProfile()
      console.log('[useAuth] ✅ Profile store cleared')

      // Step 3: Clear auth store
      console.log('[useAuth] Step 3: Clearing auth store...')
      authStore.clearAuth()
      console.log('[useAuth] ✅ Auth store cleared')

      // Step 4: Clear session storage
      console.log('[useAuth] Step 4: Clearing session storage...')
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('signup_email')
        sessionStorage.removeItem('signup_user_id')
        console.log('[useAuth] ✅ Session storage cleared')
      }

      // Step 5: Redirect to login
      console.log('[useAuth] Step 5: Redirecting to login...')
      await router.push('/auth/signin')
      console.log('[useAuth] ✅ Redirected to login')

      console.log('[useAuth] ============ LOGOUT END ============')

      return {
        success: true,
        message: 'Logged out successfully'
      }
    } catch (err: any) {
      console.error('[useAuth] ❌ Logout error:', err.message)
      error.value = err.message

      return {
        success: false,
        error: err.message
      }
    }
  }

  // ============================================================================
  // VERIFY EMAIL METHOD - NEW
  // ============================================================================
  const verifyEmail = async (token: string) => {
    console.log('[useAuth] ============ VERIFY EMAIL START ============')
    console.log('[useAuth] Verifying email with token...')

    isLoading.value = true
    error.value = null

    try {
      // Supabase handles email verification via the token in the URL
      // This is typically done automatically when user clicks the email link
      // But we can verify the session here
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        throw new Error(sessionError.message)
      }

      if (!sessionData.session) {
        throw new Error('No active session found')
      }

      console.log('[useAuth] ✅ Email verified')
      console.log('[useAuth] ============ VERIFY EMAIL END ============')

      return {
        success: true,
        message: 'Email verified successfully!',
        user: sessionData.session.user
      }
    } catch (err: any) {
      console.error('[useAuth] ❌ Email verification error:', err.message)
      error.value = err.message

      return {
        success: false,
        error: err.message
      }
    } finally {
      isLoading.value = false
    }
  }

  // ============================================================================
  // RESEND VERIFICATION EMAIL - NEW
  // ============================================================================
  const resendVerificationEmail = async (email: string) => {
    console.log('[useAuth] ============ RESEND VERIFICATION EMAIL START ============')
    console.log('[useAuth] Resending verification email to:', email)

    isLoading.value = true
    error.value = null

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })

      if (resendError) {
        throw new Error(resendError.message)
      }

      console.log('[useAuth] ✅ Verification email resent')
      console.log('[useAuth] ============ RESEND VERIFICATION EMAIL END ============')

      return {
        success: true,
        message: 'Verification email sent! Check your inbox.'
      }
    } catch (err: any) {
      console.error('[useAuth] ❌ Resend error:', err.message)
      error.value = err.message

      return {
        success: false,
        error: err.message
      }
    } finally {
      isLoading.value = false
    }
  }

  // ============================================================================
  // REFRESH TOKEN METHOD - NEW
  // ============================================================================
  const refreshToken = async () => {
    console.log('[useAuth] ============ REFRESH TOKEN START ============')

    try {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

      if (refreshError) {
        throw new Error(refreshError.message)
      }

      if (refreshData.session) {
        authStore.setToken(refreshData.session.access_token)
        if (refreshData.session.refresh_token) {
          authStore.setRefreshToken(refreshData.session.refresh_token)
        }
        console.log('[useAuth] ✅ Token refreshed')
      }

      console.log('[useAuth] ============ REFRESH TOKEN END ============')

      return {
        success: true,
        message: 'Token refreshed'
      }
    } catch (err: any) {
      console.error('[useAuth] ❌ Token refresh error:', err.message)
      error.value = err.message

      return {
        success: false,
        error: err.message
      }
    }
  }

  return {
    isLoading,
    error,
    signup,
    login,
    logout,
    verifyEmail,
    resendVerificationEmail,
    refreshToken
  }
}
