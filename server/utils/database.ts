// FILE: /server/utils/database.ts
// ============================================================================
// INTERNAL SUPABASE CLIENT - DO NOT IMPORT AT TOP LEVEL
// This file is ONLY for internal use within plugins
// ============================================================================

let supabaseInstance: any = null
let supabaseAdminInstance: any = null

/**
 * Get or create the Supabase client (lazy loading)
 * INTERNAL USE ONLY - Called from plugins, not from API routes
 */
export async function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    
    const supabaseUrl = process.env.SUPABASE_URL || ''
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || ''

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_KEY')
    }

    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
      },
    })
    
    console.log('[Database] Supabase client initialized')
    return supabaseInstance
  } catch (error) {
    console.error('[Database] Failed to load Supabase client:', error)
    throw error
  }
}

/**
 * Get or create the Supabase admin client (lazy loading)
 * INTERNAL USE ONLY - Called from plugins, not from API routes
 */
export async function getSupabaseAdminClient() {
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
      },
    })
    
    console.log('[Database] Supabase admin client initialized')
    return supabaseAdminInstance
  } catch (error) {
    console.error('[Database] Failed to load Supabase admin client:', error)
    throw error
  }
}

// ============================================================================
// DO NOT EXPORT ANYTHING ELSE - NO PROXY, NO DIRECT EXPORTS
// ============================================================================
