/**
 * Detailed investigation script for contacts table
 * First checks schema, then queries data
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
  console.log('🔍 Investigating contacts table in detail...\n');

  try {
    // First, get a sample contact to see what columns exist
    console.log('0️⃣ Checking table schema:');
    const { data: sampleOne, error: schemaError } = await supabase
      .from('contacts')
      .select('*')
      .limit(1)
      .single();

    if (schemaError) {
      console.error('Error getting schema:', schemaError);
      return;
    }

    console.log('   Available columns:', Object.keys(sampleOne).join(', '));
    console.log('   Sample contact:', JSON.stringify(sampleOne, null, 2));
    console.log('');

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
    const { data: allContacts, error: allError } = await supabase
      .from('contacts')
      .select('id, tenant_id, created_at, updated_at');

    if (allError) {
      console.error('Error getting contacts:', allError);
    } else {
      // Group by tenant_id
      const grouped = allContacts.reduce((acc, contact) => {
        const tenantId = contact.tenant_id || 'NULL';
        acc[tenantId] = (acc[tenantId] || 0) + 1;
        return acc;
      }, {});

      console.log('');
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

    // 4. Sample of contacts
    console.log('4️⃣ Sample of 20 most recent contacts:');
    const { data: sampleContacts, error: sampleError } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (sampleError) {
      console.error('Error getting sample:', sampleError);
    } else {
      console.table(sampleContacts.map(c => {
        const result = {
          id: c.id.substring(0, 8) + '...',
          tenant_id: c.tenant_id ? c.tenant_id.substring(0, 8) + '...' : 'NULL',
          created_at: c.created_at?.substring(0, 10) || 'unknown'
        };

        // Add dynamic fields that might exist
        if (c.name) result.name = c.name;
        if (c.first_name) result.first_name = c.first_name;
        if (c.last_name) result.last_name = c.last_name;
        if (c.email) result.email = c.email;
        if (c.phone) result.phone = c.phone;

        return result;
      }));
      console.log('');
    }

    // 5. Check for contacts by creation date ranges
    console.log('5️⃣ Contacts by creation date range:');
    const dates = allContacts
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
      console.log('');
    }

    // 6. Check email field if it exists
    if (sampleOne.email !== undefined) {
      console.log('6️⃣ Checking for duplicate emails:');
      const { data: emailContacts, error: emailError } = await supabase
        .from('contacts')
        .select('id, email, tenant_id');

      if (emailError) {
        console.error('Error getting emails:', emailError);
      } else {
        const emailCounts = emailContacts
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
    }

    // 7. Check if there are "soft deleted" contacts
    if (sampleOne.deleted_at !== undefined || sampleOne.is_deleted !== undefined) {
      console.log('7️⃣ Checking for soft-deleted contacts:');

      let deletedCount = 0;
      if (sampleOne.deleted_at !== undefined) {
        const { count, error } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .not('deleted_at', 'is', null);

        if (!error) {
          deletedCount = count;
          console.log(`   Contacts with deleted_at set: ${count}`);
        }
      }

      if (sampleOne.is_deleted !== undefined) {
        const { count, error } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('is_deleted', true);

        if (!error) {
          deletedCount = count;
          console.log(`   Contacts with is_deleted=true: ${count}`);
        }
      }

      if (deletedCount > 0) {
        console.log(`   ⚠️  ${deletedCount} soft-deleted contacts found!`);
      }
      console.log('');
    }

    // 8. Summary
    console.log('📊 SUMMARY:');
    console.log('─'.repeat(60));
    console.log(`Total contacts in database: ${totalCount}`);
    console.log(`Contacts with NULL tenant_id: ${nullCount}`);
    console.log(`Contacts with tenant_id assigned: ${totalCount - nullCount}`);

    const tenantCounts = allContacts.reduce((acc, contact) => {
      const tenantId = contact.tenant_id;
      if (tenantId) {
        acc[tenantId] = (acc[tenantId] || 0) + 1;
      }
      return acc;
    }, {});

    console.log(`\nContacts by tenant:`);
    Object.entries(tenantCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([tenantId, count]) => {
        console.log(`  ${tenantId}: ${count} contacts`);
      });

    if (totalCount !== 721) {
      console.log(`\n⚠️  Database has ${totalCount} contacts, not 721`);
      if (totalCount < 721) {
        console.log(`   Missing ${721 - totalCount} contacts`);
      } else {
        console.log(`   ${totalCount - 721} more contacts than expected`);
      }
    } else {
      console.log(`\n✅ Total matches expected count of 721`);
    }

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

investigateContacts();
