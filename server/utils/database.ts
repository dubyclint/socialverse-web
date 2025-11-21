// FILE: /server/utils/database.ts - FIXED WITH LAZY LOADING
// ============================================================================
// CENTRALIZED SUPABASE DATABASE CLIENT
// Uses lazy loading to prevent Nitro bundling issues
// Maintains backward compatibility - no changes needed in other files
// ============================================================================

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================
const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY

// ============================================================================
// VALIDATION
// ============================================================================
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ WARNING: Supabase credentials not fully configured')
  console.warn('  - SUPABASE_URL:', SUPABASE_URL ? '✓ Set' : '✗ Missing')
  console.warn('  - SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing')
}

// ============================================================================
// LAZY CLIENT INSTANCES - ONLY CREATED ON FIRST USE
// ============================================================================

let supabaseInstance: any = null
let supabaseAdminInstance: any = null

/**
 * Get or create the Supabase client (lazy loading)
 * This prevents bundling issues by deferring the import until needed
 */
export async function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  try {
    // Dynamic import to avoid bundling issues
    const { createClient } = await import('@supabase/supabase-js')
    
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
      },
    })
    
    return supabaseInstance
  } catch (error) {
    console.error('[Database] Failed to load Supabase client:', error)
    throw new Error('Supabase client initialization failed')
  }
}

/**
 * Get or create the Supabase admin client (service role)
 * This prevents bundling issues by deferring the import until needed
 */
export async function getSupabaseAdminClient() {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance
  }

  try {
    // Dynamic import to avoid bundling issues
    const { createClient } = await import('@supabase/supabase-js')
    
    supabaseAdminInstance = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    
    return supabaseAdminInstance
  } catch (error) {
    console.error('[Database] Failed to load Supabase admin client:', error)
    throw new Error('Supabase admin client initialization failed')
  }
}

/**
 * Convenience wrapper for getting the client
 * Use this in your API routes
 */
export async function db() {
  return getSupabaseClient()
}

/**
 * Convenience wrapper for getting the admin client
 * Use this in your API routes that need admin access
 */
export async function dbAdmin() {
  return getSupabaseAdminClient()
}

