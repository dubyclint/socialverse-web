// FILE: /plugins/supabase.client.ts
// ONLY Supabase plugin - No conflicts

import { createClient } from '@supabase/supabase-js'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  
  let supabaseClient: any = null

  try {
    const supabaseUrl = config.public.supabaseUrl
    const supabaseKey = config.public.supabaseKey

    if (supabaseUrl && supabaseKey) {
      supabaseClient = createClient(supabaseUrl, supabaseKey)
      console.log('[Supabase] Client initialized successfully')
    } else {
      console.warn('[Supabase] Missing credentials, Supabase disabled')
    }
  } catch (error) {
    console.error('[Supabase] Initialization error:', error)
  }

  return {
    provide: {
      supabase: supabaseClient,
    }
  }
})
