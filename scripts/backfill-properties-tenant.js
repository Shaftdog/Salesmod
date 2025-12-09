#!/usr/bin/env node
/**
 * Backfill tenant_id for properties from org_id -> profiles.tenant_id
 */

const { Client } = require('pg');

// Load .env.local
require('dotenv').config({ path: '.env.local' });

// Use pooler connection (more reliable)
const DATABASE_URL = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL not set in .env.local');
  process.exit(1);
}

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL
  });

  try {
    console.log('🔗 Connecting to database...\n');
    await client.connect();
    console.log('✅ Connected successfully\n');

    // Step 1: Get counts before backfill
    console.log('📊 Checking current state...\n');
    const beforeResult = await client.query(`
      SELECT
        COUNT(*) as total_properties,
        COUNT(tenant_id) as with_tenant_id,
        COUNT(*) - COUNT(tenant_id) as missing_tenant_id
      FROM public.properties
    `);

    const before = beforeResult.rows[0];
    console.log('Before backfill:');
    console.log(`   Total properties:     ${before.total_properties}`);
    console.log(`   With tenant_id:       ${before.with_tenant_id}`);
    console.log(`   Missing tenant_id:    ${before.missing_tenant_id}\n`);

    // Step 2: Run the backfill
    console.log('🔄 Running backfill...\n');
    const updateResult = await client.query(`
      UPDATE public.properties prop
      SET tenant_id = p.tenant_id
      FROM public.profiles p
      WHERE prop.org_id = p.id
        AND prop.tenant_id IS NULL
        AND p.tenant_id IS NOT NULL
    `);

    const updatedCount = updateResult.rowCount;
    console.log(`✅ Updated ${updatedCount} properties\n`);

    // Step 3: Verify results
    console.log('📊 Verifying results...\n');
    const afterResult = await client.query(`
      SELECT
        COUNT(*) as total_properties,
        COUNT(tenant_id) as with_tenant_id,
        COUNT(*) - COUNT(tenant_id) as missing_tenant_id
      FROM public.properties
    `);

    const after = afterResult.rows[0];
    console.log('After backfill:');
    console.log(`   Total properties:     ${after.total_properties}`);
    console.log(`   With tenant_id:       ${after.with_tenant_id}`);
    console.log(`   Missing tenant_id:    ${after.missing_tenant_id}\n`);

    // Step 4: Show any properties still missing tenant_id
    if (parseInt(after.missing_tenant_id) > 0) {
      console.log('⚠️  Properties still missing tenant_id:\n');
      const missingResult = await client.query(`
        SELECT id, address, org_id, tenant_id
        FROM public.properties
        WHERE tenant_id IS NULL
        LIMIT 10
      `);

      missingResult.rows.forEach(row => {
        console.log(`   ID: ${row.id}, Address: ${row.address || 'N/A'}, org_id: ${row.org_id || 'NULL'}`);
      });

      if (parseInt(after.missing_tenant_id) > 10) {
        console.log(`   ... and ${parseInt(after.missing_tenant_id) - 10} more\n`);
      }
    }

    console.log('='.repeat(60));
    console.log('\n✅ Backfill completed successfully!\n');
    console.log('Summary:');
    console.log(`   Properties updated: ${updatedCount}`);
    console.log(`   Properties with tenant_id: ${after.with_tenant_id} / ${after.total_properties}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
