/**
 * Reset Password for rod@myroihome.com
 * Updates password to Latter!974
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

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

async function resetPassword() {
    const email = 'rod@myroihome.com';
    const newPassword = 'Blaisenpals1!';

    console.log(`\n🔐 Resetting password for: ${email}\n`);

    // Find user
    const { data: allUsers } = await supabase.auth.admin.listUsers();
    const authUser = allUsers.users.find(u => u.email === email);

    if (!authUser) {
        console.log('❌ User NOT found');
        return;
    }

    console.log(`✅ Found user: ${authUser.id}`);

    // Update password
    const { data, error } = await supabase.auth.admin.updateUserById(
        authUser.id,
        { password: newPassword }
    );

    if (error) {
        console.error('❌ Error updating password:', error);
        return;
    }

    console.log('✅ Password updated successfully!');
    console.log('\n📋 Login credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${newPassword}`);
    console.log('\nYou can now log in with these credentials.\n');
}

resetPassword().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
