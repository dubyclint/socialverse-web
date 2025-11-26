// FILE: /server/utils/supabase-server.ts
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
        detectSessionInUrl: false
      }
    })

    return adminClientInstance
  } catch (error) {
    console.error('[SupabaseServer] Failed to create admin client:', error)
    throw error
  }
}

/**
 * Create user client for server operations (lazy loaded)
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
        detectSessionInUrl: false
      }
    })

    return userClientInstance
  } catch (error) {
    console.error('[SupabaseServer] Failed to create user client:', error)
    throw error
  }
}

/**
 * Get admin Supabase client for server-side operations
 */
export async function serverSupabaseAdmin(): Promise<SupabaseClient> {
  return createAdminClient()
}

/**
 * Get user Supabase client for server-side operations
 */
export async function serverSupabaseUser(): Promise<SupabaseClient> {
  return createUserClient()
}

/**
 * Get Supabase client from event context (for use in event handlers)
 */
export async function serverSupabaseClient(event?: H3Event): Promise<SupabaseClient> {
  if (event?.context?.supabase) {
    return event.context.supabase
  }
  return createAdminClient()
}
