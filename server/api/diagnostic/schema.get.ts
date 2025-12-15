// FILE: /server/api/diagnostic/schema.get.ts
// ============================================================================
// DIAGNOSTIC ENDPOINT - Query Supabase Schema
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)

    // Query 1: Get all tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')

    // Query 2: Get all views
    const { data: views, error: viewsError } = await supabase
      .from('information_schema.views')
      .select('table_name')
      .eq('table_schema', 'public')

    // Query 3: Get profiles structure
    const { data: profilesColumns, error: profilesError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'profiles')

    // Query 4: Get users structure
    const { data: usersColumns, error: usersError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'users')

    return {
      tables: tables || [],
      views: views || [],
      profiles_columns: profilesColumns || [],
      users_columns: usersColumns || [],
      errors: {
        tables: tablesError?.message,
        views: viewsError?.message,
        profiles: profilesError?.message,
        users: usersError?.message
      }
    }
  } catch (error: any) {
    return {
      error: error.message,
      details: error
    }
  }
})
