#!/usr/bin/env node
/**
 * Quick verification of Gmail tenant_id migration
 * Uses same connection approach as run-migration.js
 */

const { Client } = require('pg');
const { execSync } = require('child_process');

// Set environment variable inline for this process
process.env.DIRECT_DATABASE_URL = 'postgresql://postgres:NsjCsuLJfBswVhdI@db.zqhenxhgcjxslpfezybm.supabase.co:5432/postgres';

const DATABASE_URL = process.env.DIRECT_DATABASE_URL;

async function quickVerify() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Quick checks
    const result = await client.query(`
      SELECT
        'gmail_sync_state' as table_name,
        EXISTS(
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'gmail_sync_state' AND column_name = 'tenant_id'
        ) as has_tenant_id
      UNION ALL
      SELECT
        'gmail_messages' as table_name,
        EXISTS(
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'gmail_messages' AND column_name = 'tenant_id'
        ) as has_tenant_id
    `);

    console.log('📋 Migration Status:');
    result.rows.forEach(row => {
      const status = row.has_tenant_id ? '✅' : '❌';
      console.log(`   ${status} ${row.table_name}: tenant_id column ${row.has_tenant_id ? 'exists' : 'missing'}`);
    });

    // Check RLS policies
    const policies = await client.query(`
      SELECT tablename, COUNT(*) as policy_count
      FROM pg_policies
      WHERE tablename IN ('gmail_sync_state', 'gmail_messages')
      GROUP BY tablename
    `);

    console.log('\n📋 RLS Policies:');
    policies.rows.forEach(row => {
      console.log(`   ✅ ${row.tablename}: ${row.policy_count} policies`);
    });

    console.log('\n✅ Verification complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

quickVerify().catch(console.error);
