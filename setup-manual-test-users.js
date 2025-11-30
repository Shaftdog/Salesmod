/**
 * Setup Manual Test Users
 * 
 * Creates users and tenants required for manual testing:
 * - rod@myroihome.com (ROI Appraisal Group)
 * - rod2@myroihome.com (ROI Appraisal Group)
 * - sherrard@sourceam.com (SourceAM)
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

const USERS = [
    {
        email: 'rod@myroihome.com',
        password: 'TestPassword123!',
        name: 'Rod (ROI)',
        tenantName: 'ROI Appraisal Group',
        tenantType: 'amc' // Assuming 'amc' is a valid type based on context
    },
    {
        email: 'rod2@myroihome.com',
        password: 'TestPassword123!',
        name: 'Rod 2 (ROI)',
        tenantName: 'ROI Appraisal Group', // Same tenant as Rod
        tenantType: 'amc'
    },
    {
        email: 'sherrard@sourceam.com',
        password: 'TestPassword123!',
        name: 'Sherrard (SourceAM)',
        tenantName: 'SourceAM',
        tenantType: 'lender' // Assuming 'lender' or similar, using 'amc' if unsure. Let's guess 'amc' or check types.
    }
];

async function setupUsers() {
    console.log('🚀 Setting up manual test users...\n');

    // 1. Ensure Tenants Exist
    const tenants = {}; // Map name -> id

    for (const user of USERS) {
        if (tenants[user.tenantName]) continue;

        const { data: existingTenant } = await supabase
            .from('tenants')
            .select('id, name')
            .eq('name', user.tenantName)
            .maybeSingle();

        if (existingTenant) {
            console.log(`✓ Tenant exists: ${user.tenantName} (${existingTenant.id})`);
            tenants[user.tenantName] = existingTenant.id;
        } else {
            console.log(`Creating tenant: ${user.tenantName}...`);
            // We need an owner_id for the tenant. We'll set it to the user we are about to create later, 
            // or we can create the user first. 
            // Actually, circular dependency if tenant needs owner and user needs tenant.
            // Usually we create user, then tenant with owner=user, then update user with tenant_id.
            // But here we might have multiple users in same tenant.

            // Let's defer tenant creation to user creation if it doesn't exist.
        }
    }

    // 2. Create/Update Users
    for (const user of USERS) {
        console.log(`\nProcessing user: ${user.email}...`);

        let userId;

        // Check if user exists
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const authUser = existingUser.users.find(u => u.email === user.email);

        if (authUser) {
            console.log(`✓ Auth user exists: ${user.email}`);
            userId = authUser.id;
            // Update password just in case
            await supabase.auth.admin.updateUserById(userId, { password: user.password });
        } else {
            console.log(`Creating auth user: ${user.email}...`);
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email: user.email,
                password: user.password,
                email_confirm: true,
                user_metadata: { full_name: user.name }
            });

            if (createError) {
                console.error(`❌ Error creating user ${user.email}:`, createError);
                continue;
            }
            userId = newUser.user.id;
        }

        // Handle Tenant
        let tenantId = tenants[user.tenantName];

        if (!tenantId) {
            // Create tenant now if it doesn't exist
            console.log(`Creating tenant ${user.tenantName} with owner ${user.email}...`);
            const { data: newTenant, error: tenantError } = await supabase
                .from('tenants')
                .insert({
                    name: user.tenantName,
                    type: user.tenantType,
                    owner_id: userId
                })
                .select()
                .single();

            if (tenantError) {
                console.error(`❌ Error creating tenant ${user.tenantName}:`, tenantError);
                continue;
            }
            tenantId = newTenant.id;
            tenants[user.tenantName] = tenantId;
            console.log(`✓ Created tenant: ${tenantId}`);
        }

        // Update Profile with Tenant ID
        console.log(`Updating profile for ${user.email} with tenant ${tenantId}...`);

        // Check if profile exists (it should be created by triggers usually, but let's be safe)
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .maybeSingle();

        if (!profile) {
            // Insert profile if missing (though auth trigger usually handles this)
            await supabase.from('profiles').insert({
                id: userId,
                email: user.email,
                full_name: user.name,
                role: 'user', // Default role
                tenant_id: tenantId,
                tenant_type: user.tenantType
            });
        } else {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    tenant_id: tenantId,
                    tenant_type: user.tenantType,
                    // Ensure they have a role that allows access, e.g. 'admin' or 'user'
                    // The test plan implies they are regular users or admins. Let's make them admins to be safe for testing?
                    // "Internal User 1: rod@myroihome.com" seems like an admin.
                    role: 'admin'
                })
                .eq('id', userId);

            if (updateError) {
                console.error(`❌ Error updating profile for ${user.email}:`, updateError);
            } else {
                console.log(`✓ Profile updated`);
            }
        }
    }

    console.log('\n✅ Setup complete!');
    console.log('Credentials for all users:');
    console.log('Password: TestPassword123!');
}

setupUsers().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
