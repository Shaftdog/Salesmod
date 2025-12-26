/**
 * Diagnostic script to test the public invoice view query
 * Run with: npx tsx scripts/test-invoice-view-query.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const testToken = 'eed62e86198cdf03643215a403d94bf164bac16078efb489da2c4b8a1a7ab6e0';

async function testQuery() {
  console.log('Testing invoice view query...\n');
  console.log('Token:', testToken);
  console.log('URL:', supabaseUrl);
  console.log('Service key exists:', !!supabaseServiceKey);
  console.log('---');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Test 1: Simple query without joins
  console.log('\nTest 1: Simple query without joins');
  const { data: simple, error: simpleError } = await supabase
    .from('invoices')
    .select('*')
    .eq('view_token', testToken)
    .single();

  if (simpleError) {
    console.error('❌ Simple query failed:', simpleError);
  } else {
    console.log('✅ Simple query succeeded');
    console.log('Invoice ID:', simple?.id);
    console.log('Invoice Number:', simple?.invoice_number);
    console.log('Org ID:', simple?.org_id);
  }

  // Test 2: Query with client join
  console.log('\nTest 2: Query with client join');
  const { data: withClient, error: clientError } = await supabase
    .from('invoices')
    .select(`
      *,
      client:clients(*)
    `)
    .eq('view_token', testToken)
    .single();

  if (clientError) {
    console.error('❌ Client join failed:', clientError);
  } else {
    console.log('✅ Client join succeeded');
    console.log('Client:', withClient?.client);
  }

  // Test 3: Query with line_items join
  console.log('\nTest 3: Query with line_items join');
  const { data: withItems, error: itemsError } = await supabase
    .from('invoices')
    .select(`
      *,
      line_items:invoice_line_items(*)
    `)
    .eq('view_token', testToken)
    .single();

  if (itemsError) {
    console.error('❌ Line items join failed:', itemsError);
  } else {
    console.log('✅ Line items join succeeded');
    console.log('Line items count:', withItems?.line_items?.length);
  }

  // Test 4: Query with profiles join (the problematic one)
  console.log('\nTest 4: Query with profiles join');
  const { data: withProfiles, error: profilesError } = await supabase
    .from('invoices')
    .select(`
      *,
      org:profiles(
        id,
        company_name,
        email,
        phone
      )
    `)
    .eq('view_token', testToken)
    .single();

  if (profilesError) {
    console.error('❌ Profiles join failed:', profilesError);
    console.error('Full error:', JSON.stringify(profilesError, null, 2));
  } else {
    console.log('✅ Profiles join succeeded');
    console.log('Org:', withProfiles?.org);
  }

  // Test 5: Full query as in the API
  console.log('\nTest 5: Full query (all joins)');
  const { data: full, error: fullError } = await supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      invoice_date,
      due_date,
      status,
      subtotal,
      tax_amount,
      discount_amount,
      total_amount,
      amount_paid,
      amount_due,
      payment_method,
      notes,
      terms_and_conditions,
      view_count,
      first_viewed_at,
      stripe_payment_link,
      client:clients(
        id,
        company_name,
        email,
        contact_name,
        phone,
        address
      ),
      line_items:invoice_line_items(
        id,
        description,
        quantity,
        unit_price,
        amount,
        tax_rate,
        tax_amount
      ),
      org:profiles(
        id,
        company_name,
        email,
        phone
      )
    `)
    .eq('view_token', testToken)
    .single();

  if (fullError) {
    console.error('❌ Full query failed:', fullError);
    console.error('Full error:', JSON.stringify(fullError, null, 2));
  } else {
    console.log('✅ Full query succeeded');
    console.log('Has client:', !!full?.client);
    console.log('Has line_items:', !!full?.line_items);
    console.log('Has org:', !!full?.org);
  }

  // Test 6: Check if profiles table has the org_id
  if (simple?.org_id) {
    console.log('\nTest 6: Direct profile lookup');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, company_name, email, phone')
      .eq('id', simple.org_id)
      .single();

    if (profileError) {
      console.error('❌ Profile lookup failed:', profileError);
    } else {
      console.log('✅ Profile lookup succeeded');
      console.log('Profile:', profile);
    }
  }
}

testQuery().catch(console.error);
