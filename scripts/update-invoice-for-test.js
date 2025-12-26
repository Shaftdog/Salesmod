/**
 * Update invoice status to draft for testing the edit fix
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateInvoice() {
  console.log('Updating INV-00021 status to draft...');

  const { data, error } = await supabase
    .from('invoices')
    .update({ status: 'draft' })
    .eq('invoice_number', 'INV-00021')
    .select();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('✓ Invoice updated:', data?.[0]?.invoice_number, '- status:', data?.[0]?.status);
}

updateInvoice();
