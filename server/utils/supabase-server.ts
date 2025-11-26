// server/utils/supabase-server.ts - SERVER-SIDE ONLY
import { createClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'

// Create admin client for server operations
const createAdminClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}

// Create user client for server operations with user context
const createUserClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const supabaseKey = process.env.SUPABASE_KEY || ''
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_KEY')
  }
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}

// Main server Supabase client function
export const serverSupabaseClient = async (event?: H3Event) => {
  // Use admin client for privileged operations
  return createAdminClient()
}

// Export for direct imports
export const getAdminClient = createAdminClient
export const getUserClient = createUserClient

// Export factory function
export { createAdminClient, createUserClient }
