// FILE: /plugins/supabase-client.ts (FIXED FOR SSR)
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export default defineNuxtPlugin(async (nuxtApp) => {
  try {
    const config = useRuntimeConfig()
    
    const supabaseUrl = config.public.supabaseUrl
    const supabaseKey = config.public.supabaseKey

    if (!supabaseUrl || !supabaseKey) {
      console.warn('[Supabase Plugin] Missing Supabase credentials')
      return {
        provide: {
          supabase: null,
          supabaseReady: false,
        },
      }
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: process.client,
        autoRefreshToken: process.client,
        detectSessionInUrl: process.client,
      },
    })

    console.log('[Supabase Plugin] ✅ Initialized')

    return {
      provide: {
        supabase,
        supabaseReady: true,
      },
    }
  } catch (error) {
    console.error('[Supabase Plugin] ❌ Error:', error)
    return {
      provide: {
        supabase: null,
        supabaseReady: false,
      },
    }
  }
})


