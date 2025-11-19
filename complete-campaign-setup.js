require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('\n🔧 Completing Campaign System Setup\n');

  // Step 1: Get or create a tenant
  console.log('📝 Step 1: Ensuring tenant exists...\n');

  let tenantId;

  const { data: tenants, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name')
    .limit(1);

  if (tenantError) {
    console.error('   ❌ Error fetching tenants:', tenantError.message);
    process.exit(1);
  }

  if (tenants && tenants.length > 0) {
    tenantId = tenants[0].id;
    console.log(`   ✅ Found existing tenant: ${tenants[0].name}`);
    console.log(`      Tenant ID: ${tenantId}\n`);
  } else {
    console.log('   📝 No tenants found, creating default tenant...');

    // Get the first user to be the owner
    const { data: { users } } = await supabase.auth.admin.listUsers();
    if (!users || users.length === 0) {
      console.error('   ❌ No users found to assign as tenant owner');
      process.exit(1);
    }

    const ownerId = users[0].id;

    const { data: newTenant, error: createError } = await supabase
      .from('tenants')
      .insert({
        name: 'My ROI Home',
        type: 'internal', // Valid types: lender, investor, amc, attorney, accountant, borrower, internal
        owner_id: ownerId
      })
      .select()
      .single();

    if (createError || !newTenant) {
      console.error('   ❌ Error creating tenant:', createError?.message);
      process.exit(1);
    }

    tenantId = newTenant.id;
    console.log(`   ✅ Created tenant: ${newTenant.name}`);
    console.log(`      Tenant ID: ${tenantId}`);
    console.log(`      Owner: ${users[0].email}\n`);
  }

  // Step 2: Update all user profiles
  console.log('📝 Step 2: Updating user profiles...\n');

  const { data: { users } } = await supabase.auth.admin.listUsers();

  for (const user of users) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        role: 'admin',
        org_id: tenantId
      })
      .eq('id', user.id);

    if (updateError) {
      console.log(`   ❌ ${user.email}: ${updateError.message}`);
    } else {
      console.log(`   ✅ ${user.email}`);
      console.log(`      - Role: admin`);
      console.log(`      - Org ID: ${tenantId}`);
    }
  }

  console.log('\n✅ CAMPAIGN SYSTEM SETUP COMPLETE!\n');
  console.log('📋 Next steps:');
  console.log('   1. Log out of http://localhost:9002');
  console.log('   2. Log back in as rod@myroihome.com');
  console.log('   3. Navigate to /sales/campaigns');
  console.log('   4. You should now have full access!\n');
})().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
