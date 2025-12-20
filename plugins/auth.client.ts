// FILE: /plugins/auth.client.ts - FIXED VERSION
// ============================================================================
// AUTH PLUGIN - FIXED: Proper plugin dependency and error handling
// ✅ FIXED: Added dependency on supabase-client plugin
// ✅ FIXED: Better error handling and null checks
// ============================================================================

export default defineNuxtPlugin({
  name: 'auth-plugin',
  dependsOn: ['supabase-client'], // ✅ Wait for Supabase to initialize first
  
  async setup(nuxtApp) {
    // ============================================================================
    // ONLY RUN ON CLIENT-SIDE
    // ============================================================================
    if (!process.client) {
      console.log('[Auth Plugin] Running on server - skipping')
      return
    }

    console.log('[Auth Plugin] Starting initialization...')

    try {
      // ============================================================================
      // GET REQUIRED DEPENDENCIES
      // ============================================================================
      const authStore = useAuthStore()
      const { $supabase, $supabaseReady } = nuxtApp

      // ============================================================================
      // CHECK SUPABASE AVAILABILITY
      // ============================================================================
      if (!$supabase || !$supabaseReady) {
        console.warn('[Auth Plugin] ⚠️ Supabase client not available - skipping auth initialization')
        return
      }

      console.log('[Auth Plugin] ✅ Supabase client available')

      // ============================================================================
      // GET CURRENT SESSION
      // ============================================================================
      const { data: { session }, error } = await $supabase.auth.getSession()

      if (error) {
        console.error('[Auth Plugin] ❌ Session error:', error.message)
        return
      }

      // ============================================================================
      // RESTORE SESSION IF EXISTS
      // ============================================================================
      if (session?.user) {
        console.log('[Auth Plugin] ✅ User session found:', session.user.id)
        
        // Set user in auth store
        authStore.setUser(session.user)
        
        // Set token if available
        if (session.access_token) {
          authStore.setToken(session.access_token)
        }
        
        console.log('[Auth Plugin] ✅ Session restored successfully')
      } else {
        console.log('[Auth Plugin] No active session found')
      }

      // ============================================================================
      // LISTEN FOR AUTH STATE CHANGES
      // ============================================================================
      $supabase.auth.onAuthStateChange((event, session) => {
        console.log('[Auth Plugin] Auth state changed:', event)
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('[Auth Plugin] User signed in:', session.user.id)
          authStore.setUser(session.user)
          if (session.access_token) {
            authStore.setToken(session.access_token)
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[Auth Plugin] User signed out')
          authStore.clearAuth()
        } else if (event === 'TOKEN_REFRESHED' && session?.access_token) {
          console.log('[Auth Plugin] Token refreshed')
          authStore.setToken(session.access_token)
        }
      })

      console.log('[Auth Plugin] ✅ Initialization complete')

    } catch (err: any) {
      console.error('[Auth Plugin] ❌ Initialization error:', err.message)
      // Don't throw - allow app to continue without auth
    }
  }
})

