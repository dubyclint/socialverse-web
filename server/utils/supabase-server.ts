// FILE: /server/utils/supabase-server.ts - FULLY LAZY LOADED
// ============================================================================
// SERVER-SIDE SUPABASE CLIENT - LAZY LOADED
// ============================================================================

import type { H3Event } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'

let adminClientInstance: SupabaseClient | null = null
let userClientInstance: SupabaseClient | null = null

/**
 * Create admin client for server operations (lazy loaded)
 */
async function createAdminClient(): Promise<SupabaseClient> {
  if (adminClientInstance) {
    return adminClientInstance
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    
    const supabaseUrl = process.env.SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')
    }

    adminClientInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })

    console.log('[Supabase Server] Admin client created')
    return adminClientInstance
  } catch (error) {
    console.error('[Supabase Server] Failed to create admin client:', error)
    throw error
  }
}

/**
 * Create user client for user operations (lazy loaded)
 */
async function createUserClient(): Promise<SupabaseClient> {
  if (userClientInstance) {
    return userClientInstance
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    
    const supabaseUrl = process.env.SUPABASE_URL || ''
    const supabaseKey = process.env.SUPABASE_KEY || ''

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_KEY')
    }

    userClientInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })

    console.log('[Supabase Server] User client created')
    return userClientInstance
  } catch (error) {
    console.error('[Supabase Server] Failed to create user client:', error)
    throw error
  }
}

/**
 * Get admin client
 */
export async function getAdminClient(): Promise<SupabaseClient> {
  return createAdminClient()
}

/**
 * Get user client
 */
export async function getUserClient(): Promise<SupabaseClient> {
  return createUserClient()
}

/**
 * Get client from event context (if available)
 */
export async function getClientFromEvent(event: H3Event): Promise<SupabaseClient> {
  // Try to get from context first
  const contextClient = (event.context as any)?.supabase
  if (contextClient) {
    return contextClient
  }

  // Fall back to user client
  return createUserClient()
}

/**
 * Execute query with admin privileges
 */
export async function executeAdminQuery<T>(
  callback: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  const client = await createAdminClient()
  return callback(client)
}

/**
 * Execute query with user privileges
 */
export async function executeUserQuery<T>(
  callback: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  const client = await createUserClient()
  return callback(client)
}
