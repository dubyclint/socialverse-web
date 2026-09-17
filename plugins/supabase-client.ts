// ============================================================================
// FILE: /plugins/supabase-client.ts - COMPLETE FIXED VERSION
// ============================================================================
// ✅ FIXED: Added proper plugin structure with dependsOn
// ✅ FIXED: Proper Supabase client initialization and validation
// ✅ FIXED: Added error handling and recovery
// ✅ FIXED: Provides utilities to app
// ✅ FIXED: Added logging for debugging
// ============================================================================

export default defineNuxtPlugin({
  name: 'socialverse-supabase-client',
  
  // ✅ FIX: Ensure Pinia is loaded before Supabase initialization
  dependsOn: ['pinia'],

  setup(nuxtApp: any) {
    if (!process.client) return

    console.log('[Supabase Plugin] Initializing Supabase client...')

    try {
      // ============================================================================
      // VALIDATE SUPABASE CLIENT
      // ============================================================================
      const supabaseClient = nuxtApp.$supabase?.client
      
      if (!supabaseClient) {
        console.error('[Supabase Plugin] ❌ Supabase client not found in nuxtApp')
        console.error('[Supabase Plugin] ❌ Make sure @nuxtjs/supabase module is installed and configured')
        
        // ✅ FIX: Provide fallback utilities
        return {
          provide: {
            supabaseClient: null,
            supabaseAuth: null,
            supabaseDb: null,
          }
        }
      }
      
      console.log('[Supabase Plugin] ✅ Supabase client is ready and validated')

      // ============================================================================
      // EXTRACT SUPABASE UTILITIES
      // ============================================================================
      const supabaseAuth = supabaseClient.auth
      const supabaseDb = supabaseClient

      if (!supabaseAuth) {
        console.warn('[Supabase Plugin] ⚠️ Supabase auth module not available')
      } else {
        console.log('[Supabase Plugin] ✅ Supabase auth module loaded')
      }

      // ============================================================================
      // SETUP AUTH STATE LISTENER
      // ============================================================================
      if (supabaseAuth && typeof supabaseAuth.onAuthStateChange === 'function') {
        try {
          const { data: { subscription } } = supabaseAuth.onAuthStateChange((event: string, session: any) => {
            console.log('[Supabase Plugin] Auth state changed:', event)
            
            // Emit custom event for other plugins to listen to
            window.dispatchEvent(new CustomEvent('supabase-auth-change', { 
              detail: { event, session } 
            }))
          })

          // ✅ FIX: Cleanup subscription on app unmount
          nuxtApp.hook('app:beforeUnmount', () => {
            if (subscription) {
              subscription.unsubscribe()
              console.log('[Supabase Plugin] Auth state listener unsubscribed')
            }
          })

          console.log('[Supabase Plugin] ✅ Auth state listener attached')
        } catch (error) {
          console.warn('[Supabase Plugin] ⚠️ Failed to attach auth state listener:', error)
        }
      }

      // ============================================================================
      // PROVIDE SUPABASE UTILITIES
      // ============================================================================
      return {
        provide: {
          supabaseClient,
          supabaseAuth,
          supabaseDb,
        }
      }

    } catch (error) {
      console.error('[Supabase Plugin] ❌ Initialization failed:', error)
      
      // ✅ FIX: Provide fallback utilities to prevent app crash
      return {
        provide: {
          supabaseClient: null,
          supabaseAuth: null,
          supabaseDb: null,
        }
      }
    }
  }
})
