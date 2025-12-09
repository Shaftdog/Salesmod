/**
 * Comprehensive contacts analysis report
 * Uses Supabase client to bypass RLS and analyze all data
 */

const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL;

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

async function generateReport() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('           CONTACTS TABLE ANALYSIS REPORT');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Generated: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Get all contacts
    const { data: allContacts, error: allError } = await supabase
      .from('contacts')
      .select('*');

    if (allError) {
      console.error('❌ Error fetching contacts:', allError);
      return;
    }

    console.log('📊 OVERVIEW');
    console.log('───────────────────────────────────────────────────────────');
    console.log(`Total contacts: ${allContacts.length}`);

    // Tenant distribution
    const tenantMap = new Map();
    const nullTenantContacts = [];

    allContacts.forEach(contact => {
      if (!contact.tenant_id) {
        nullTenantContacts.push(contact);
      } else {
        tenantMap.set(contact.tenant_id, (tenantMap.get(contact.tenant_id) || 0) + 1);
      }
    });

    console.log(`Contacts with tenant_id: ${allContacts.length - nullTenantContacts.length}`);
    console.log(`Contacts without tenant_id: ${nullTenantContacts.length}`);

    if (nullTenantContacts.length > 0) {
      console.log('\n⚠️  WARNING: Found contacts without tenant_id:');
      nullTenantContacts.forEach(contact => {
        console.log(`   - ID: ${contact.id.substring(0, 8)}... | Name: ${contact.first_name} ${contact.last_name} | Email: ${contact.email || '(none)'}`);
      });
    }

    console.log('\n\n📈 TENANT DISTRIBUTION');
    console.log('───────────────────────────────────────────────────────────');

    const tenantArray = Array.from(tenantMap.entries())
      .sort((a, b) => b[1] - a[1]);

    tenantArray.forEach(([tenantId, count], index) => {
      const percentage = ((count / allContacts.length) * 100).toFixed(1);
      console.log(`${index + 1}. Tenant: ${tenantId}`);
      console.log(`   Contacts: ${count} (${percentage}%)`);
    });

    // Date analysis
    console.log('\n\n📅 TEMPORAL ANALYSIS');
    console.log('───────────────────────────────────────────────────────────');

    const dates = allContacts
      .map(c => c.created_at)
      .filter(Boolean)
      .sort();

    if (dates.length > 0) {
      console.log(`Oldest contact: ${dates[0]}`);
      console.log(`Newest contact: ${dates[dates.length - 1]}`);

      // Group by month
      const byMonth = {};
      dates.forEach(date => {
        const month = date.substring(0, 7);
        byMonth[month] = (byMonth[month] || 0) + 1;
      });

      console.log('\nContacts created by month:');
      Object.entries(byMonth)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([month, count]) => {
          const bar = '█'.repeat(Math.ceil(count / 10));
          console.log(`${month}: ${count.toString().padStart(4)} ${bar}`);
        });
    }

    // Email analysis
    console.log('\n\n📧 EMAIL ANALYSIS');
    console.log('───────────────────────────────────────────────────────────');

    const withEmail = allContacts.filter(c => c.email && c.email.trim() !== '');
    const withoutEmail = allContacts.filter(c => !c.email || c.email.trim() === '');

    console.log(`Contacts with email: ${withEmail.length}`);
    console.log(`Contacts without email: ${withoutEmail.length}`);

    // Email duplicates
    const emailMap = {};
    withEmail.forEach(contact => {
      if (!emailMap[contact.email]) {
        emailMap[contact.email] = [];
      }
      emailMap[contact.email].push(contact);
    });

    const duplicates = Object.entries(emailMap)
      .filter(([email, contacts]) => contacts.length > 1)
      .sort((a, b) => b[1].length - a[1].length);

    if (duplicates.length > 0) {
      console.log(`\n⚠️  Duplicate emails found: ${duplicates.length}`);
      console.log('\nTop duplicates:');
      duplicates.slice(0, 5).forEach(([email, contacts]) => {
        const tenantIds = [...new Set(contacts.map(c => c.tenant_id || 'NULL'))];
        console.log(`   ${email}: ${contacts.length} contacts`);
        console.log(`      Across ${tenantIds.length} tenant(s): ${tenantIds.map(t => t.substring(0, 8) + '...').join(', ')}`);
      });
    } else {
      console.log('\n✅ No duplicate emails found');
    }

    // Email domain analysis
    const domainMap = {};
    withEmail.forEach(contact => {
      const domain = contact.email.split('@')[1];
      if (domain) {
        domainMap[domain] = (domainMap[domain] || 0) + 1;
      }
    });

    const topDomains = Object.entries(domainMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    console.log('\nTop 10 email domains:');
    topDomains.forEach(([domain, count], index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${domain.padEnd(30)} ${count} contacts`);
    });

    // Client association
    console.log('\n\n🏢 CLIENT ASSOCIATION');
    console.log('───────────────────────────────────────────────────────────');

    const withClient = allContacts.filter(c => c.client_id);
    const withoutClient = allContacts.filter(c => !c.client_id);

    console.log(`Contacts linked to client: ${withClient.length}`);
    console.log(`Contacts without client: ${withoutClient.length}`);

    // Organization association
    if (allContacts[0]?.org_id !== undefined) {
      const withOrg = allContacts.filter(c => c.org_id);
      const withoutOrg = allContacts.filter(c => !c.org_id);

      console.log(`Contacts linked to organization: ${withOrg.length}`);
      console.log(`Contacts without organization: ${withoutOrg.length}`);
    }

    // Check for test/bounce contacts
    console.log('\n\n🧪 TEST DATA DETECTION');
    console.log('───────────────────────────────────────────────────────────');

    const testContacts = allContacts.filter(c => {
      const email = (c.email || '').toLowerCase();
      const firstName = (c.first_name || '').toLowerCase();
      const lastName = (c.last_name || '').toLowerCase();

      return email.includes('test') ||
             email.includes('bounce') ||
             email.includes('example.com') ||
             firstName.includes('test') ||
             firstName.includes('bounce') ||
             lastName.includes('test') ||
             lastName.includes('bounce');
    });

    if (testContacts.length > 0) {
      console.log(`⚠️  Found ${testContacts.length} potential test/bounce contacts:`);
      testContacts.forEach(contact => {
        console.log(`   - ${contact.first_name} ${contact.last_name} <${contact.email}>`);
      });
    } else {
      console.log('✅ No obvious test contacts found');
    }

    // RLS Policy check via PostgreSQL
    console.log('\n\n🔒 RLS POLICY CHECK');
    console.log('───────────────────────────────────────────────────────────');

    if (databaseUrl) {
      try {
        const pgClient = new Client({ connectionString: databaseUrl });
        await pgClient.connect();

        const rlsCheck = await pgClient.query(`
          SELECT relrowsecurity
          FROM pg_class
          WHERE relname = 'contacts'
            AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
        `);

        if (rlsCheck.rows.length > 0) {
          console.log(`RLS enabled: ${rlsCheck.rows[0].relrowsecurity ? 'YES ✓' : 'NO'}`);
        }

        const policies = await pgClient.query(`
          SELECT policyname, cmd, roles::text[], qual, with_check
          FROM pg_policies
          WHERE tablename = 'contacts'
          ORDER BY policyname;
        `);

        if (policies.rows.length > 0) {
          console.log(`\nActive policies: ${policies.rows.length}`);
          policies.rows.forEach(policy => {
            console.log(`\n   Policy: ${policy.policyname}`);
            console.log(`   Command: ${policy.cmd}`);
            console.log(`   Roles: ${policy.roles.join(', ')}`);
            if (policy.qual) {
              console.log(`   Using: ${policy.qual.substring(0, 80)}...`);
            }
          });
        } else {
          console.log('No RLS policies found');
        }

        await pgClient.end();
      } catch (pgError) {
        console.log('Could not check RLS policies (using pooler connection)');
        console.log('This is normal - RLS policies can only be checked via direct connection');
      }
    }

    // Summary and recommendations
    console.log('\n\n✅ SUMMARY & RECOMMENDATIONS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\n1. Total contacts: ${allContacts.length}`);
    console.log(`   - With tenant_id: ${allContacts.length - nullTenantContacts.length}`);
    console.log(`   - Without tenant_id: ${nullTenantContacts.length}`);

    if (nullTenantContacts.length > 0) {
      console.log('\n   ⚠️  ACTION REQUIRED: Assign tenant_id to contacts without one');
    }

    console.log(`\n2. Data distribution:`);
    console.log(`   - ${tenantArray.length} unique tenant(s)`);
    console.log(`   - Primary tenant has ${tenantArray[0][1]} contacts (${((tenantArray[0][1] / allContacts.length) * 100).toFixed(1)}%)`);

    if (withoutEmail.length > 0) {
      console.log(`\n3. Email completeness:`);
      console.log(`   - ${withoutEmail.length} contacts without email`);
      console.log(`   ⚠️  Consider adding emails for better communication`);
    }

    if (duplicates.length > 0) {
      console.log(`\n4. Duplicate detection:`);
      console.log(`   - ${duplicates.length} duplicate emails found`);
      console.log(`   ⚠️  Review and merge duplicate contacts`);
    }

    if (testContacts.length > 0) {
      console.log(`\n5. Test data:`);
      console.log(`   - ${testContacts.length} test/bounce contacts detected`);
      console.log(`   ℹ️  Consider removing test data from production`);
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('                    END OF REPORT');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

generateReport();
