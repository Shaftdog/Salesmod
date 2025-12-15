/**
 * Investigation script for contacts table
 * Checks total counts, tenant_id distribution, and RLS policies
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Use service role to bypass RLS
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function investigateContacts() {
  console.log('🔍 Investigating contacts table...\n');

  try {
    // 1. Total count of all contacts
    console.log('1️⃣ Total count of all contacts (bypassing RLS):');
    const { count: totalCount, error: totalError } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('Error getting total count:', totalError);
    } else {
      console.log(`   Total contacts: ${totalCount}\n`);
    }

    // 2. Count by tenant_id
    console.log('2️⃣ Contacts grouped by tenant_id:');
    const { data: tenantCounts, error: tenantError } = await supabase
      .from('contacts')
      .select('tenant_id');

    if (tenantError) {
      console.error('Error getting tenant counts:', tenantError);
    } else {
      // Group by tenant_id
      const grouped = tenantCounts.reduce((acc, contact) => {
        const tenantId = contact.tenant_id || 'NULL';
        acc[tenantId] = (acc[tenantId] || 0) + 1;
        return acc;
      }, {});

      Object.entries(grouped)
        .sort((a, b) => b[1] - a[1])
        .forEach(([tenantId, count]) => {
          console.log(`   ${tenantId}: ${count} contacts`);
        });
      console.log('');
    }

    // 3. Count where tenant_id IS NULL
    console.log('3️⃣ Contacts with NULL tenant_id:');
    const { count: nullCount, error: nullError } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .is('tenant_id', null);

    if (nullError) {
      console.error('Error getting null count:', nullError);
    } else {
      console.log(`   Contacts with NULL tenant_id: ${nullCount}\n`);
    }

    // 4. Sample of contacts with their tenant_id values
    console.log('4️⃣ Sample of 20 contacts:');
    const { data: sampleContacts, error: sampleError } = await supabase
      .from('contacts')
      .select('id, name, email, tenant_id, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (sampleError) {
      console.error('Error getting sample:', sampleError);
    } else {
      console.table(sampleContacts.map(c => ({
        id: c.id.substring(0, 8) + '...',
        name: c.name || '(no name)',
        email: c.email || '(no email)',
        tenant_id: c.tenant_id ? c.tenant_id.substring(0, 8) + '...' : 'NULL',
        created_at: c.created_at?.substring(0, 10) || 'unknown'
      })));
      console.log('');
    }

    // 5. Check RLS policies using raw SQL
    console.log('5️⃣ RLS Policies on contacts table:');
    const { data: policies, error: policyError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies
        WHERE tablename = 'contacts'
        ORDER BY policyname;
      `
    }).single();

    // If RPC doesn't exist, try direct query
    if (policyError && policyError.message.includes('does not exist')) {
      console.log('   Note: Cannot query RLS policies directly via RPC');
      console.log('   Attempting alternative method...\n');

      // Try to infer RLS status from table info
      const { data: tableInfo, error: tableError } = await supabase
        .from('contacts')
        .select('id')
        .limit(1);

      if (tableError) {
        console.log('   Error querying table:', tableError.message);
      } else {
        console.log('   ✅ Table is accessible via service role key');
        console.log('   RLS is bypassed when using service role key\n');
      }
    } else if (policyError) {
      console.error('   Error getting policies:', policyError);
    } else {
      console.table(policies);
    }

    // 6. Check for contacts by creation date ranges
    console.log('6️⃣ Contacts by creation date range:');
    const { data: dateRanges, error: dateError } = await supabase
      .from('contacts')
      .select('created_at');

    if (dateError) {
      console.error('Error getting date ranges:', dateError);
    } else {
      const dates = dateRanges
        .map(c => c.created_at)
        .filter(Boolean)
        .sort();

      if (dates.length > 0) {
        console.log(`   Oldest contact: ${dates[0]}`);
        console.log(`   Newest contact: ${dates[dates.length - 1]}`);

        // Group by year-month
        const byMonth = dates.reduce((acc, date) => {
          const month = date.substring(0, 7); // YYYY-MM
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        }, {});

        console.log('\n   Contacts by month:');
        Object.entries(byMonth)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .forEach(([month, count]) => {
            console.log(`   ${month}: ${count} contacts`);
          });
      }
      console.log('');
    }

    // 7. Check for duplicate contacts
    console.log('7️⃣ Checking for duplicate emails:');
    const { data: allContacts, error: allError } = await supabase
      .from('contacts')
      .select('id, email, tenant_id');

    if (allError) {
      console.error('Error getting all contacts:', allError);
    } else {
      const emailCounts = allContacts
        .filter(c => c.email)
        .reduce((acc, contact) => {
          acc[contact.email] = acc[contact.email] || [];
          acc[contact.email].push(contact);
          return acc;
        }, {});

      const duplicates = Object.entries(emailCounts)
        .filter(([email, contacts]) => contacts.length > 1)
        .sort((a, b) => b[1].length - a[1].length);

      if (duplicates.length > 0) {
        console.log(`   Found ${duplicates.length} duplicate emails:`);
        duplicates.slice(0, 10).forEach(([email, contacts]) => {
          const tenantIds = [...new Set(contacts.map(c => c.tenant_id || 'NULL'))];
          console.log(`   ${email}: ${contacts.length} contacts across ${tenantIds.length} tenant(s)`);
        });
        if (duplicates.length > 10) {
          console.log(`   ... and ${duplicates.length - 10} more`);
        }
      } else {
        console.log('   No duplicate emails found');
      }
      console.log('');
    }

    // 8. Summary
    console.log('📊 SUMMARY:');
    console.log('─'.repeat(60));
    console.log(`Total contacts in database: ${totalCount}`);
    console.log(`Contacts with NULL tenant_id: ${nullCount}`);
    console.log(`Contacts with tenant_id assigned: ${totalCount - nullCount}`);

    if (totalCount !== 721) {
      console.log(`\n⚠️  Database has ${totalCount} contacts, not 721`);
      if (totalCount < 721) {
        console.log(`   Missing ${721 - totalCount} contacts`);
      } else {
        console.log(`   ${totalCount - 721} more contacts than expected`);
      }
    }

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

investigateContacts();
