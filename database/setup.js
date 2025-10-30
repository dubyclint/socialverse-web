import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  console.log('Please check your .env file and ensure these variables are set:');
  console.log('- SUPABASE_URL=https://your-project.supabase.co');
  console.log('- SUPABASE_SERVICE_KEY=your-service-role-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL(sql, description) {
  try {
    console.log(`📝 ${description}...`);
    
    // Split SQL into individual statements and execute them
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error(`  ❌ Error: ${error.message}`);
          throw error;
        }
      }
    }
    
    console.log(`  ✅ ${description} completed`);
  } catch (error) {
    console.error(`  ❌ Failed: ${error.message}`);
    throw error;
  }
}

async function runMigrations() {
  try {
    console.log('🚀 Starting database setup...\n');
    
    // Read migration files in order
    const migrations = [
      { file: '001_initial_schema.sql', description: 'Initial schema' },
      { file: '002_add_indexes.sql', description: 'Add indexes' },
      { file: '003_cleanup_duplicate_tables', description: 'Cleanup duplicate tables' },
      { file: '004_fix_posts_tables_structure.sql', description: 'Fix posts table structure' },
      { file: '005_verify_schema.sql', description: 'Verify schema consistency' },
      { file: '006_fix_case_sensitivity.sql', description: 'Fix case sensitivity' },
      { file: '007_create_rpc_functions.sql', description: 'Create RPC functions' }
    ];
    
    for (const migration of migrations) {
      const migrationPath = path.join(__dirname, 'migrations', migration.file);
      
      if (fs.existsSync(migrationPath)) {
        const sql = fs.readFileSync(migrationPath, 'utf-8');
        await executeSQL(sql, migration.description);
      } else {
        console.log(`⚠️  Migration file not found: ${migration.file}`);
      }
    }
    
    console.log('\n✅ Database setup completed successfully!');
    console.log('\n📊 Schema Summary:');
    console.log('  ✅ profiles table - User profiles (email & username UNIQUE)');
    console.log('  ✅ posts table - User posts (with user_id FK)');
    console.log('  ✅ trades table - Trade records (with buyer_id, seller_id FK)');
    console.log('  ✅ RLS policies - Row Level Security enabled');
    console.log('  ✅ Indexes - Performance indexes created');
    console.log('  ✅ Triggers - Auto-update timestamps + username/email normalization');
    console.log('  ✅ RPC Functions - Case-insensitive availability checks');
    
  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

// Run migrations
runMigrations();
