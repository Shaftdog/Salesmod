/**
 * Check clients table schema and relationship to contacts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('Checking clients table structure...\n');

  // Get a sample client
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .limit(1)
    .single();

  console.log('Sample client record:');
  console.log(JSON.stringify(client, null, 2));

  // Check if clients have org_id
  const hasOrgId = client && 'org_id' in client;
  console.log(`\nClients table has org_id: ${hasOrgId}`);

  if (hasOrgId) {
    console.log(`org_id value: ${client.org_id}`);
  }

  // Check relationship: contact -> client -> org
  const { data: contactWithClient } = await supabase
    .from('contacts')
    .select(`
      id,
      email,
      client_id,
      clients (
        id,
        name,
        org_id
      )
    `)
    .not('client_id', 'is', null)
    .limit(1)
    .single();

  console.log('\nContact with client relationship:');
  console.log(JSON.stringify(contactWithClient, null, 2));
}

main().catch(console.error);
