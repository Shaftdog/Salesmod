import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getTestOrg() {
  // Get first org for testing
  const { data: orgs, error: orgError } = await supabase
    .from('clients')
    .select('org_id')
    .limit(1);

  if (orgError || !orgs || orgs.length === 0) {
    console.error('ERROR: No organizations found');
    process.exit(1);
  }

  const orgId = orgs[0].org_id;
  console.log(orgId);
}

getTestOrg();
