// FILE: /plugins/auth.client.ts (FIXED - COMPLETE VERSION)
// ============================================================================
// AUTH PLUGIN - FIXED: Proper session initialization from Supabase
// ============================================================================
// ✅ CRITICAL FIX: Now properly initializes user session from Supabase
// ✅ Extracts user ID and token from Supabase session
// ✅ Sets user in auth store with proper ID extraction
// ✅ Handles auth state changes and session restoration
// ============================================================================

export default defineNuxtPlugin(async (nuxtApp) => {
  try {
    const authStore = useAuthStore()
    const { $supabase } = nuxtApp

    console.log('[Auth Plugin] Starting initialization...')

    // ============================================================================
    // STEP 1: Get current session from Supabase
    // ============================================================================
    if ($supabase) {
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
    } else {
      console.warn('[Auth Plugin] Supabase client not available')
    }

    // ============================================================================
    // STEP 2: Listen for auth state changes
    // ============================================================================
    if ($supabase) {
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
            } else if (event === 'USER_UPDATED' && session?.user) {
              // ✅ User data updated
              console.log('[Auth Plugin] ✅ User updated:', session.user.id)
              authStore.setUser(session.user)
            }
          }
        )

        // ✅ Store subscription for cleanup
        if (process.client) {
          window.__authSubscription = subscription
        }
      } catch (error: any) {
        console.error('[Auth Plugin] Error setting up auth listener:', error.message)
      }
    }

    // ============================================================================
    // STEP 3: Initialize session from stored data
    // ============================================================================
    try {
      const sessionInitialized = await authStore.initializeSession()
      if (sessionInitialized) {
        console.log('[Auth Plugin] ✅ Session initialized from storage')
      }
    } catch (error: any) {
      console.error('[Auth Plugin] Error initializing session:', error.message)
    }

    // ============================================================================
    // STEP 4: Log final auth state
    // ============================================================================
    console.log('[Auth Plugin] ✅ Plugin initialization complete')
    console.log('[Auth Plugin] Auth state:', {
      isAuthenticated: authStore.isAuthenticated,
      hasToken: !!authStore.token,
      hasUser: !!authStore.user,
      userId: authStore.userId,
      userEmail: authStore.user?.email
    })

    return {
      provide: {
        authStore
      }
    }
  } catch (error: any) {
    console.error('[Auth Plugin] ❌ Failed to initialize:', error.message)
    console.error('[Auth Plugin] Error details:', error)
    
    // Return empty provide to prevent app crash
    return {
      provide: {}
    }
  }
})

// ============================================================================
// CLEANUP: Unsubscribe from auth listener on app unmount
// ============================================================================
declare global {
  interface Window {
    __authSubscription?: any
  }
}

if (process.client) {
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      if (window.__authSubscription) {
        window.__authSubscription.unsubscribe()
      }
    })
  }
}
