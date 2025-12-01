/**
 * Script to create a test user in Supabase Auth for E2E testing
 *
 * This creates the user:
 * - Email: test@appraisetrack.com
 * - Password: TestPassword123!
 *
 * Run with: npx tsx scripts/create-test-user.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zqhenxhgcjxslpfezybm.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('   This is the service_role key from your Supabase project settings');
  console.error('   Run with: SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx scripts/create-test-user.ts');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  const testEmail = 'test@appraisetrack.com';
  const testPassword = 'TestPassword123!';

  console.log('Creating test user...');
  console.log(`Email: ${testEmail}`);

  try {
    // Create user with admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: 'Test User',
        role: 'admin'
      }
    });

    if (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('⚠️  User already exists - updating password...');

        // Try to update password if user exists
        const users = await supabase.auth.admin.listUsers();
        const existingUser = users.data.users.find(u => u.email === testEmail);

        if (existingUser) {
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: testPassword }
          );

          if (updateError) {
            console.error('❌ Failed to update user password:', updateError.message);
            process.exit(1);
          }

          console.log('✅ Test user password updated successfully');
          console.log(`User ID: ${existingUser.id}`);
          return;
        }
      }

      console.error('❌ Failed to create user:', error.message);
      process.exit(1);
    }

    console.log('✅ Test user created successfully!');
    console.log(`User ID: ${data.user.id}`);
    console.log(`Email: ${data.user.email}`);
    console.log('\nYou can now run E2E tests with authentication');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

createTestUser();
