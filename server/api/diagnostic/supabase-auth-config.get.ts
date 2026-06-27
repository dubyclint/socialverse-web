// ============================================================================
// FILE: /server/api/diagnostic/supabase-auth-config.get.ts - RECONCILED
// ============================================================================
import { defineEventHandler } from 'h3'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    checks: {},
    recommendations: []
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    diagnostics.checks.env_variables = {
      status: supabaseUrl && supabaseAnonKey && supabaseServiceKey ? 'passed' : 'failed',
      details: { url_set: !!supabaseUrl, anon_key_set: !!supabaseAnonKey, service_key_set: !!supabaseServiceKey }
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Critical configuration keys missing.')
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // ✅ FIXED: Check schema properties for the correct table ('profiles')
    try {
      const { data: columns, error } = await supabaseAdmin
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'profiles')
        .eq('table_schema', 'public')

      if (error || !columns?.length) {
        diagnostics.checks.user_table = { status: 'failed', error: 'Profiles schema table tracking layer missing from public database layout.' }
        diagnostics.recommendations.push('Run initialization migration SQL schema scripts for the profiles structural layout.')
      } else {
        diagnostics.checks.user_table = {
          status: 'passed',
          columns: columns.map((c: any) => ({ name: c.column_name, type: c.data_type }))
        }
      }
    } catch (err: any) {
      diagnostics.checks.user_table = { status: 'failed', error: err.message }
    }

    // Comprehensive assessment status aggregation
    const checkValues = Object.values(diagnostics.checks) as any[]
    diagnostics.summary = {
      overall_status: checkValues.every(c => c.status !== 'failed') ? 'healthy' : 'needs_attention',
      passed: checkValues.filter(c => c.status === 'passed').length,
      failed: checkValues.filter(c => c.status === 'failed').length
    }

    return diagnostics

  } catch (error: any) {
    return { timestamp: diagnostics.timestamp, error: error.message, checks: diagnostics.checks }
  }
})
