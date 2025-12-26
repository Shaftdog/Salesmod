import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const orderId = 'f45aa447-61c3-49da-9338-f5c56cbd73ff';
  const tenantId = 'da0563f7-7d29-4c02-b835-422f31c82b7b';

  console.log('Testing order query...');
  console.log(`Order ID: ${orderId}`);
  console.log(`Tenant ID: ${tenantId}\n`);

  // Try the same query the order processor uses
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      clients!orders_client_id_fkey(
        id,
        company_name,
        credit_limit,
        payment_terms,
        is_active
      )
    `)
    .eq('id', orderId)
    .eq('tenant_id', tenantId)
    .single();

  if (orderError) {
    console.error('Error fetching order:', orderError);
  } else {
    console.log('Order found:');
    console.log('- Order number:', order.order_number);
    console.log('- Status:', order.status);
    console.log('- Property:', order.property_address);
    console.log('- Client ID:', order.client_id);
    console.log('- Client data:', order.clients);
  }
}

main();
