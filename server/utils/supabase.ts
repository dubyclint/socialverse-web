// FILE: /server/utils/supabase.ts - FULLY LAZY LOADED
// ============================================================================
// CENTRALIZED SUPABASE CLIENT - LAZY LOADED
// ============================================================================

let supabaseInstance: any = null
let supabaseAdminInstance: any = null

/**
 * Get or create the Supabase client (lazy loading)
 * Use this for client-side operations
 */
export async function getSupabase() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    
    const supabaseUrl = process.env.SUPABASE_URL || ''
    const supabaseKey = process.env.SUPABASE_KEY || ''

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_KEY')
    }

    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true
      }
    })

    console.log('[Supabase] Client initialized')
    return supabaseInstance
  } catch (error) {
    console.error('[Supabase] Failed to initialize client:', error)
    throw error
  }
}

/**
 * Get or create the Supabase admin client (lazy loading)
 * Use this for admin/server-side operations
 */
export async function getSupabaseAdmin() {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    
    const supabaseUrl = process.env.SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')
    }

    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    })

    console.log('[Supabase] Admin client initialized')
    return supabaseAdminInstance
  } catch (error) {
    console.error('[Supabase] Failed to initialize admin client:', error)
    throw error
  }
}
