const { createClient } = require('@supabase/supabase-js');

// Read env vars from file
const fs = require('fs');
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

async function checkIFundContacts() {
  // Get iFund Cities client
  const { data: client } = await supabase
    .from('clients')
    .select('id, company_name')
    .ilike('company_name', '%fund cities%')
    .single();

  console.log('iFund Cities client:', client);

  if (client) {
    // Get contacts for this client
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('client_id', client.id);

    console.log(`\nFound ${contacts?.length || 0} contacts for iFund Cities:`);
    if (contacts && contacts.length > 0) {
      contacts.forEach(c => {
        console.log(`- ${c.first_name} ${c.last_name} (${c.email || 'no email'})`);
      });
    }
  }
}

checkIFundContacts();