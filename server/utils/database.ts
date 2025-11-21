// FILE: /server/utils/database.ts - FIXED WITH LAZY IMPORTS
// ============================================================================
// CENTRALIZED SUPABASE DATABASE CLIENT WITH LAZY LOADING
// This is the ONLY place where Supabase clients should be initialized
// All other files should import from here
// Uses lazy imports to prevent bundling issues with Nitro
// ============================================================================

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
// LAZY-LOADED CLIENT INSTANCES
// ============================================================================
// These are initialized lazily to prevent bundling issues with Nitro

let supabaseInstance: any = null
let supabaseAdminInstance: any = null

/**
 * Lazy load and cache the Supabase client
 * Only imports @supabase/supabase-js when actually needed
 */
async function getSupabaseInstance() {
  if (supabaseInstance) {
    return supabaseInstance
  }
  
  try {
    const { createClient } = await import('@supabase/supabase-js')
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    return supabaseInstance
  } catch (error) {
    console.error('[Database] Failed to load Supabase client:', error)
    throw error
  }
}

/**
 * Lazy load and cache the Supabase admin client
 * Only imports @supabase/supabase-js when actually needed
 */
async function getSupabaseAdminInstance() {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance
  }
  
  try {
    const { createClient } = await import('@supabase/supabase-js')
    supabaseAdminInstance = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
    return supabaseAdminInstance
  } catch (error) {
    console.error('[Database] Failed to load Supabase admin client:', error)
    throw error
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the standard Supabase client
 * Use this for regular database operations
 */
export const getSupabaseClient = async () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase credentials not configured')
  }
  return getSupabaseInstance()
}

/**
 * Get the admin Supabase client
 * Use this for server-side operations that require elevated privileges
 */
export const getSupabaseAdminClient = async () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase admin credentials not configured')
  }
  return getSupabaseAdminInstance()
}

/**
 * Initialize and test database connection
 * Call this during application startup
 */
export const initializeDatabase = async () => {
  try {
    console.log('[Database] Initializing Supabase connection...')
    
    const client = await getSupabaseInstance()
    
    // Test connection with a simple query
    const { error } = await client.from('user').select('id', { head: true, count: 'exact' })
    
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
// EXPORTS - For backward compatibility
// ============================================================================
// These are lazy-loaded proxies
export const supabase = {
  async from(table: string) {
    const client = await getSupabaseInstance()
    return client.from(table)
  },
  async auth() {
    const client = await getSupabaseInstance()
    return client.auth
  },
  async storage() {
    const client = await getSupabaseInstance()
    return client.storage
  },
  async rpc(fn: string, params?: any) {
    const client = await getSupabaseInstance()
    return client.rpc(fn, params)
  },
}

export const supabaseAdmin = {
  async from(table: string) {
    const client = await getSupabaseAdminInstance()
    return client.from(table)
  },
  async auth() {
    const client = await getSupabaseAdminInstance()
    return client.auth
  },
  async storage() {
    const client = await getSupabaseAdminInstance()
    return client.storage
  },
  async rpc(fn: string, params?: any) {
    const client = await getSupabaseAdminInstance()
    return client.rpc(fn, params)
  },
}

export const db = supabase
export default supabase
