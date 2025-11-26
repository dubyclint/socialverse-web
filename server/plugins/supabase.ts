// server/plugins/supabase.ts - SERVER-SIDE SUPABASE PLUGIN
import { createClient } from '@supabase/supabase-js'

export default defineNitroPlugin((nitroApp) => {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[Supabase Plugin] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')
    return
  }

  // Create admin Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })

  // Make it available globally in Nitro context
  nitroApp.payload.supabase = supabase
})
