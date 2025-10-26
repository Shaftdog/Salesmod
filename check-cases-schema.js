const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length) {
    envVars[key.trim()] = value.join('=').trim().replace(/^[\"']|[\"']$/g, '');
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  // Get total count
  const { count } = await supabase
    .from('cases')
    .select('*', { count: 'exact', head: true });

  console.log('Total cases:', count);

  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else if (data && data.length > 0) {
    console.log('\nCase columns:', Object.keys(data[0]));
    console.log('\nSample case:', JSON.stringify(data[0], null, 2));
  }
}

checkSchema();
