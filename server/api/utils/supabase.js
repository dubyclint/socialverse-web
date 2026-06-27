// FILE: /server/api/utils/supabase.js
// ============================================================================
// API UTILITIES - SUPABASE CLIENT - LAZY LOADED
// ============================================================================

let supabaseInstance = null

/**
 * Get or create Supabase client (lazy loading)
 */
async function getSupabase() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }

    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true
      }
    })

    return supabaseInstance
  } catch (error) {
    console.error('[API Supabase] Initialization failed:', error)
    throw error
  }
}

export { getSupabase }
