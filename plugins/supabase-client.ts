// plugins/supabase-client.ts - CLIENT-SIDE SUPABASE INITIALIZATION
import { createClient } from '@supabase/supabase-js'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  
  const supabaseUrl = config.public.supabaseUrl
  const supabaseKey = config.public.supabaseKey

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[Supabase Plugin] Missing SUPABASE_URL or SUPABASE_KEY')
    return
  }

  // Create Supabase client for client-side use
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  // Provide to app
  return {
    provide: {
      supabase,
    },
  }
})
