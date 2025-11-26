// server/plugins/supabase.ts - ALTERNATIVE APPROACH
import { createClient } from '@supabase/supabase-js'

export default defineNitroPlugin((nitroApp) => {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[Supabase Plugin] Missing credentials')
    return
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })

    // Store in context
    nitroApp.payload.supabase = supabase
  } catch (error) {
    console.error('[Supabase Plugin] Failed to initialize:', error)
  }
})
