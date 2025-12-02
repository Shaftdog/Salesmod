#!/usr/bin/env node
/**
 * Backfill tenant_id for properties using Supabase SQL API
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
        COUNT(*) as total_properties,
        COUNT(tenant_id) as with_tenant_id,
        COUNT(*) FILTER (WHERE tenant_id IS NULL) as missing_tenant_id
      FROM properties
    `;

    let result = await executeSQL(beforeQuery);
    const before = result.data ? result.data[0] : null;

    if (before) {
      console.log('Before backfill:');
      console.log(`   Total properties:     ${before.total_properties}`);
      console.log(`   With tenant_id:       ${before.with_tenant_id}`);
      console.log(`   Missing tenant_id:    ${before.missing_tenant_id}\n`);
    }

    // Step 2: Run the backfill
    console.log('🔄 Running backfill...\n');

    const updateQuery = `
      UPDATE properties prop
      SET tenant_id = p.tenant_id
      FROM profiles p
      WHERE prop.org_id = p.id
        AND prop.tenant_id IS NULL
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
      console.log(`   Total properties:     ${after.total_properties}`);
      console.log(`   With tenant_id:       ${after.with_tenant_id}`);
      console.log(`   Missing tenant_id:    ${after.missing_tenant_id}\n`);

      const updatedCount = parseInt(before.with_tenant_id) - parseInt(after.missing_tenant_id) - parseInt(before.with_tenant_id);

      console.log('='.repeat(60));
      console.log('\n✅ Backfill completed!\n');
      console.log('Summary:');
      console.log(`   Properties updated: ${parseInt(after.with_tenant_id) - parseInt(before.with_tenant_id)}`);
      console.log(`   Properties with tenant_id: ${after.with_tenant_id} / ${after.total_properties}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);

    // Try alternative: Direct query to properties table
    console.log('\n⚠️  SQL API method failed, trying alternative method...\n');

    try {
      // Use Supabase client library approach
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

      // Get count before
      const { count: beforeCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .is('tenant_id', null);

      console.log(`📊 Found ${beforeCount} properties without tenant_id\n`);

      // Get count first
      const { count: totalProps } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .not('org_id', 'is', null);

      console.log(`📊 Total properties to check: ${totalProps}\n`);

      // Get ALL properties (handle pagination)
      let allProps = [];
      const pageSize = 1000;
      let offset = 0;

      while (offset < totalProps) {
        const { data: page } = await supabase
          .from('properties')
          .select('id, org_id, tenant_id')
          .not('org_id', 'is', null)
          .range(offset, offset + pageSize - 1);

        if (page && page.length > 0) {
          allProps = allProps.concat(page);
          offset += page.length;
          console.log(`   Fetched ${allProps.length} / ${totalProps} properties...`);
        } else {
          break;
        }
      }

      console.log(`🔄 Checking and updating ${allProps?.length || 0} properties...\n`);

      let updated = 0;
      let checked = 0;
      for (const prop of allProps || []) {
        if (!prop.org_id) continue;

        checked++;

        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', prop.org_id)
          .maybeSingle();

        if (profile?.tenant_id && prop.tenant_id !== profile.tenant_id) {
          const { error: updateError } = await supabase
            .from('properties')
            .update({ tenant_id: profile.tenant_id })
            .eq('id', prop.id);

          if (!updateError) {
            updated++;
            if (updated % 50 === 0) {
              console.log(`   Updated ${updated} properties (checked ${checked})...`);
            }
          } else {
            console.error(`   ❌ Error updating property ${prop.id}:`, updateError.message);
          }
        }

        if (checked % 100 === 0) {
          console.log(`   Checked ${checked} properties...`);
        }
      }

      console.log(`\n✅ Updated ${updated} properties using alternative method\n`);

    } catch (altError) {
      console.error('❌ Alternative method also failed:', altError.message);
      process.exit(1);
    }
  }
}

main().catch(console.error);
