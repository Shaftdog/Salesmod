import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function main() {
  // Get sample order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .limit(1);

  if (orderError) {
    console.error('Orders error:', orderError);
  } else {
    console.log('Order columns:', Object.keys(order?.[0] || {}));
  }

  // Get sample property
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('*')
    .limit(1);

  if (propError) {
    console.error('Properties error:', propError);
  } else {
    console.log('Property columns:', Object.keys(property?.[0] || {}));
  }

  // Get sample client
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .limit(1);

  if (clientError) {
    console.error('Clients error:', clientError);
  } else {
    console.log('Client columns:', Object.keys(client?.[0] || {}));
  }

  // Get sample invoice
  const { data: invoice, error: invError } = await supabase
    .from('invoices')
    .select('*')
    .limit(1);

  if (invError) {
    console.error('Invoices error:', invError);
  } else {
    console.log('Invoice columns:', Object.keys(invoice?.[0] || {}));
  }
}

main();
