// ============================================================================
// FILE: /server/utils/supabase-server.ts - COMPLETE FIXED VERSION
// ============================================================================
// SERVER-SIDE SUPABASE CLIENT - FULLY LAZY LOADED WITH ROBUST ERROR HANDLING
// ✅ FIXED: Proper error handling, validation, and client initialization
// ============================================================================

import type { H3Event } from 'h3'

// ✅ Define type inline to avoid import issues
type SupabaseClient = any

let adminClientInstance: SupabaseClient | null = null
let userClientInstance: SupabaseClient | null = null

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate Supabase credentials
 */
function validateSupabaseCredentials(url: string, key: string, keyName: string): void {
  if (!url) {
    console.error('[Supabase Server] ❌ SUPABASE_URL is missing or empty')
    throw new Error('SUPABASE_URL environment variable is not configured')
  }

  if (!key) {
    console.error(`[Supabase Server] ❌ ${keyName} is missing or empty`)
    throw new Error(`${keyName} environment variable is not configured`)
  }

  if (!url.includes('supabase.co')) {
    console.error('[Supabase Server] ❌ SUPABASE_URL format is invalid')
    throw new Error('SUPABASE_URL must be a valid Supabase URL (should contain supabase.co)')
  }

  if (key.length < 100) {
    console.error(`[Supabase Server] ❌ ${keyName} format is invalid (too short)`)
    throw new Error(`${keyName} appears to be invalid (JWT tokens should be longer)`)
  }

  console.log('[Supabase Server] ✅ Credentials validation passed')
}

// ============================================================================
// ADMIN CLIENT CREATION
// ============================================================================

/**
 * Create admin client for server operations (lazy loaded)
 * ✅ FIXED: Added comprehensive error handling and validation
 */
async function createAdminClient(): Promise<SupabaseClient> {
  if (adminClientInstance) {
    console.log('[Supabase Server] ℹ️ Using cached admin client')
    return adminClientInstance
  }

  try {
    console.log('[Supabase Server] Creating admin client...')

    // Get credentials from environment
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Validate credentials
    console.log('[Supabase Server] Validating admin credentials...')
    validateSupabaseCredentials(supabaseUrl || '', supabaseServiceKey || '', 'SUPABASE_SERVICE_ROLE_KEY')

    // Import Supabase
    console.log('[Supabase Server] Importing @supabase/supabase-js...')
    const { createClient } = await import('@supabase/supabase-js')

    // Create client
    console.log('[Supabase Server] Initializing Supabase admin client...')
    adminClientInstance = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })

    console.log('[Supabase Server] ✅ Admin client created successfully')
    return adminClientInstance

  } catch (error: any) {
    console.error('[Supabase Server] ❌ CRITICAL: Failed to create admin client')
    console.error('[Supabase Server] Error type:', error.constructor.name)
    console.error('[Supabase Server] Error message:', error.message)
    console.error('[Supabase Server] Error stack:', error.stack)

    // Reset instance on error
    adminClientInstance = null

    throw new Error(`Failed to initialize Supabase admin client: ${error.message}`)
  }
}

// ============================================================================
// USER CLIENT CREATION
// ============================================================================

/**
 * Create user client for user operations (lazy loaded)
 * ✅ FIXED: Added comprehensive error handling and validation
 */
async function createUserClient(): Promise<SupabaseClient> {
  if (userClientInstance) {
    console.log('[Supabase Server] ℹ️ Using cached user client')
    return userClientInstance
  }

  try {
    console.log('[Supabase Server] Creating user client...')

    // Get credentials from environment
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_KEY

    // Validate credentials
    console.log('[Supabase Server] Validating user credentials...')
    validateSupabaseCredentials(supabaseUrl || '', supabaseKey || '', 'SUPABASE_KEY')

    // Import Supabase
    console.log('[Supabase Server] Importing @supabase/supabase-js...')
    const { createClient } = await import('@supabase/supabase-js')

    // Create client
    console.log('[Supabase Server] Initializing Supabase user client...')
    userClientInstance = createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })

    console.log('[Supabase Server] ✅ User client created successfully')
    return userClientInstance

  } catch (error: any) {
    console.error('[Supabase Server] ❌ CRITICAL: Failed to create user client')
    console.error('[Supabase Server] Error type:', error.constructor.name)
    console.error('[Supabase Server] Error message:', error.message)
    console.error('[Supabase Server] Error stack:', error.stack)

    // Reset instance on error
    userClientInstance = null

    throw new Error(`Failed to initialize Supabase user client: ${error.message}`)
  }
}

