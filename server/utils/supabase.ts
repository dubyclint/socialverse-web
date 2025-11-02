// FILE: /server/utils/supabase.ts
// ============================================================================
// Supabase Server Client Initialization
// ============================================================================

import { createClient } from '@supabase/supabase-js'

export const getSupabaseClient = () => {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_KEY

  if (!url || !key) {
    console.error('[Supabase] Missing credentials:', {
      hasUrl: !!url,
      hasKey: !!key
    })
    throw new Error('Missing Supabase credentials in environment variables')
  }

  console.log('[Supabase] Client initialized successfully')
  return createClient(url, key)
}

export const getSupabaseAdminClient = () => {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase admin credentials')
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
