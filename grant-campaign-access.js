/**
 * Grant campaign management access to current user
 * This sets the user's role to 'admin' or 'sales_manager'
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function grantCampaignAccess() {
  console.log('🔍 Checking user profiles...\n');

  // Get all profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .order('created_at', { ascending: false });

  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError);
    process.exit(1);
  }

  console.log('📋 Current user profiles:');
  profiles.forEach((profile, index) => {
    console.log(`   ${index + 1}. ${profile.email || profile.id}`);
    console.log(`      Role: ${profile.role || '(not set)'}`);
    console.log(`      ID: ${profile.id}`);
    console.log('');
  });

  // Update all profiles to admin (for development purposes)
  console.log('🔄 Granting campaign access (admin role) to all users...\n');

  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .in('id', profiles.map(p => p.id))
    .select();

  if (updateError) {
    console.error('❌ Error updating profiles:', updateError);
    process.exit(1);
  }

  console.log('✅ Successfully granted campaign access!');
  console.log(`   Updated ${updated.length} profile(s) to admin role\n`);

  // Verify
  console.log('🔍 Verifying updates:');
  updated.forEach(profile => {
    console.log(`   ✓ ${profile.email || profile.id} → ${profile.role}`);
  });

  console.log('\n✅ All users now have campaign management access');
  console.log('   Refresh the page to see your campaigns');
}

grantCampaignAccess().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
