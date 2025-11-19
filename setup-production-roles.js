/**
 * Production Role Setup Script
 * Sets all users to admin role for campaign management access
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupProductionRoles() {
  console.log('🔧 Setting up production roles...\n');

  // Get all users
  const { data: users, error: fetchError } = await supabase
    .from('profiles')
    .select('id, email, role');

  if (fetchError) {
    console.error('❌ Error fetching users:', fetchError);
    process.exit(1);
  }

  console.log(`📋 Found ${users.length} users:\n`);
  users.forEach(user => {
    console.log(`   ${user.email} - Current role: ${user.role || 'none'}`);
  });

  // Update all users to admin role
  console.log('\n🔄 Updating all users to admin role...\n');

  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .neq('role', 'admin') // Only update non-admin users
    .select();

  if (updateError) {
    console.error('❌ Error updating roles:', updateError);
    process.exit(1);
  }

  console.log(`✅ Updated ${updated?.length || 0} users to admin role\n`);

  // Verify the updates
  const { data: verified, error: verifyError } = await supabase
    .from('profiles')
    .select('id, email, role');

  if (verifyError) {
    console.error('❌ Error verifying roles:', verifyError);
    process.exit(1);
  }

  console.log('📊 Final role status:\n');
  verified.forEach(user => {
    const status = user.role === 'admin' ? '✅' : '⚠️';
    console.log(`   ${status} ${user.email} - ${user.role}`);
  });

  const allAdmin = verified.every(u => u.role === 'admin');
  if (allAdmin) {
    console.log('\n✅ SUCCESS: All users now have admin role');
    console.log('   Campaign management access is properly configured');
  } else {
    console.log('\n⚠️  WARNING: Some users do not have admin role');
    process.exit(1);
  }
}

setupProductionRoles().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
