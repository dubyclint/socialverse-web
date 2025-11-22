// FILE: /server/plugins/supabase.ts
// ✅ Server-side Supabase initialization

import { createClient } from '@supabase/supabase-js'
import type { NitroApp } from 'nitropack'

export default defineNitroPlugin((nitroApp: NitroApp) => {
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const supabaseKey = process.env.SUPABASE_KEY || ''

  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase credentials not configured on server')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Make available globally for API routes
  (globalThis as any).supabase = supabase
  
  console.log('✅ Server-side Supabase initialized')
})
