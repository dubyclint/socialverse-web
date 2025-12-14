// FILE: /plugins/supabase-client.ts (COMPLETE FIXED VERSION)
// ============================================================================
// SUPABASE CLIENT PLUGIN - FIXED: Proper initialization and error handling
// ============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js'

export default defineNuxtPlugin(async (nuxtApp) => {
  try {
    // ✅ CRITICAL: Only initialize on client-side
    if (!process.client) {
      console.log('[Supabase Plugin] Running on server - skipping initialization')
      return {
        provide: {
          supabase: null,
          supabaseReady: false,
          supabaseError: new Error('Supabase not available on server'),
        },
      }
    }

    const config = useRuntimeConfig()
    
    const supabaseUrl = config.public.supabaseUrl
    const supabaseKey = config.public.supabaseKey

    // Graceful degradation if credentials missing
    if (!supabaseUrl || !supabaseKey) {
      console.warn('[Supabase Plugin] ⚠️ Missing SUPABASE_URL or SUPABASE_KEY - Running in degraded mode')
      
      return {
        provide: {
          supabase: null,
          supabaseReady: false,
          supabaseError: new Error('Missing Supabase credentials'),
        },
      }
    }

    // Validate URL format
    if (!supabaseUrl.includes('supabase.co')) {
      const error = new Error('Invalid Supabase URL format')
      console.error('[Supabase Plugin]', error.message)
      
      return {
        provide: {
          supabase: null,
          supabaseReady: false,
          supabaseError: error,
        },
      }
    }

    // ✅ CRITICAL FIX: Disable detectSessionInUrl to prevent history.state error
    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        detectSessionInUrl: false,
        persistSession: true,
        autoRefreshToken: true,
        flowType: 'pkce'
      }
    })

    console.log('[Supabase Plugin] ✅ Supabase client initialized successfully')

    return {
      provide: {
        supabase,
        supabaseReady: true,
        supabaseError: null,
      },
    }
  } catch (error: any) {
    console.error('[Supabase Plugin] ❌ Fatal error during initialization:', error.message)
    
    return {
      provide: {
        supabase: null,
        supabaseReady: false,
        supabaseError: error,
      },
    }
  }
})
