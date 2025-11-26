// FILE: /server/utils/supabase.ts
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

    return supabaseAdminInstance
  } catch (error) {
    console.error('[Supabase] Failed to initialize admin client:', error)
    throw error
  }
}

/**
 * Backward compatibility - export as supabase object
 * This allows existing code to work without changes
 */
export const supabase = new Proxy({}, {
  get: (target, prop) => {
    return async (...args: any[]) => {
      const client = await getSupabase()
      return (client as any)[prop]?.(...args)
    }
  }
}) as any

/**
 * Backward compatibility - export as supabaseAdmin object
 */
export const supabaseAdmin = new Proxy({}, {
  get: (target, prop) => {
    return async (...args: any[]) => {
      const client = await getSupabaseAdmin()
      return (client as any)[prop]?.(...args)
    }
  }
}) as any
