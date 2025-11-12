#!/usr/bin/env node
/**
 * Run database migration(s) using Node.js
 * This is an alternative to the bash scripts for users without psql
 *
 * Usage:
 *   node scripts/run-migration.js                          # Run all pending
 *   node scripts/run-migration.js path/to/migration.sql    # Run specific file
 *   node scripts/run-migration.js --check                  # Check status
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Load .env.local
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL not set in .env.local');
  process.exit(1);
}

// Parse command line args
const args = process.argv.slice(2);
const command = args[0];

async function runMigration(client, filePath) {
  const sql = fs.readFileSync(filePath, 'utf-8');
  const migrationName = path.basename(filePath);

  console.log(`⚙️  Running: ${migrationName}`);

  try {
    // Run the migration
    await client.query(sql);

    // Log to migration history
    await client.query(`
      CREATE TABLE IF NOT EXISTS migration_history (
        id SERIAL PRIMARY KEY,
        migration_name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(
      'INSERT INTO migration_history (migration_name) VALUES ($1) ON CONFLICT (migration_name) DO NOTHING',
      [migrationName]
    );

    console.log(`   ✅ Success\n`);
    return true;
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}\n`);
    throw error;
  }
}

async function checkStatus(client) {
  console.log('🔍 Checking database migration status');
  console.log('='.repeat(60));
  console.log('');

  // Test connection
  console.log('📡 Testing database connection...');
  const versionResult = await client.query('SELECT version()');
  console.log('✅ Connected successfully\n');

  console.log('📦 Database Info:');
  console.log(`   ${versionResult.rows[0].version.split(',')[0]}\n`);

  // Check migration history
  console.log('📋 Migration History:');
  try {
    const countResult = await client.query('SELECT COUNT(*) FROM migration_history');
    const appliedCount = countResult.rows[0].count;
    console.log(`   Applied migrations: ${appliedCount}\n`);

    if (appliedCount > 0) {
      console.log('   Recent migrations:');
      const recentResult = await client.query(`
        SELECT migration_name, TO_CHAR(applied_at, 'YYYY-MM-DD HH24:MI:SS') as applied_at
        FROM migration_history
        ORDER BY applied_at DESC
        LIMIT 10
      `);

      recentResult.rows.forEach(row => {
        console.log(`   ✅ ${row.migration_name} (applied: ${row.applied_at})`);
      });
    }
  } catch (error) {
    console.log('   ⚠️  No migration_history table found (no migrations applied yet)');
  }

  // Check for pending migrations
  console.log('\n📂 Pending Migrations:');
  const migrationDir = 'supabase/migrations';

  if (!fs.existsSync(migrationDir)) {
    console.log('   ⚠️  Migration directory not found: ' + migrationDir);
    return;
  }

  const appliedResult = await client.query(
    'SELECT migration_name FROM migration_history'
  ).catch(() => ({ rows: [] }));

  const appliedMigrations = new Set(appliedResult.rows.map(r => r.migration_name));
  const allFiles = fs.readdirSync(migrationDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const pendingFiles = allFiles.filter(f => !appliedMigrations.has(f));

  if (pendingFiles.length === 0) {
    console.log('   ✅ No pending migrations');
  } else {
    console.log('');
    pendingFiles.forEach(file => {
      console.log(`   ⏳ ${file}`);
    });
    console.log(`\n   Total pending: ${pendingFiles.length}`);
    console.log('\n💡 Run \'node scripts/run-migration.js\' to apply pending migrations');
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

async function runAllMigrations(client) {
  console.log('🚀 Running all database migrations');
  console.log('='.repeat(60));
  console.log('');

  const migrationDir = 'supabase/migrations';

  if (!fs.existsSync(migrationDir)) {
    console.error('❌ Error: Migration directory not found: ' + migrationDir);
    process.exit(1);
  }

  // Ensure migration_history table exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS migration_history (
      id SERIAL PRIMARY KEY,
      migration_name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Get applied migrations
  const appliedResult = await client.query('SELECT migration_name FROM migration_history');
  const appliedMigrations = new Set(appliedResult.rows.map(r => r.migration_name));

  // Get all migration files
  const allFiles = fs.readdirSync(migrationDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`📂 Found ${allFiles.length} migration files\n`);

  let appliedCount = 0;
  let skippedCount = 0;

  for (const file of allFiles) {
    const filePath = path.join(migrationDir, file);

    if (appliedMigrations.has(file)) {
      console.log(`⏭️  Skipping (already applied): ${file}`);
      skippedCount++;
      continue;
    }

    try {
      await runMigration(client, filePath);
      appliedCount++;
    } catch (error) {
      console.error(`\n❌ Migration failed: ${file}`);
      console.error('Stopping migration process.');
      process.exit(1);
    }
  }

  console.log('='.repeat(60));
  console.log('\n📊 Migration Summary:');
  console.log(`   Total files:     ${allFiles.length}`);
  console.log(`   Applied:         ${appliedCount}`);
  console.log(`   Skipped:         ${skippedCount}`);
  console.log(`   Failed:          0`);
  console.log('\n✅ All migrations completed successfully!\n');
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();

    if (command === '--check' || command === '-c') {
      // Check status
      await checkStatus(client);
    } else if (command && fs.existsSync(command)) {
      // Run specific migration file
      console.log('🔧 Running single migration\n');
      await runMigration(client, command);
      console.log('✅ Migration completed successfully!\n');
    } else if (!command) {
      // Run all pending migrations
      await runAllMigrations(client);
    } else {
      console.error('❌ Error: Invalid command or file not found');
      console.log('\nUsage:');
      console.log('  node scripts/run-migration.js                          # Run all pending');
      console.log('  node scripts/run-migration.js path/to/migration.sql    # Run specific file');
      console.log('  node scripts/run-migration.js --check                  # Check status');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
