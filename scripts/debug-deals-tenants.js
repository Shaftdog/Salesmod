// Debug script to investigate tenant_id mismatch in deals
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugTenantMismatch() {
  console.log('=== DEBUGGING DEALS TENANT_ID MISMATCH ===\n');

  // Query 1: Get all deals with tenant_id
  console.log('1. DEALS TABLE:');
  console.log('---------------');
  const { data: deals, error: dealsError } = await supabase
    .from('deals')
    .select('id, title, tenant_id, created_by')
    .order('created_at', { ascending: false });

  if (dealsError) {
    console.error('Error fetching deals:', dealsError);
  } else {
    console.log(`Total deals: ${deals.length}`);
    deals.forEach(deal => {
      console.log(`  Deal: "${deal.title}"`);
      console.log(`    ID: ${deal.id}`);
      console.log(`    tenant_id: ${deal.tenant_id}`);
      console.log(`    created_by: ${deal.created_by}`);
      console.log('');
    });
  }

  // Query 2: Get all profiles with tenant_id
  console.log('\n2. PROFILES TABLE:');
  console.log('------------------');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, tenant_id')
    .not('tenant_id', 'is', null)
    .order('created_at', { ascending: false });

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
  } else {
    console.log(`Total profiles with tenant_id: ${profiles.length}`);
    profiles.forEach(profile => {
      console.log(`  Profile: ${profile.email}`);
      console.log(`    ID: ${profile.id}`);
      console.log(`    tenant_id: ${profile.tenant_id}`);
      console.log('');
    });
  }

  // Query 3: Check for ALL profiles (including those without tenant_id)
  console.log('\n3. ALL PROFILES (including NULL tenant_id):');
  console.log('--------------------------------------------');
  const { data: allProfiles, error: allProfilesError } = await supabase
    .from('profiles')
    .select('id, email, tenant_id')
    .order('created_at', { ascending: false });

  if (allProfilesError) {
    console.error('Error fetching all profiles:', allProfilesError);
  } else {
    console.log(`Total profiles: ${allProfiles.length}`);
    allProfiles.forEach(profile => {
      console.log(`  Profile: ${profile.email}`);
      console.log(`    ID: ${profile.id}`);
      console.log(`    tenant_id: ${profile.tenant_id || 'NULL'}`);
      console.log('');
    });
  }

  // Analysis
  console.log('\n=== ANALYSIS ===');
  console.log('----------------\n');

  if (deals && profiles && allProfiles) {
    const dealTenantIds = [...new Set(deals.map(d => d.tenant_id).filter(Boolean))];
    const profileTenantIds = [...new Set(profiles.map(p => p.tenant_id).filter(Boolean))];
    const allProfileIds = [...new Set(allProfiles.map(p => p.id))];

    console.log('Unique tenant_ids in deals:', dealTenantIds);
    console.log('Unique tenant_ids in profiles:', profileTenantIds);
    console.log('');

    // Check for mismatches
    const missingTenants = dealTenantIds.filter(tid => !profileTenantIds.includes(tid));
    if (missingTenants.length > 0) {
      console.log('❌ MISMATCH FOUND!');
      console.log(`   Deals have tenant_ids that don't exist in profiles: ${missingTenants.join(', ')}`);
      console.log('   This would prevent deals from being visible to any user.');
    } else if (dealTenantIds.length === 0) {
      console.log('⚠️  WARNING: No deals have tenant_id set!');
      console.log('   Deals may not be visible due to RLS policies.');
    } else {
      console.log('✓ All deal tenant_ids match profile tenant_ids');
    }

    // Check if deals were created by users without tenant_id
    console.log('\n4. DEALS CREATED BY USERS WITHOUT TENANT_ID:');
    console.log('---------------------------------------------');
    const profilesWithoutTenant = allProfiles.filter(p => !p.tenant_id);
    const dealsCreatedByNoTenant = deals.filter(deal =>
      profilesWithoutTenant.some(p => p.id === deal.created_by)
    );

    if (dealsCreatedByNoTenant.length > 0) {
      console.log(`❌ ISSUE FOUND: ${dealsCreatedByNoTenant.length} deals created by users without tenant_id:`);
      dealsCreatedByNoTenant.forEach(deal => {
        const creator = allProfiles.find(p => p.id === deal.created_by);
        console.log(`  Deal: "${deal.title}"`);
        console.log(`    Created by: ${creator?.email || deal.created_by}`);
        console.log(`    Deal tenant_id: ${deal.tenant_id}`);
        console.log(`    Creator tenant_id: ${creator?.tenant_id || 'NULL'}`);
        console.log('');
      });
    } else {
      console.log('✓ All deals created by users with tenant_id');
    }

    // Check RLS policies
    console.log('\n5. RECOMMENDED ACTIONS:');
    console.log('------------------------');

    if (missingTenants.length > 0 || dealsCreatedByNoTenant.length > 0) {
      console.log('The issue appears to be a tenant_id mismatch. Solutions:');
      console.log('');
      console.log('Option 1: Update deals to match creator\'s tenant_id');
      console.log('  UPDATE deals SET tenant_id = (');
      console.log('    SELECT tenant_id FROM profiles WHERE profiles.id = deals.created_by');
      console.log('  ) WHERE created_by IN (');
      console.log('    SELECT id FROM profiles WHERE tenant_id IS NOT NULL');
      console.log('  );');
      console.log('');
      console.log('Option 2: Ensure all users have tenant_id set');
      console.log('  (Users without tenant_id cannot create or view multi-tenant data)');
    }
  }
}

debugTenantMismatch().catch(console.error);
