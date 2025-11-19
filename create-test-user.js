/**
 * Create Test User for Automated Testing
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  console.log('👤 Creating test user for automated testing...\n');

  const testEmail = 'automated-test@appraisetrack.com';
  const testPassword = 'TestPassword123!';

  // Check if user already exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('email', testEmail)
    .maybeSingle();

  if (existingProfile) {
    console.log(`✓ Test user already exists: ${testEmail}`);
    console.log(`  Role: ${existingProfile.role}`);

    // Make sure they have admin role
    if (existingProfile.role !== 'admin') {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', existingProfile.id);

      if (error) {
        console.error('❌ Error updating role:', error);
      } else {
        console.log('  ✓ Updated to admin role');
      }
    }

    console.log(`\n📧 Email: ${testEmail}`);
    console.log(`🔑 Password: ${testPassword}`);
    console.log('\n✅ Test user ready for automated testing\n');
    return;
  }

  // Create new user
  console.log(`Creating user: ${testEmail}...`);

  const { data: authData, error: createError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      full_name: 'Automated Test User'
    }
  });

  if (createError) {
    console.error('❌ Error creating user:', createError);
    process.exit(1);
  }

  console.log(`✓ User created with ID: ${authData.user.id}`);

  // Set admin role in profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', authData.user.id);

  if (profileError) {
    console.error('⚠️ Warning: Could not set admin role:', profileError);
  } else {
    console.log('✓ Admin role assigned');
  }

  console.log('\n✅ Test user created successfully!\n');
  console.log(`📧 Email: ${testEmail}`);
  console.log(`🔑 Password: ${testPassword}`);
  console.log('\n💡 Use these credentials for automated testing\n');
}

createTestUser().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
