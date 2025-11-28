// FILE: /plugins/supabase-client.ts
// ✅ FIXED - CLIENT-SIDE SUPABASE INITIALIZATION WITH ERROR HANDLING
// Addresses: Issue #2 (Timing), Issue #3 (Pinia initialization)

import { createClient, SupabaseClient } from '@supabase/supabase-js'

export default defineNuxtPlugin(async (nuxtApp) => {
  try {
    const config = useRuntimeConfig()
    
    const supabaseUrl = config.public.supabaseUrl
    const supabaseKey = config.public.supabaseKey

    // Graceful degradation if credentials missing
    if (!supabaseUrl || !supabaseKey) {
      console.warn('[Supabase Plugin] ⚠️ Missing SUPABASE_URL or SUPABASE_KEY - Running in degraded mode')
      
      // Provide null client to prevent undefined errors
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

    // Create Supabase client for client-side use
    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          'X-Client-Info': 'socialverse-web',
        },
      },
    })

    console.log('[Supabase Plugin] ✅ Supabase client initialized successfully')

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
    console.error('[Supabase Plugin] Failed to initialize:', err.message)
    
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