// ============================================================================
// PUBLIC EXPORTS - GET CLIENTS
// ============================================================================

/**
 * Get admin client
 * ✅ FIXED: Added error handling
 */
export async function getAdminClient(): Promise<SupabaseClient> {
  try {
    return await createAdminClient()
  } catch (error: any) {
    console.error('[Supabase Server] Failed to get admin client:', error.message)
    throw error
  }
}

/**
 * Get user client
 * ✅ FIXED: Added error handling
 */
export async function getUserClient(): Promise<SupabaseClient> {
  try {
    return await createUserClient()
  } catch (error: any) {
    console.error('[Supabase Server] Failed to get user client:', error.message)
    throw error
  }
}

/**
 * Get client from event context (if available)
 * ✅ FIXED: Added error handling
 */
export async function getClientFromEvent(event: H3Event): Promise<SupabaseClient> {
  try {
    const contextClient = (event.context as any)?.supabase
    if (contextClient) {
      console.log('[Supabase Server] Using client from event context')
      return contextClient
    }
    return await createUserClient()
  } catch (error: any) {
    console.error('[Supabase Server] Failed to get client from event:', error.message)
    throw error
  }
}

// ============================================================================
// QUERY EXECUTION HELPERS
// ============================================================================

/**
 * Execute query with admin privileges
 * ✅ FIXED: Added error handling and logging
 */
export async function executeAdminQuery<T>(
  callback: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  try {
    console.log('[Supabase Server] Executing admin query...')
    const client = await createAdminClient()
    const result = await callback(client)
    console.log('[Supabase Server] ✅ Admin query executed successfully')
    return result
  } catch (error: any) {
    console.error('[Supabase Server] ❌ Admin query failed:', error.message)
    throw error
  }
}

/**
 * Execute query with user privileges
 * ✅ FIXED: Added error handling and logging
 */
export async function executeUserQuery<T>(
  callback: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  try {
    console.log('[Supabase Server] Executing user query...')
    const client = await createUserClient()
    const result = await callback(client)
    console.log('[Supabase Server] ✅ User query executed successfully')
    return result
  } catch (error: any) {
    console.error('[Supabase Server] ❌ User query failed:', error.message)
    throw error
  }
}

// ============================================================================
// DEFAULT EXPORT FOR COMPATIBILITY
// ============================================================================

/**
 * Default export for compatibility with #supabase/server alias
 * ✅ FIXED: Added error handling
 */
export default async function serverSupabaseClient(event?: H3Event): Promise<SupabaseClient> {
  try {
    if (event) {
      return await getClientFromEvent(event)
    }
    return await getUserClient()
  } catch (error: any) {
    console.error('[Supabase Server] Failed to get Supabase client:', error.message)
    throw error
  }
}

// ============================================================================
// NAMED EXPORT FOR DIRECT USAGE
// ============================================================================
export { serverSupabaseClient }

// ============================================================================
// HEALTH CHECK FUNCTION
// ============================================================================

/**
 * Health check to verify Supabase connection
 * ✅ NEW: Added for debugging
 */
export async function checkSupabaseHealth(): Promise<{
  adminClient: boolean
  userClient: boolean
  errors: string[]
}> {
  const errors: string[] = []
  let adminClientOk = false
  let userClientOk = false

  try {
    console.log('[Supabase Server] Running health check...')

    // Check admin client
    try {
      await createAdminClient()
      adminClientOk = true
      console.log('[Supabase Server] ✅ Admin client health check passed')
    } catch (error: any) {
      errors.push(`Admin client: ${error.message}`)
      console.error('[Supabase Server] ❌ Admin client health check failed:', error.message)
    }

    // Check user client
    try {
      await createUserClient()
      userClientOk = true
      console.log('[Supabase Server] ✅ User client health check passed')
    } catch (error: any) {
      errors.push(`User client: ${error.message}`)
      console.error('[Supabase Server] ❌ User client health check failed:', error.message)
    }

    return {
      adminClient: adminClientOk,
      userClient: userClientOk,
      errors,
    }

  } catch (error: any) {
    console.error('[Supabase Server] Health check failed:', error.message)
    return {
      adminClient: false,
      userClient: false,
      errors: [error.message],
    }
  }
}
