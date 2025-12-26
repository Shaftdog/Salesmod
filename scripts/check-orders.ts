import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data, error } = await supabase
    .from('orders')
    .select('id, tenant_id, order_number, status, property_address, fee_amount, total_amount')
    .limit(5);

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log('Available orders:');
  console.log(JSON.stringify(data, null, 2));
}

main();
