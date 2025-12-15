// FILE: /server/api/diagnostic/schema-triggers.get.ts
// ============================================================================
// DIAGNOSTIC ENDPOINT - Check if triggers exist
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)

    // Query to check triggers
    const { data: triggers, error: triggersError } = await supabase
      .rpc('get_triggers_info')
      .catch(() => ({ data: null, error: { message: 'RPC not available' } }))

    // Alternative: Check if functions exist
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_schema', 'public')
      .in('routine_name', ['profiles_insert', 'profiles_update', 'profiles_delete', 'handle_new_auth_user'])

    // Check profiles view
    const { data: views, error: viewsError } = await supabase
      .from('information_schema.views')
      .select('table_name, view_definition')
      .eq('table_name', 'profiles')

    return {
      triggers: triggers || 'RPC not available',
      functions: functions || [],
      views: views || [],
      errors: {
        triggers: triggersError?.message,
        functions: functionsError?.message,
        views: viewsError?.message
      }
    }
  } catch (err: any) {
    return {
      error: err.message,
      details: err
    }
  }
})
