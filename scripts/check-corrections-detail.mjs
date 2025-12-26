import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCorrectionsDetail() {
  // Get the case CASE-2025-0003 (Issue with Order APR-2025-1010)
  const { data: caseData, error: caseError } = await supabase
    .from('cases')
    .select('id, case_number')
    .eq('case_number', 'CASE-2025-0003')
    .single();

  if (caseError) {
    console.error('Case error:', caseError);
    return;
  }

  console.log('Case:', caseData.case_number, 'ID:', caseData.id);

  // Now query corrections with the same query the hook uses
  const { data: corrections, error } = await supabase
    .from('correction_requests')
    .select(`
      *,
      production_card:production_cards!correction_requests_production_card_id_fkey(
        id,
        order_id,
        current_stage,
        order:orders(
          order_number,
          property_address
        )
      ),
      case:cases(
        id,
        case_number,
        subject
      )
    `)
    .eq('case_id', caseData.id);

  if (error) {
    console.error('Corrections error:', error);
    return;
  }

  console.log('\nCorrections found:', corrections.length);
  corrections.forEach((c, i) => {
    console.log(`\n[${i + 1}] Correction ID: ${c.id}`);
    console.log(`  request_type: ${c.request_type}`);
    console.log(`  production_card_id: ${c.production_card_id}`);
    console.log(`  production_card (fetched):`, c.production_card);
  });
}

checkCorrectionsDetail();
