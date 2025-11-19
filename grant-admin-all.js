const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  console.log('\n🔧 Granting admin access to all users...\n');

  const { data: { users } } = await supabase.auth.admin.listUsers();

  for (const user of users) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, org_id')
      .eq('id', user.id)
      .single();

    console.log('Email:', user.email);
    console.log('  Current role:', profile?.role || 'none');
    console.log('  Current org:', profile?.org_id || 'none');

    let updates = {};

    if (profile?.role !== 'admin') {
      updates.role = 'admin';
      console.log('  → Setting role to admin');
    }

    if (!profile?.org_id) {
      const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
      if (orgs && orgs.length > 0) {
        updates.org_id = orgs[0].id;
        console.log('  → Setting org_id to', orgs[0].id);
      }
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from('profiles').update(updates).eq('id', user.id);
      console.log('  ✅ Updated!');
    } else {
      console.log('  ✅ Already configured');
    }
    console.log('');
  }

  console.log('✅ ALL DONE!');
  console.log('   Log out and log back in to access campaigns.\n');
})();
