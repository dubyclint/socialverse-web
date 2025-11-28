// ============================================================================
// FILE: /plugins/supabase-client.ts
// ============================================================================
// ✅ FIXED - CLIENT-SIDE SUPABASE INITIALIZATION
// Root Cause Fix: Disable detectSessionInUrl to prevent history.state error
// This error occurs because Supabase tries to manipulate window.history during SSR

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
    // This option causes Supabase to try to manipulate window.history which fails during SSR
    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,  // ✅ FIXED: Changed from true to false
        flowType: 'pkce',           // ✅ ADDED: Use PKCE flow for better security
      },
      global: {
        headers: {
          'X-Client-Info': 'socialverse-web',
        },
      },
    })

    console.log('[Supabase Plugin] ✅ Supabase client initialized successfully (client-side only)')

    // ✅ ADDED: Handle auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Supabase Plugin] Auth state changed:', event)
      
      if (event === 'SIGNED_IN') {
        console.log('[Supabase Plugin] User signed in')
      } else if (event === 'SIGNED_OUT') {
        console.log('[Supabase Plugin] User signed out')
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('[Supabase Plugin] Token refreshed')
      }
    })

    // Provide to app with error handling
    return {
      provide: {
        supabase,
        supabaseReady: true,
        supabaseError: null,
      },
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[Supabase Plugin] ❌ Failed to initialize:', err.message)
    console.error('[Supabase Plugin] Error Stack:', err.stack)
    
    // Provide error state to prevent crashes
    return {
      provide: {
        supabase: null,
        supabaseReady: false,
        supabaseError: err,
      },
    }
  }
})
