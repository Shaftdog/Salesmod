#!/usr/bin/env node
/**
 * Update a user's role in the database
 *
 * Usage:
 *   node scripts/update-user-role.js <email> <role>
 *   node scripts/update-user-role.js rod@myroihome.com super_admin
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL not set in .env.local');
  process.exit(1);
}

const args = process.argv.slice(2);
const email = args[0];
const role = args[1] || 'super_admin';

if (!email) {
  console.error('❌ Error: Email address is required');
  console.log('\nUsage:');
  console.log('  node scripts/update-user-role.js <email> <role>');
  console.log('  node scripts/update-user-role.js rod@myroihome.com super_admin');
  process.exit(1);
}

async function updateUserRole() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('📡 Connected to database');
    console.log('');

    // Check if user exists
    console.log(`🔍 Looking for user: ${email}`);
    const checkResult = await client.query(
      'SELECT id, email, name, role FROM public.profiles WHERE email = $1',
      [email]
    );

    if (checkResult.rows.length === 0) {
      console.error(`❌ Error: No user found with email: ${email}`);
      process.exit(1);
    }

    const user = checkResult.rows[0];
    console.log('✅ User found:');
    console.log(`   ID:    ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name:  ${user.name || '(not set)'}`);
    console.log(`   Current Role: ${user.role || '(not set)'}`);
    console.log('');

    // Update the role
    console.log(`🔧 Updating role to: ${role}`);
    await client.query(
      `UPDATE public.profiles
       SET role = $1, updated_at = NOW()
       WHERE email = $2`,
      [role, email]
    );
    console.log('✅ Role updated successfully');
    console.log('');

    // Verify the update
    console.log('🔍 Verifying update...');
    const verifyResult = await client.query(
      'SELECT id, email, name, role FROM public.profiles WHERE email = $1',
      [email]
    );

    const updatedUser = verifyResult.rows[0];
    console.log('✅ Verification successful:');
    console.log(`   ID:    ${updatedUser.id}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Name:  ${updatedUser.name || '(not set)'}`);
    console.log(`   Role:  ${updatedUser.role}`);
    console.log('');
    console.log('✅ User role update completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

updateUserRole().catch(console.error);
