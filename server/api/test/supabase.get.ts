// FILE: /server/api/test/supabase.get.ts
// ============================================================================
// Test endpoint to verify Supabase configuration
// ============================================================================

export default defineEventHandler(async (event) => {
  try {
    console.log('[Test/Supabase] Testing Supabase connection...')

    // Check environment variables
    const config = {
      supabaseUrl: process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!(process.env.SUPABASE_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY),
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      anonKeyLength: (process.env.SUPABASE_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY || '').length,
      serviceKeyLength: (process.env.SUPABASE_SERVICE_ROLE_KEY || '').length
    }

    console.log('[Test/Supabase] Config:', config)

    // Try to create a client
    const supabase = await serverSupabaseClient(event)
    
    // Test a simple query
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (error) {
      console.error('[Test/Supabase] Query error:', error)
      return {
        success: false,
        config,
        error: error.message
      }
    }

    console.log('[Test/Supabase] ✅ Connection successful')

    return {
      success: true,
      config,
      message: 'Supabase connection successful'
    }

  } catch (error: any) {
    console.error('[Test/Supabase] ❌ Error:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
})
