/**
 * Check contacts table schema
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
  // Check full contact record
  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('email', 'office@avappraisalmgmt.com')
    .single();

  console.log('Full contact record:');
  console.log(JSON.stringify(contact, null, 2));

  // Check all contacts for this org
  const { data: allContacts } = await supabase
    .from('contacts')
    .select('*')
    .limit(5);

  console.log('\nAll contacts (first 5):');
  allContacts?.forEach(c => {
    console.log(JSON.stringify(c, null, 2));
  });
}

main().catch(console.error);
