/**
 * Check Test Invoices
 * Verify the test invoices were created and check their org_id
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkInvoices() {
  console.log('🔍 Checking test invoices...\n');

  // Check invoices with TEST-INV prefix
  const { data: invoices, error, count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact' })
    .ilike('invoice_number', 'TEST-INV-%')
    .order('invoice_number');

  if (error) {
    console.error('❌ Error fetching invoices:', error);
    return;
  }

  console.log(`✅ Found ${count} test invoices\n`);

  if (invoices && invoices.length > 0) {
    console.log('First 5 invoices:');
    invoices.slice(0, 5).forEach((inv: any) => {
      console.log(`  ${inv.invoice_number}: org_id=${inv.org_id}, tenant_id=${inv.tenant_id}, status=${inv.status}`);
    });

    console.log(`\n📊 All test invoices use org_id: ${invoices[0].org_id}`);
    console.log(`📊 All test invoices use tenant_id: ${invoices[0].tenant_id}`);
  }

  // Check rod@myroihome.com user
  const { data: user } = await supabase
    .from('profiles')
    .select('id, email, tenant_id')
    .eq('email', 'rod@myroihome.com')
    .single();

  if (user) {
    console.log(`\n👤 Rod's profile:`);
    console.log(`   ID (org_id): ${user.id}`);
    console.log(`   Tenant ID: ${user.tenant_id}`);

    const match = invoices && invoices.length > 0 && invoices[0].org_id === user.id;
    console.log(`\n${match ? '✅' : '❌'} Invoices org_id matches Rod's profile ID: ${match}`);
  }
}

checkInvoices()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
