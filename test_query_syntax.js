// Test correct Supabase query syntax for multiple relationships
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local
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

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function test() {
  console.log('Testing filter syntax...\n');
  
  // Test with relationship specified, but filter using simple alias
  const { data, error } = await supabase
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
    .eq('clients.primary_role_code', 'amc_contact')  // Use simple alias
    .eq('clients.is_active', true)                     // Use simple alias
    .limit(10);
  
  if (error) {
    console.error('❌ Error:', error.message);
    console.error('   Code:', error.code);
    return;
  }
  
  console.log(`✅ SUCCESS! Found ${data.length} AMC contacts`);
  console.log('\nSample contacts:');
  data.slice(0, 3).forEach((c, i) => {
    console.log(`  ${i+1}. ${c.first_name} ${c.last_name} (${c.email})`);
    console.log(`     Company: ${c.clients.company_name}`);
  });
}

test().then(() => process.exit(0));



