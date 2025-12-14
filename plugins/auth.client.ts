// FILE: /plugins/auth.client.ts (COMPLETE FIXED VERSION)
// ============================================================================
// AUTH PLUGIN - FIXED: Proper Supabase integration and error handling
// ============================================================================

export default defineNuxtPlugin(async (nuxtApp) => {
  try {
    const authStore = useAuthStore()
    const { $supabase } = nuxtApp

    console.log('[Auth Plugin] Starting initialization...')

    // ============================================================================
    // STEP 1: Check if Supabase is available
    // ============================================================================
    if (!$supabase) {
      console.warn('[Auth Plugin] ⚠️ Supabase client not available')
      return
    }

    // ============================================================================
    // STEP 2: Get current session from Supabase
    // ============================================================================
    try {
      const { data: { session }, error: sessionError } = await $supabase.auth.getSession()

      if (sessionError) {
        console.error('[Auth Plugin] Error getting session:', sessionError.message)
      }

      // ✅ CRITICAL: If session exists, set user and token in auth store
      if (session?.user) {
        console.log('[Auth Plugin] ✅ Session found, user ID:', session.user.id)
        
        // ✅ Set token first
        authStore.setToken(session.access_token)
        
        // ✅ Set user with proper ID extraction
        authStore.setUser(session.user)
        
        console.log('[Auth Plugin] ✅ User authenticated:', session.user.id)
        console.log('[Auth Plugin] ✅ Token set:', !!session.access_token)
      } else {
        console.log('[Auth Plugin] No session found')
      }
    } catch (error: any) {
      console.error('[Auth Plugin] Error processing session:', error.message)
    }

    // ============================================================================
    // STEP 3: Listen for auth state changes
    // ============================================================================
    try {
      const { data: { subscription } } = $supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('[Auth Plugin] Auth state changed:', event)

          if (event === 'SIGNED_IN' && session?.user) {
            // ✅ User signed in
            console.log('[Auth Plugin] ✅ User signed in:', session.user.id)
            authStore.setToken(session.access_token)
            authStore.setUser(session.user)
          } else if (event === 'SIGNED_OUT') {
            // ✅ User signed out
            console.log('[Auth Plugin] ✅ User signed out')
            authStore.clearAuth()
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            // ✅ Token refreshed
            console.log('[Auth Plugin] ✅ Token refreshed')
            authStore.setToken(session.access_token)
          }
        }
      )

      // Cleanup subscription on app unmount
      if (process.client) {
        nuxtApp.hook('app:unmounted', () => {
          subscription?.unsubscribe()
        })
      }
    } catch (error: any) {
      console.error('[Auth Plugin] Error setting up auth listener:', error.message)
    }

    console.log('[Auth Plugin] ✅ Initialization complete')
  } catch (error: any) {
    console.error('[Auth Plugin] ❌ Fatal error:', error.message)
  }
})
