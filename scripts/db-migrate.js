#!/usr/bin/env node

/**
 * Apply a specific migration to the Supabase database
 * Usage: node scripts/db-migrate.js <migration-file>
 */

require('dotenv').config({ path: '.env.local' });
const { readFileSync } = require('fs');
const { Client } = require('pg');

async function applyMigration(migrationFile) {
  // Get connection string from environment variable
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL environment variable not set');
    console.error('   Please set DATABASE_URL in your .env.local file');
    console.error('   Example: DATABASE_URL=postgresql://user:pass@host:port/database');
    process.exit(1);
  }

  console.log(`📦 Reading migration: ${migrationFile}`);
  const sql = readFileSync(migrationFile, 'utf8');

  console.log('🔌 Connecting to database...');
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected successfully\n');

    console.log('🔄 Applying migration...');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60) + '\n');

    await client.query(sql);
    console.log('✅ Migration applied successfully\n');

    // Try to verify the results by checking for common table types
    console.log('🔍 Verifying results...');
    try {
      // Check if this looks like a task_library migration
      const taskLibraryCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'task_library'
        ) as task_library_exists;
      `);

      if (taskLibraryCheck.rows[0].task_library_exists) {
        const stats = await client.query(`
          SELECT
            (SELECT COUNT(*) FROM task_library) as library_tasks,
            (SELECT COUNT(*) FROM task_library_subtasks) as library_subtasks
        `);
        console.log(`📊 Task Library Statistics:
   Library Tasks: ${stats.rows[0].library_tasks}
   Library Subtasks: ${stats.rows[0].library_subtasks}
`);
      }
    } catch (verifyError) {
      // Verification is optional, don't fail the migration
      console.log('ℹ️  Skipping verification (tables may not exist yet)');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('👋 Disconnected from database');
  }
}

// Get migration file from command line
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Usage: node scripts/db-migrate.js <migration-file>');
  console.error('   Example: node scripts/db-migrate.js supabase/migrations/20251118000000_fix_contacts_org_id.sql');
  process.exit(1);
}

applyMigration(migrationFile);
