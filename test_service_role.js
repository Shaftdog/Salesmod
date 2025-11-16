// Test if service role client can query contacts
// Run with: node test_service_role.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables!');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✓' : '✗');
  process.exit(1);
}

console.log('✅ Environment variables found');
console.log('   URL:', supabaseUrl);
console.log('   Service Role Key:', serviceRoleKey.substring(0, 20) + '...');

// Create service role client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('\n' + '='.repeat(70));
console.log('TESTING SERVICE ROLE CLIENT');
console.log('='.repeat(70));

async function testQuery() {
  try {
    // Test 1: Simple contact query
    console.log('\n1️⃣  Test simple contact query...');
    const { data: test1, error: error1 } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email')
      .not('email', 'is', null)
      .limit(5);
    
    if (error1) {
      console.error('   ❌ Error:', error1);
    } else {
      console.log(`   ✅ Success! Found ${test1.length} contacts`);
    }
    
    // Test 2: Join with clients (FIXED: specify relationship)
    console.log('\n2️⃣  Test join with clients...');
    const { data: test2, error: error2 } = await supabase
      .from('contacts')
      .select(`
        id,
        first_name,
        last_name,
        email,
        client_id,
        clients!contacts_client_id_fkey!inner(
          id,
          company_name,
          client_type,
          primary_role_code,
          is_active
        )
      `)
      .not('email', 'is', null)
      .limit(5);
    
    if (error2) {
      console.error('   ❌ Error:', error2);
    } else {
      console.log(`   ✅ Success! Found ${test2.length} contacts with client data`);
      if (test2.length > 0) {
        console.log(`      Sample: ${test2[0].first_name} ${test2[0].last_name} (${test2[0].clients.company_name})`);
      }
    }
    
    // Test 3: Filter by primary_role_code (FIXED: specify relationship)
    console.log('\n3️⃣  Test filter by primary_role_code...');
    const { data: test3, error: error3 } = await supabase
      .from('contacts')
      .select(`
        id,
        first_name,
        last_name,
        email,
        client_id,
        clients!contacts_client_id_fkey!inner(
          id,
          company_name,
          client_type,
          primary_role_code,
          is_active
        )
      `)
      .not('email', 'is', null)
      .eq('clients!contacts_client_id_fkey.primary_role_code', 'amc_contact')
      .eq('clients!contacts_client_id_fkey.is_active', true)
      .limit(10);
    
    if (error3) {
      console.error('   ❌ Error:', error3.message);
      console.error('   Code:', error3.code);
      console.error('   Details:', error3.details);
      console.error('   Hint:', error3.hint);
    } else {
      console.log(`   ✅ Success! Found ${test3.length} AMC contacts`);
      if (test3.length > 0) {
        console.log('\n   Sample contacts:');
        test3.slice(0, 3).forEach((c, i) => {
          console.log(`     ${i+1}. ${c.first_name} ${c.last_name} (${c.email})`);
          console.log(`        Company: ${c.clients.company_name}`);
        });
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('TEST COMPLETE');
    console.log('='.repeat(70));
    
    if (!error1 && !error2 && !error3 && test3.length > 0) {
      console.log('\n✅ ALL TESTS PASSED!');
      console.log('   Service role client can query contacts successfully.');
      console.log('   The issue must be in the TypeScript code not being loaded.');
    } else {
      console.log('\n❌ TESTS FAILED!');
      console.log('   Service role client cannot query contacts properly.');
    }
    
  } catch (err) {
    console.error('\n❌ Exception:', err);
  }
}

testQuery().then(() => process.exit(0));

