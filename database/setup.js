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
        const { error } = await supabase.rpc('exec', { sql: statement });
        if (error) {
          console.error(`❌ Error executing statement: ${error.message}`);
          throw error;
        }
      }
    }
    
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ Failed to execute: ${description}`);
    console.error(error);
    throw error;
  }
}

async function setupDatabase() {
  try {
    console.log('🚀 Starting database setup...\n');

    // Read migration files in order
    const migrationDir = path.join(__dirname, 'migrations');
    const migrationFiles = [
      '001_initial_schema.sql',
      '002_add_indexes.sql',
      '003_cleanup_duplicate_tables.sql',
      '004_fix_posts_table_structure.sql'
    ];

    for (const file of migrationFiles) {
      const filePath = path.join(migrationDir, file);
      if (fs.existsSync(filePath)) {
        const sql = fs.readFileSync(filePath, 'utf-8');
        await executeSQL(sql, `Migration: ${file}`);
      }
    }

    // Seed database
    const seedPath = path.join(__dirname, 'seed.sql');
    if (fs.existsSync(seedPath)) {
      const seedSQL = fs.readFileSync(seedPath, 'utf-8');
      await executeSQL(seedSQL, 'Seeding database');
    }

    console.log('\n✅ Database setup completed successfully!');
  } catch (error) {
    console.error('\n❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run setup
setupDatabase();
```__
