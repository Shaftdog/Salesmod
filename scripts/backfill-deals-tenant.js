#!/usr/bin/env node
/**
 * Backfill tenant_id for deals from created_by -> profiles.tenant_id
 */

const https = require('https');

// Load .env.local
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing Supabase configuration in .env.local');
  process.exit(1);
}

function executeSQL(query) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({ query }));
    req.end();
  });
}

async function main() {
  try {
    console.log('🔗 Connecting to Supabase...\n');

    // Step 1: Get counts before backfill
    console.log('📊 Checking current state...\n');

    const beforeQuery = `
      SELECT
        COUNT(*) as total_deals,
        COUNT(tenant_id) as with_tenant_id,
        COUNT(*) FILTER (WHERE tenant_id IS NULL) as missing_tenant_id
      FROM public.deals
    `;

    let result = await executeSQL(beforeQuery);
    const before = result.data ? result.data[0] : null;

    if (before) {
      console.log('Before backfill:');
      console.log(`   Total deals:          ${before.total_deals}`);
      console.log(`   With tenant_id:       ${before.with_tenant_id}`);
      console.log(`   Missing tenant_id:    ${before.missing_tenant_id}\n`);
    }

    // Step 2: Run the backfill
    console.log('🔄 Running backfill...\n');

    const updateQuery = `
      UPDATE public.deals d
      SET tenant_id = p.tenant_id
      FROM public.profiles p
      WHERE d.created_by = p.id
        AND d.tenant_id IS NULL
        AND p.tenant_id IS NOT NULL
    `;

    await executeSQL(updateQuery);
    console.log(`✅ Backfill query executed\n`);

    // Step 3: Verify results
    console.log('📊 Verifying results...\n');

    result = await executeSQL(beforeQuery);
    const after = result.data ? result.data[0] : null;

    if (after) {
      console.log('After backfill:');
      console.log(`   Total deals:          ${after.total_deals}`);
      console.log(`   With tenant_id:       ${after.with_tenant_id}`);
      console.log(`   Missing tenant_id:    ${after.missing_tenant_id}\n`);

      const updatedCount = parseInt(after.with_tenant_id) - parseInt(before.with_tenant_id);

      console.log('='.repeat(60));
      console.log('\n✅ Backfill completed!\n');
      console.log('Summary:');
      console.log(`   Deals updated: ${updatedCount}`);
      console.log(`   Deals with tenant_id: ${after.with_tenant_id} / ${after.total_deals}`);
      if (parseInt(after.missing_tenant_id) > 0) {
        console.log(`\n⚠️  Note: ${after.missing_tenant_id} deals still missing tenant_id`);
        console.log(`   (likely have created_by users without tenant_id in profiles)`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);

    // Try alternative: Direct query to deals table
    console.log('\n⚠️  SQL API method failed, trying alternative method...\n');

    try {
      // Use Supabase client library approach
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

      // Get count before
      const { count: beforeCount } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .is('tenant_id', null);

      console.log(`📊 Found ${beforeCount} deals without tenant_id\n`);

      // Get total deals to update
      const { data: dealsToUpdate } = await supabase
        .from('deals')
        .select('id, created_by, tenant_id')
        .is('tenant_id', null)
        .not('created_by', 'is', null);

      console.log(`🔄 Checking and updating ${dealsToUpdate?.length || 0} deals...\n`);

      let updated = 0;
      let checked = 0;
      for (const deal of dealsToUpdate || []) {
        if (!deal.created_by) continue;

        checked++;

        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', deal.created_by)
          .maybeSingle();

        if (profile?.tenant_id) {
          const { error: updateError } = await supabase
            .from('deals')
            .update({ tenant_id: profile.tenant_id })
            .eq('id', deal.id);

          if (!updateError) {
            updated++;
            if (updated % 50 === 0) {
              console.log(`   Updated ${updated} deals (checked ${checked})...`);
            }
          } else {
            console.error(`   ❌ Error updating deal ${deal.id}:`, updateError.message);
          }
        }

        if (checked % 100 === 0) {
          console.log(`   Checked ${checked} deals...`);
        }
      }

      console.log(`\n✅ Updated ${updated} deals using alternative method\n`);

      // Final count
      const { count: afterCount } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .is('tenant_id', null);

      console.log('Final status:');
      console.log(`   Deals updated: ${updated}`);
      console.log(`   Deals still missing tenant_id: ${afterCount}\n`);

    } catch (altError) {
      console.error('❌ Alternative method also failed:', altError.message);
      process.exit(1);
    }
  }
}

main().catch(console.error);
