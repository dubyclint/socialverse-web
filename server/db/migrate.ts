// FILE: /server/db/migrate.ts
// ============================================================================
// DATABASE MIGRATION SCRIPT - FOR DATA MIGRATIONS ONLY
// ============================================================================
// NOTE: This script is for data migrations and seeding only.
// For schema changes, use Supabase SQL Editor directly.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

/**
 * Read SQL file from disk
 */
function readSqlFile(filename: string): string {
  const filePath = path.join(__dirname, filename)
  if (!fs.existsSync(filePath)) {
    throw new Error(`SQL file not found: ${filePath}`)
  }
  return fs.readFileSync(filePath, 'utf-8')
}

/**
 * Execute SQL query using Supabase RPC
 * NOTE: This requires a stored procedure 'exec_sql' to exist in your database
 * If it doesn't exist, use direct query execution instead
 */
async function executeSqlViaRpc(supabase: any, sql: string, description: string): Promise<boolean> {
  try {
    console.log(`\n📝 Running: ${description}...`)
    
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.error(`❌ Error in ${description}:`, error)
      return false
    }
    
    console.log(`✅ ${description} completed`)
    return true
  } catch (err: any) {
    console.error(`❌ Exception in ${description}:`, err.message)
    return false
  }
}

/**
 * Execute data migration using direct Supabase client
 * This is the preferred method for data operations
 */
async function executeDataMigration(
  supabase: any,
  migrationName: string,
  migrationFn: (client: any) => Promise<void>
): Promise<boolean> {
  try {
    console.log(`\n📝 Running: ${migrationName}...`)
    await migrationFn(supabase)
    console.log(`✅ ${migrationName} completed`)
    return true
  } catch (err: any) {
    console.error(`❌ Error in ${migrationName}:`, err.message)
    return false
  }
}

/**
 * Example data migration: Seed default settings
 * Remove or modify this based on your actual needs
 */
async function seedDefaultSettings(supabase: any) {
  const { data: existingSettings, error: checkError } = await supabase
    .from('settings')
    .select('id')
    .limit(1)

  if (checkError) {
    throw new Error(`Failed to check existing settings: ${checkError.message}`)
  }

  // Only seed if no settings exist
  if (existingSettings && existingSettings.length === 0) {
    const { error: insertError } = await supabase
      .from('settings')
      .insert([
        {
          key: 'app_name',
          value: 'SocialVerse',
          description: 'Application name'
        },
        {
          key: 'app_version',
          value: '1.0.0',
          description: 'Application version'
        },
        {
          key: 'maintenance_mode',
          value: 'false',
          description: 'Enable/disable maintenance mode'
        }
      ])

    if (insertError) {
      throw new Error(`Failed to seed settings: ${insertError.message}`)
    }

    console.log('  ✓ Default settings seeded')
  } else {
    console.log('  ℹ Settings already exist, skipping seed')
  }
}

/**
 * Example data migration: Create default admin user
 * IMPORTANT: Modify this based on your actual requirements
 */
async function createDefaultAdminUser(supabase: any) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@socialverse.local'
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!'

  // Check if admin already exists
  const { data: existingAdmin, error: checkError } = await supabase.auth.admin.listUsers()

  if (checkError) {
    throw new Error(`Failed to check existing users: ${checkError.message}`)
  }

  const adminExists = existingAdmin?.users?.some((u: any) => u.email === adminEmail)

  if (!adminExists) {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        username: 'admin',
        is_admin: true
      }
    })

    if (authError) {
      throw new Error(`Failed to create admin user: ${authError.message}`)
    }

    console.log(`  ✓ Admin user created: ${adminEmail}`)
    console.log(`  ⚠️  IMPORTANT: Change the default password immediately!`)
  } else {
    console.log(`  ℹ Admin user already exists: ${adminEmail}`)
  }
}

/**
 * Run all data migrations
 */
async function runMigrations() {
  try {
    console.log('🚀 Starting database data migrations...\n')
    console.log('📌 NOTE: This script handles DATA migrations only.')
    console.log('📌 For SCHEMA changes, use Supabase SQL Editor directly.\n')
    
    const supabase = await getSupabaseClient()

    // Track migration results
    const results: { name: string; success: boolean }[] = []

    // Migration 1: Seed default settings
    console.log('📦 Migration 1: Default Settings')
    const settingsSuccess = await executeDataMigration(
      supabase,
      'Seed default settings',
      seedDefaultSettings
    )
    results.push({ name: 'Seed default settings', success: settingsSuccess })

    // Migration 2: Create default admin user (optional)
    console.log('\n📦 Migration 2: Default Admin User')
    const adminSuccess = await executeDataMigration(
      supabase,
      'Create default admin user',
      createDefaultAdminUser
    )
    results.push({ name: 'Create default admin user', success: adminSuccess })

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 MIGRATION SUMMARY')
    console.log('='.repeat(60))
    
    results.forEach(result => {
      const status = result.success ? '✅' : '❌'
      console.log(`${status} ${result.name}`)
    })

    const allSuccess = results.every(r => r.success)
    
    if (allSuccess) {
      console.log('\n✅ All data migrations completed successfully!\n')
      console.log('📊 Database is ready for use.')
    } else {
      console.log('\n⚠️  Some migrations failed. Please review the errors above.')
      process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ Migration process failed:', error)
    process.exit(1)
  }
}

/**
 * Rollback function for reverting migrations (optional)
 */
async function rollbackMigrations() {
  try {
    console.log('🔄 Starting rollback...\n')
    
    const supabase = await getSupabaseClient()

    // Example: Delete seeded settings
    console.log('📝 Removing seeded settings...')
    const { error: deleteError } = await supabase
      .from('settings')
      .delete()
      .in('key', ['app_name', 'app_version', 'maintenance_mode'])

    if (deleteError) {
      console.error('❌ Error removing settings:', deleteError)
      return false
    }

    console.log('✅ Rollback completed\n')
    return true

  } catch (error) {
    console.error('❌ Rollback failed:', error)
    return false
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2]
  
  if (command === 'rollback') {
    rollbackMigrations()
  } else {
    runMigrations()
  }
}

export { runMigrations, rollbackMigrations, getSupabaseClient }
