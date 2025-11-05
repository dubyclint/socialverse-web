// FILE: /plugins/supabase-init.client.ts
// Initialize Supabase client safely without relying on auto-imports

import { createClient } from '@supabase/supabase-js'

let supabaseClient: any = null

export default defineNuxtPlugin(() => {
  try {
    const config = useRuntimeConfig()
    
    // Get Supabase credentials from runtime config
    const supabaseUrl = config.public.supabaseUrl
    const supabaseKey = config.public.supabaseKey

    if (!supabaseUrl || !supabaseKey) {
      console.warn('[Supabase] Missing credentials, Supabase disabled')
      return {
        provide: {
          supabase: null,
          useSupabaseClient: () => null,
          useSupabaseUser: () => ({ value: null }),
        }
      }
    }

    // Create Supabase client
    supabaseClient = createClient(supabaseUrl, supabaseKey)

    console.log('[Supabase] Client initialized successfully')

    return {
      provide: {
        supabase: supabaseClient,
        useSupabaseClient: () => supabaseClient,
        useSupabaseUser: () => ({ value: null }),
      }
    }
  } catch (error) {
    console.error('[Supabase] Initialization failed:', error)
    return {
      provide: {
        supabase: null,
        useSupabaseClient: () => null,
        useSupabaseUser: () => ({ value: null }),
      }
    }
  }
})
