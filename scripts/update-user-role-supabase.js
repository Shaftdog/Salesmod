#!/usr/bin/env node
/**
 * Update a user's role using Supabase Admin client
 *
 * Usage:
 *   node scripts/update-user-role-supabase.js <email> <role>
 *   node scripts/update-user-role-supabase.js rod@myroihome.com super_admin
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env.local');
  process.exit(1);
}

const args = process.argv.slice(2);
const email = args[0];
const role = args[1] || 'super_admin';

if (!email) {
  console.error('❌ Error: Email address is required');
  console.log('\nUsage:');
  console.log('  node scripts/update-user-role-supabase.js <email> <role>');
  console.log('  node scripts/update-user-role-supabase.js rod@myroihome.com super_admin');
  process.exit(1);
}

async function updateUserRole() {
  // Create admin client with service role key
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    console.log('📡 Connected to Supabase');
    console.log('');

    // Check if user exists
    console.log(`🔍 Looking for user: ${email}`);
    const { data: users, error: checkError } = await supabase
      .from('profiles')
      .select('id, email, name, role')
      .eq('email', email);

    if (checkError) {
      console.error('❌ Error checking user:', checkError.message);
      process.exit(1);
    }

    if (!users || users.length === 0) {
      console.error(`❌ Error: No user found with email: ${email}`);
      process.exit(1);
    }

    const user = users[0];
    console.log('✅ User found:');
    console.log(`   ID:           ${user.id}`);
    console.log(`   Email:        ${user.email}`);
    console.log(`   Name:         ${user.name || '(not set)'}`);
    console.log(`   Current Role: ${user.role || '(not set)'}`);
    console.log('');

    // Update the role
    console.log(`🔧 Updating role to: ${role}`);
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({
        role: role,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select();

    if (updateError) {
      console.error('❌ Error updating role:', updateError.message);
      console.error('Details:', updateError);
      process.exit(1);
    }

    console.log('✅ Role updated successfully');
    console.log('');

    // Verify the update
    console.log('🔍 Verifying update...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('id, email, name, role')
      .eq('email', email)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError.message);
      process.exit(1);
    }

    console.log('✅ Verification successful:');
    console.log(`   ID:    ${verifyData.id}`);
    console.log(`   Email: ${verifyData.email}`);
    console.log(`   Name:  ${verifyData.name || '(not set)'}`);
    console.log(`   Role:  ${verifyData.role}`);
    console.log('');
    console.log('✅ User role update completed!');
    console.log('');
    console.log(`The user ${email} can now access the Admin Panel with ${role} privileges.`);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

updateUserRole().catch(console.error);
