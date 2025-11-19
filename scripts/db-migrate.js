#!/usr/bin/env node

/**
 * Apply a specific migration to the Supabase database
 * Usage: node scripts/db-migrate.js <migration-file>
 */

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

    // Verify the results
    console.log('🔍 Verifying results...');
    const result = await client.query(`
      SELECT
        COUNT(*) as total_contacts,
        COUNT(org_id) as contacts_with_org_id,
        COUNT(*) - COUNT(org_id) as contacts_missing_org_id
      FROM contacts;
    `);

    const stats = result.rows[0];
    console.log(`
📊 Contact Statistics:
   Total Contacts: ${stats.total_contacts}
   ✅ With org_id: ${stats.contacts_with_org_id}
   ⚠️  Missing org_id: ${stats.contacts_missing_org_id}
`);

    // Show any contacts still missing org_id
    if (parseInt(stats.contacts_missing_org_id) > 0) {
      console.log('⚠️  Contacts still missing org_id:');
      const orphaned = await client.query(`
        SELECT id, email, client_id, created_at
        FROM contacts
        WHERE org_id IS NULL
        ORDER BY created_at DESC
        LIMIT 10;
      `);
      console.table(orphaned.rows);
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
