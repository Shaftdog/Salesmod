import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCorrections() {
  // Get all cases
  const { data: cases, error: casesError } = await supabase
    .from('cases')
    .select('id, case_number, subject, order_id')
    .limit(10);

  if (casesError) {
    console.error('Cases error:', casesError);
    return;
  }

  console.log('Cases found:', cases.length);

  // Check for corrections linked to these cases
  for (const c of cases) {
    const { data: corrections, error } = await supabase
      .from('correction_requests')
      .select('id, case_id, production_card_id, request_type')
      .eq('case_id', c.id);

    console.log(`\nCase ${c.case_number}: "${c.subject}"`);
    console.log(`  Order ID: ${c.order_id}`);
    const count = corrections ? corrections.length : 0;
    console.log(`  Corrections linked: ${count}`);
    if (count > 0) {
      corrections.forEach(cr => {
        console.log(`    - ${cr.request_type}: production_card_id=${cr.production_card_id}`);
      });
    }
  }
}

checkCorrections();
