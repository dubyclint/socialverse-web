// FILE: /server/utils/database.ts - CONSOLIDATED SUPABASE CLIENT (FIXED)
// ============================================================================
// CENTRALIZED SUPABASE DATABASE CLIENT
// This is the ONLY place where Supabase clients should be initialized
// All other files should import from here
// ============================================================================

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================
const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY

// ============================================================================
// VALIDATION
// ============================================================================
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ WARNING: Supabase credentials not fully configured')
  console.warn('  - SUPABASE_URL:', SUPABASE_URL ? '✓ Set' : '✗ Missing')
  console.warn('  - SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing')
}

// ============================================================================
// CLIENT INSTANCES
// ============================================================================

// Standard Supabase client (for client-side operations)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Admin Supabase client (for server-side operations with elevated privileges)
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the standard Supabase client
 * Use this for regular database operations
 */
export const getSupabaseClient = () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase credentials not configured')
  }
  return supabase
}

/**
 * Get the admin Supabase client
 * Use this for server-side operations that require elevated privileges
 */
export const getSupabaseAdminClient = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase admin credentials not configured')
  }
  return supabaseAdmin
}

/**
 * Initialize and test database connection
 * Call this during application startup
 */
export const initializeDatabase = async () => {
  try {
    console.log('[Database] Initializing Supabase connection...')
    
    // Test connection with a simple query
    const { error } = await supabase.from('user').select('id', { head: true, count: 'exact' })
    
    if (error) {
      console.error('[Database] Connection failed:', error.message)
      throw error
    }
    
    console.log('[Database] Successfully connected to Supabase')
    return true
  } catch (error) {
    console.error('[Database] Initialization error:', error)
    throw error
  }
}

// ============================================================================
// EXPORTS
// ============================================================================
export const db = supabase
export default supabase
