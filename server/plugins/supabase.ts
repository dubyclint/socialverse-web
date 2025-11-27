// server/plugins/supabase.ts - LAZY LOADED INITIALIZATION
// ============================================================================
// Supabase plugin with lazy loading to prevent bundling
// ============================================================================

export default defineNitroPlugin((nitroApp) => {
  console.log('[Supabase Plugin] Initializing lazy-load handler...')

  // Create a lazy-load function that will be called on first use
  const getSupabaseClient = async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      
      const supabaseUrl = process.env.SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

      if (!supabaseUrl || !supabaseServiceKey) {
        console.warn('[Supabase Plugin] Missing credentials')
        return null
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      })

      console.log('[Supabase Plugin] Client initialized successfully')
      return supabase
    } catch (error) {
      console.error('[Supabase Plugin] Failed to initialize:', error)
      return null
    }
  }

  // Store the lazy-load function in context
  // It will be called when needed, not at startup
  nitroApp.payload.getSupabaseClient = getSupabaseClient
})
