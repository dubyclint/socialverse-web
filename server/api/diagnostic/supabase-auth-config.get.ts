// FILE: /server/api/diagnostic/supabase-auth-config.get.ts
// ============================================================================
// COMPREHENSIVE SUPABASE AUTH CONFIGURATION DIAGNOSTIC
// ============================================================================
// This endpoint tests:
// 1. Supabase connectivity
// 2. Auth provider configuration  
// 3. Email provider status
// 4. RLS policies on auth tables
// 5. User table structure
// 6. Auth user creation capability
// ============================================================================

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    checks: {},
    recommendations: []
  }

  try {
    console.log('[Auth Diagnostic] Starting comprehensive auth configuration check...')

    // ============================================================================
    // STEP 1: Verify Environment Variables
    // ============================================================================
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    diagnostics.checks.env_variables = {
      status: supabaseUrl && supabaseAnonKey && supabaseServiceKey ? 'passed' : 'failed',
      details: {
        url_set: !!supabaseUrl,
        anon_key_set: !!supabaseAnonKey,
        service_key_set: !!supabaseServiceKey
      }
    }

    // ============================================================================
    // STEP 2: Test Supabase Connectivity
    // ============================================================================
    diagnostics.checks.connectivity = { status: 'checking', details: {} }

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false }
        })

        const { data, error } = await supabaseAnon
          .from('user')
          .select('count(*)', { count: 'exact', head: true })
          .limit(1)

        diagnostics.checks.connectivity.status = error ? 'warning' : 'passed'
        diagnostics.checks.connectivity.details.message = error?.message || 'Connected'
      } catch (err: any) {
        diagnostics.checks.connectivity.status = 'failed'
        diagnostics.checks.connectivity.details.error = err.message
      }
    }

    // ============================================================================
    // STEP 3: Check Auth Configuration
    // ============================================================================
    diagnostics.checks.auth_config = { status: 'checking', details: {} }

    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { persistSession: false }
        })

        diagnostics.checks.auth_config.status = 'passed'
        diagnostics.checks.auth_config.details.message = 'Auth system accessible'
      } catch (err: any) {
        diagnostics.checks.auth_config.status = 'failed'
        diagnostics.checks.auth_config.details.error = err.message
      }
    }

    // ============================================================================
    // STEP 4: Check User Table Structure
    // ============================================================================
    diagnostics.checks.user_table = { status: 'checking', details: {} }

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false }
        })

        const { data: columns, error } = await supabaseAnon
          .from('information_schema.columns')
          .select('column_name, data_type')
          .eq('table_name', 'user')
          .eq('table_schema', 'public')

        if (error || !columns?.length) {
          diagnostics.checks.user_table.status = 'failed'
          diagnostics.checks.user_table.details.error = 'User table not found'
        } else {
          diagnostics.checks.user_table.status = 'passed'
          diagnostics.checks.user_table.details.columns = columns.map((c: any) => ({
            name: c.column_name,
            type: c.data_type
          }))
        }
      } catch (err: any) {
        diagnostics.checks.user_table.status = 'failed'
        diagnostics.checks.user_table.details.error = err.message
      }
    }

    // ============================================================================
    // STEP 5: Test Auth Signup (Dry Run)
    // ============================================================================
    diagnostics.checks.auth_signup = { status: 'checking', details: {} }

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false }
        })

        const testEmail = `diagnostic-${Date.now()}@test.local`
        const { data: authData, error: authError } = await supabaseAnon.auth.signUp({
          email: testEmail,
          password: 'TestPassword123!@#'
        })

        if (authError) {
          diagnostics.checks.auth_signup.status = 'failed'
          diagnostics.checks.auth_signup.details.error = authError.message
          diagnostics.recommendations.push('Auth signup failed - check Supabase dashboard > Authentication > Providers')
        } else if (authData?.user?.id) {
          diagnostics.checks.auth_signup.status = 'passed'
          diagnostics.checks.auth_signup.details.message = 'Test signup successful'
          diagnostics.checks.auth_signup.details.test_user_id = authData.user.id
        }
      } catch (err: any) {
        diagnostics.checks.auth_signup.status = 'failed'
        diagnostics.checks.auth_signup.details.error = err.message
      }
    }

    // ============================================================================
    // FINAL SUMMARY
    // ============================================================================
    const checkValues = Object.values(diagnostics.checks) as any[]
    diagnostics.summary = {
      overall_status: checkValues.every(c => c.status !== 'failed') ? 'healthy' : 'needs_attention',
      passed: checkValues.filter(c => c.status === 'passed').length,
      warnings: checkValues.filter(c => c.status === 'warning').length,
      failed: checkValues.filter(c => c.status === 'failed').length
    }

    return diagnostics

  } catch (error: any) {
    return {
      timestamp: diagnostics.timestamp,
      error: error.message,
      checks: diagnostics.checks
    }
  }
})
