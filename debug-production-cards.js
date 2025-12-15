/**
 * Debug script to investigate production_cards tenant_id issues
 * Runs diagnostic queries against Supabase to check for tenant isolation problems
 */

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

// Use pooler connection (try direct as fallback)
const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: No DATABASE_URL or DIRECT_DATABASE_URL found in .env.local');
  process.exit(1);
}

async function runDiagnostics() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✓ Connected to Supabase database\n');

    // Query 1: Get all production_cards with their tenant_id
    console.log('=== Query 1: All Production Cards ===');
    const result1 = await client.query(`
      SELECT id, tenant_id, org_id, current_stage, created_at
      FROM public.production_cards
      ORDER BY created_at DESC;
    `);

    console.log(`Found ${result1.rows.length} production cards:`);
    if (result1.rows.length > 0) {
      console.table(result1.rows.map(row => ({
        id: row.id.substring(0, 8) + '...',
        tenant_id: row.tenant_id?.substring(0, 8) + '...' || 'NULL',
        org_id: row.org_id?.substring(0, 8) + '...' || 'NULL',
        stage: row.current_stage,
        created: row.created_at.toISOString().split('T')[0]
      })));
    }
    console.log('');

    // Query 2: Check if production_cards tenant_ids match existing profile tenant_ids
    console.log('=== Query 2: Tenant ID Matching ===');
    const result2 = await client.query(`
      SELECT
        pc.id,
        pc.tenant_id as card_tenant,
        p.tenant_id as profile_tenant,
        p.email,
        CASE
          WHEN pc.tenant_id IS NULL THEN 'MISSING'
          WHEN p.tenant_id IS NULL THEN 'ORPHANED'
          WHEN pc.tenant_id != p.tenant_id THEN 'MISMATCH'
          ELSE 'MATCH'
        END as status
      FROM public.production_cards pc
      LEFT JOIN public.profiles p ON pc.org_id = p.id
      ORDER BY status DESC, pc.created_at DESC;
    `);

    const mismatches = result2.rows.filter(r => r.status !== 'MATCH');
    console.log(`Checked ${result2.rows.length} cards:`);
    console.log(`- Matching: ${result2.rows.filter(r => r.status === 'MATCH').length}`);
    console.log(`- Mismatched: ${result2.rows.filter(r => r.status === 'MISMATCH').length}`);
    console.log(`- Missing tenant_id: ${result2.rows.filter(r => r.status === 'MISSING').length}`);
    console.log(`- Orphaned (no profile): ${result2.rows.filter(r => r.status === 'ORPHANED').length}`);

    if (mismatches.length > 0) {
      console.log('\nProblem cards:');
      console.table(mismatches.map(row => ({
        card_id: row.id.substring(0, 8) + '...',
        card_tenant: row.card_tenant?.substring(0, 8) + '...' || 'NULL',
        profile_tenant: row.profile_tenant?.substring(0, 8) + '...' || 'NULL',
        email: row.email || 'N/A',
        status: row.status
      })));
    }
    console.log('');

    // Query 3: Find orphaned tenant_ids
    console.log('=== Query 3: Orphaned Tenant IDs ===');
    const result3 = await client.query(`
      SELECT pc.*
      FROM public.production_cards pc
      WHERE pc.tenant_id IS NOT NULL
        AND pc.tenant_id NOT IN (
          SELECT DISTINCT tenant_id
          FROM public.profiles
          WHERE tenant_id IS NOT NULL
        );
    `);

    console.log(`Found ${result3.rows.length} cards with orphaned tenant_ids`);
    if (result3.rows.length > 0) {
      console.table(result3.rows.map(row => ({
        id: row.id.substring(0, 8) + '...',
        tenant_id: row.tenant_id?.substring(0, 8) + '...',
        org_id: row.org_id?.substring(0, 8) + '...',
        stage: row.current_stage
      })));
    }
    console.log('');

    // Query 4: Offer to fix mismatches
    if (mismatches.length > 0) {
      console.log('=== Query 4: Fix Tenant ID Mismatches ===');
      console.log('Fixing tenant_id mismatches...');

      const result4 = await client.query(`
        UPDATE public.production_cards pc
        SET tenant_id = p.tenant_id
        FROM public.profiles p
        WHERE pc.org_id = p.id
          AND (pc.tenant_id IS NULL OR pc.tenant_id != p.tenant_id)
          AND p.tenant_id IS NOT NULL
        RETURNING pc.id, pc.tenant_id as new_tenant_id;
      `);

      console.log(`✓ Fixed ${result4.rows.length} cards with correct tenant_id from their org profile`);
      if (result4.rows.length > 0) {
        console.table(result4.rows.map(row => ({
          card_id: row.id.substring(0, 8) + '...',
          new_tenant_id: row.new_tenant_id?.substring(0, 8) + '...'
        })));
      }
    } else {
      console.log('=== No fixes needed ===');
      console.log('All production cards have correct tenant_id values!');
    }

    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`Total production cards: ${result1.rows.length}`);
    console.log(`Cards with mismatches found: ${mismatches.length}`);
    console.log(`Cards fixed: ${mismatches.length > 0 ? 'Yes' : 'No fixes needed'}`);
    console.log(`Orphaned tenant_ids: ${result3.rows.length}`);

  } catch (error) {
    console.error('ERROR:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✓ Database connection closed');
  }
}

runDiagnostics();
