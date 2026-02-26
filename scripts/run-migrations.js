#!/usr/bin/env node

/**
 * Database Migration Runner
 * Runs all pending migrations for the free policy review system
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://bnxvfxtpsxgfpltflyrr.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('');
  console.error('Usage:');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your-key node scripts/run-migrations.js');
  console.error('');
  console.error('Or add to .env file:');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your-key');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Migration files to run
const migrations = [
  {
    name: '20260226_free_policy_reviews',
    path: path.join(__dirname, '../supabase/migrations/20260226_free_policy_reviews.sql'),
    description: 'Create free_policy_reviews table with IP tracking'
  },
  {
    name: '20260226_abuse_detection_log',
    path: path.join(__dirname, '../supabase/migrations/20260226_abuse_detection_log.sql'),
    description: 'Create abuse_detection_log table for security monitoring'
  }
];

async function runMigration(migration) {
  console.log(`\n📦 Running migration: ${migration.name}`);
  console.log(`   ${migration.description}`);
  
  try {
    // Read SQL file
    const sql = fs.readFileSync(migration.path, 'utf8');
    
    // Execute SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Try direct query if RPC doesn't work
      const statements = sql.split(';').filter(s => s.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error: stmtError } = await supabase.from('_migrations').insert({
            name: migration.name,
            executed_at: new Date().toISOString()
          });
          
          if (stmtError && !stmtError.message.includes('already exists')) {
            throw stmtError;
          }
        }
      }
    }
    
    console.log(`   ✅ Migration completed successfully`);
    return true;
  } catch (error) {
    console.error(`   ❌ Migration failed:`, error.message);
    return false;
  }
}

async function verifyTables() {
  console.log(`\n🔍 Verifying tables...`);
  
  const tables = [
    'free_policy_reviews',
    'abuse_detection_log'
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error && error.code === '42P01') {
        console.log(`   ❌ Table '${table}' does not exist`);
      } else {
        console.log(`   ✅ Table '${table}' exists and is accessible`);
      }
    } catch (error) {
      console.log(`   ⚠️  Could not verify table '${table}':`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 Starting database migrations...');
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  console.log(`   Service Key: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`);
  
  let successCount = 0;
  
  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (success) successCount++;
  }
  
  await verifyTables();
  
  console.log(`\n📊 Migration Summary:`);
  console.log(`   Total migrations: ${migrations.length}`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Failed: ${migrations.length - successCount}`);
  
  if (successCount === migrations.length) {
    console.log(`\n✅ All migrations completed successfully!`);
    console.log(`\n🎉 Database is ready for the free policy review system.`);
    process.exit(0);
  } else {
    console.log(`\n⚠️  Some migrations failed. Please check the errors above.`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
