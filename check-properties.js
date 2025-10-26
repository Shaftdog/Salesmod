const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read env vars from file
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length) {
    envVars[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function checkProperties() {
  // Get total count
  const { count, error: countError } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true });

  console.log('Total properties:', count);

  // Get properties with client info
  const { data: properties, error } = await supabase
    .from('properties')
    .select(`
      id,
      address,
      city,
      state,
      zip_code,
      property_type,
      client_id,
      client:clients!properties_client_id_fkey(company_name)
    `)
    .limit(10);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`\nFound ${properties?.length || 0} properties:`);
    if (properties && properties.length > 0) {
      properties.forEach(p => {
        console.log(`- ${p.address}, ${p.city}, ${p.state} - ${p.client?.company_name || 'No client'}`);
      });
    }
  }

  // Check properties with null client_id
  const { count: nullCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .is('client_id', null);

  console.log(`\nProperties with null client_id: ${nullCount}`);
}

checkProperties();