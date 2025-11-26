// FILE: /server/db/migrate.ts
// ============================================================================
// DATABASE MIGRATION SCRIPT - LAZY LOADED
// ============================================================================

/**
 * Lazy-load Supabase to prevent bundling issues
 */
async function getSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js')
  
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required')
    process.exit(1)
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...')
    
    const supabase = await getSupabaseClient()

    // Example migration: Create settings table if it doesn't exist
    const { error: settingsError } = await supabase.rpc('create_settings_table_if_not_exists')
    
    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('❌ Error creating settings table:', settingsError)
      throw settingsError
    }

    console.log('✅ Settings table ready')

    // Add more migrations as needed
    console.log('✅ All migrations completed successfully')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
}

export { runMigrations, getSupabaseClient }
