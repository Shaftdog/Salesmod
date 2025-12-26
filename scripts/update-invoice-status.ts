// Script to update invoice status for testing purposes
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateInvoiceStatus() {
  console.log('Updating invoice status...');

  const { data, error } = await supabase
    .from('invoices')
    .update({ status: 'draft' })
    .eq('invoice_number', 'INV-00021')
    .select();

  if (error) {
    console.error('Error updating invoice:', error);
    process.exit(1);
  }

  console.log('✓ Invoice updated successfully:', data);

  // Verify
  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('invoice_number, status, total_amount, order_id')
    .eq('invoice_number', 'INV-00021')
    .single();

  if (fetchError) {
    console.error('Error fetching invoice:', fetchError);
    process.exit(1);
  }

  console.log('✓ Current invoice state:', invoice);
}

updateInvoiceStatus();
