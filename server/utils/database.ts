// FILE: /server/utils/database.ts - FIXED WITH CONDITIONAL LOADING
// ============================================================================
// CENTRALIZED SUPABASE DATABASE CLIENT
// Uses conditional loading to prevent Nitro bundling issues
// Maintains backward compatibility - no changes needed in other files
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
// LAZY CLIENT INSTANCES - ONLY CREATED ON FIRST USE
// ============================================================================

let supabaseInstance: any = null
let supabaseAdminInstance: any = null
let createClientFn: any = null

/**
 * Safely load the createClient function
 * This prevents bundling issues by deferring the import
 */
function getCreateClientFn() {
  if (createClientFn) {
    return createClientFn
  }
  
  try {
    // Use require instead of import to avoid bundling issues
    const supabaseModule = require('@supabase/supabase-js')
    createClientFn = supabaseModule.createClient
    return createClientFn
  } catch (error) {
    console.error('[Database] Failed to load Supabase createClient:', error)
    throw new Error('Failed to initialize Supabase client. Make sure @supabase/supabase-js is installed.')
  }
}

/**
 * Get or create the standard Supabase client
 * Lazy-loaded on first access
 */
function getSupabaseInstance() {
  if (supabaseInstance) {
    return supabaseInstance
  }
  
  try {
    const createClient = getCreateClientFn()
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    return supabaseInstance
  } catch (error) {
    console.error('[Database] Failed to create Supabase client:', error)
    throw error
  }
}

/**
 * Get or create the admin Supabase client
 * Lazy-loaded on first access
 */
function getSupabaseAdminInstance() {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance
  }
  
  try {
    const createClient = getCreateClientFn()
    supabaseAdminInstance = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
    return supabaseAdminInstance
  } catch (error) {
    console.error('[Database] Failed to create Supabase admin client:', error)
    throw error
  }
}

// ============================================================================
// EXPORTED CLIENT INSTANCES
// ============================================================================
// These use getters to lazily initialize on first access

export const supabase = new Proxy({}, {
  get(target, prop) {
    const instance = getSupabaseInstance()
    return (instance as any)[prop]
  },
})

export const supabaseAdmin = new Proxy({}, {
  get(target, prop) {
    const instance = getSupabaseAdminInstance()
    return (instance as any)[prop]
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
  return getSupabaseInstance()
}

/**
 * Get the admin Supabase client
 * Use this for server-side operations that require elevated privileges
 */
export const getSupabaseAdminClient = () => {
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
    
    const client = getSupabaseInstance()
    
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
// EXPORTS
// ============================================================================
export const db = supabase
export default supabase
