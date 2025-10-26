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

async function getColumns() {
  // Query information schema for cases table columns
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'cases'
      ORDER BY ordinal_position;
    `
  });

  if (error) {
    console.error('Error:', error);
    console.log('\nTrying alternate method...');

    // Try selecting with limit 0 to get structure
    const { data: emptyData, error: emptyError } = await supabase
      .from('cases')
      .select('*')
      .limit(0);

    console.log('Empty query error:', emptyError);
  } else {
    console.log('Cases table columns:');
    console.log(data);
  }
}

getColumns();
