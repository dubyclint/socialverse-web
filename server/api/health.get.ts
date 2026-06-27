// FILE 5: /server/api/health.get.ts
// ============================================================================
// HEALTH CHECK ENDPOINT - Verify Supabase connection and environment
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  checks: {
    supabase_client: boolean
    supabase_connection: boolean
    environment_variables: boolean
    auth_context: boolean
  }
  details: {
    supabase_url?: string
    error?: string
    message?: string
  }
}

export default defineEventHandler(async (event): Promise<HealthResponse> => {
  const timestamp = new Date().toISOString()
  const checks = {
    supabase_client: false,
    supabase_connection: false,
    environment_variables: false,
    auth_context: false
  }
  const details: any = {}

  try {
    console.log('[Health Check] Starting health check...')

    // ============================================================================
    // CHECK 1: Environment Variables
    // ============================================================================
    console.log('[Health Check] Checking environment variables...')
    
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && supabaseKey) {
      checks.environment_variables = true
      details.supabase_url = supabaseUrl
      console.log('[Health Check] ✅ Environment variables present')
    } else {
      console.error('[Health Check] ❌ Missing environment variables')
      details.error = 'Missing SUPABASE_URL or SUPABASE_KEY'
    }

    // ============================================================================
    // CHECK 2: Supabase Client Initialization
    // ============================================================================
    console.log('[Health Check] Initializing Supabase client...')
    
    let supabase = null
    try {
      supabase = await serverSupabaseClient(event)
      if (supabase) {
        checks.supabase_client = true
        console.log('[Health Check] ✅ Supabase client initialized')
      } else {
        console.error('[Health Check] ❌ Supabase client is null')
        details.error = 'Supabase client initialization returned null'
      }
    } catch (err: any) {
      console.error('[Health Check] ❌ Supabase client error:', err.message)
      details.error = err.message
    }

    // ============================================================================
    // CHECK 3: Database Connection
    // ============================================================================
    if (supabase) {
      console.log('[Health Check] Testing database connection...')
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('count(*)', { count: 'exact', head: true })
          .limit(1)

        if (!error) {
          checks.supabase_connection = true
          console.log('[Health Check] ✅ Database connection successful')
        } else {
          console.warn('[Health Check] ⚠️ Database query error:', error.message)
          
          if (error.message.includes('does not exist')) {
            details.message = 'Database tables not yet created'
            checks.supabase_connection = true
          } else {
            details.error = error.message
          }
        }
      } catch (err: any) {
        console.error('[Health Check] ❌ Database connection failed:', err.message)
        details.error = err.message
      }
    }

    // ============================================================================
    // CHECK 4: Authentication Context
    // ============================================================================
    if (supabase) {
      console.log('[Health Check] Checking authentication context...')
      
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (user) {
          checks.auth_context = true
          console.log('[Health Check] ✅ Auth context available')
        } else if (error) {
          console.warn('[Health Check] ⚠️ No authenticated user (expected for health check)')
          checks.auth_context = true
        }
      } catch (err: any) {
        console.warn('[Health Check] ⚠️ Auth check error:', err.message)
        checks.auth_context = true
      }
    }

    // ============================================================================
    // DETERMINE OVERALL STATUS
    // ============================================================================
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    
    if (!checks.environment_variables || !checks.supabase_client) {
      status = 'unhealthy'
    } else if (!checks.supabase_connection) {
      status = 'degraded'
    }

    console.log('[Health Check] Status:', status)
    console.log('[Health Check] Checks:', checks)

    return {
      status,
      timestamp,
      checks,
      details
    }

  } catch (error: any) {
    console.error('[Health Check] ❌ Unexpected error:', error.message)
    
    return {
      status: 'unhealthy',
      timestamp,
      checks,
      details: {
        error: error.message
      }
    }
  }
})
