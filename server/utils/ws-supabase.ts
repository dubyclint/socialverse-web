// FILE: /server/utils/ws-supabase.ts
// ============================================================================
// WEBSOCKET SUPABASE CLIENT - LAZY LOADED
// ============================================================================
// This helper provides lazy-loaded Supabase clients for WebSocket handlers
// Prevents bundling issues by deferring import until first use
// ============================================================================

let supabaseAdminInstance: any = null

/**
 * Get or create the Supabase admin client (lazy loaded)
 * Used by all WebSocket handlers
 */
export async function getWSSupabaseClient() {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })

    console.log('[WS Supabase] Client initialized')
    return supabaseAdminInstance
  } catch (error) {
    console.error('[WS Supabase] Failed to initialize client:', error)
    throw error
  }
}
