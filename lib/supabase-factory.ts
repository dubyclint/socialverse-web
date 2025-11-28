// FILE: /lib/supabase-factory.ts
// ✅ FIXED - Supabase client factory with proper error handling
// Addresses: Issue #1 (Missing env vars), Issue #2 (Timing), Issue #3 (Pinia init)

import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null
let initializationAttempted = false
let initializationError: Error | null = null

/**
 * Get or create Supabase client with proper error handling
 * Returns null if credentials are missing (graceful degradation)
 */
export const getSupabaseClient = (): SupabaseClient | null => {
  // Return cached client if already initialized
  if (initializationAttempted) {
    if (initializationError) {
      console.warn('[Supabase Factory] Using cached error state:', initializationError.message)
      return null
    }
    return supabaseClient
  }

  try {
    // Get credentials from environment variables (CRITICAL FIX #1)
    const supabaseUrl = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_KEY || import.meta.env.VITE_SUPABASE_KEY

    // Validate credentials exist
    if (!supabaseUrl || !supabaseKey) {
      const errorMsg = `[Supabase Factory] Missing credentials: URL=${!!supabaseUrl}, Key=${!!supabaseKey}`
      console.error(errorMsg)
      initializationError = new Error(errorMsg)
      initializationAttempted = true
      return null
    }

    // Validate URL format
    if (!supabaseUrl.includes('supabase.co')) {
      const errorMsg = '[Supabase Factory] Invalid Supabase URL format'
      console.error(errorMsg)
      initializationError = new Error(errorMsg)
      initializationAttempted = true
      return null
    }

    // Create client with proper configuration
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          'X-Client-Info': 'socialverse-web',
        },
      },
    })

    console.log('[Supabase Factory] ✅ Client created successfully')
    initializationAttempted = true
    return supabaseClient
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[Supabase Factory] Failed to create client:', err.message)
    initializationError = err
    initializationAttempted = true
    return null
  }
}

/**
 * Composable wrapper for use in Vue components
 */
export const useSupabaseFactory = (): SupabaseClient | null => {
  return getSupabaseClient()
}

/**
 * Check if Supabase is properly initialized
 */
export const isSupabaseReady = (): boolean => {
  return supabaseClient !== null && initializationAttempted && !initializationError
}

/**
 * Get initialization error if any
 */
export const getSupabaseError = (): Error | null => {
  return initializationError
}
