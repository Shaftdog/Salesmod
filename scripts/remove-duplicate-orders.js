/**
 * Script to safely remove duplicate orders and their invoices
 * Created from CSV import that produced duplicates
 *
 * SAFETY: This script identifies duplicates by order_number AND status='pending'
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Please set:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// List of duplicate order numbers to remove (batch 2 - confirmed duplicates)
const DUPLICATE_ORDER_NUMBERS = [
  'ORD-2512-0761',  // 1843 Bramblewood Dr - duplicate of 1211809193091194
  'ORD-2512-3817',  // 1043 Blue Heron Dr - duplicate of 1211843970166591
  'ORD-2512-9500',  // 15 Santa Clara St - duplicate of 1211775334272280
  'ORD-2512-1401',  // 15855 99th Ct N - duplicate of 1211784053703230
  'ORD-2512-5401',  // 1793 Crystal Grove Dr - duplicate of 1211917760048334
  'ORD-2512-2356',  // 2212 Fernwood St - duplicate of 1211805903895315
  'ORD-2512-2897',  // 267 Cranbrook Dr - duplicate of 1211843896663966
  'ORD-2512-4233',  // 3189 Barbados Ct - duplicate of ORD-202512-1012
  'ORD-2512-1422',  // 3309 Newmark Dr - duplicate of 1211806357853760
  'ORD-2512-3301',  // 402 Prospect Ave - duplicate of 1211784251359855
  'ORD-2512-0279',  // 2115 Alexis Ct - duplicate of 1211903766318641
];

async function verifyDuplicates() {
  console.log('=== VERIFICATION PHASE ===\n');
  console.log('Looking for orders with these order numbers AND status=pending:\n');

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      property_address,
      client_id,
      fee_amount,
      created_at,
      clients(company_name)
    `)
    .in('order_number', DUPLICATE_ORDER_NUMBERS);

  if (error) {
    console.error('Error fetching orders:', error.message);
    process.exit(1);
  }

  console.log(`Found ${orders.length} orders matching these order numbers:\n`);

  // Separate pending from non-pending
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const nonPendingOrders = orders.filter(o => o.status !== 'pending');

  console.log('--- PENDING ORDERS (will be deleted) ---');
  for (const order of pendingOrders) {
    console.log(`  ${order.order_number}`);
    console.log(`    ID: ${order.id}`);
    console.log(`    Address: ${order.property_address}`);
    console.log(`    Client: ${order.clients?.company_name || 'Unknown'}`);
    console.log(`    Fee: $${order.fee_amount}`);
    console.log(`    Created: ${order.created_at}`);
    console.log('');
  }

  if (nonPendingOrders.length > 0) {
    console.log('\n--- NON-PENDING ORDERS (will NOT be deleted) ---');
    for (const order of nonPendingOrders) {
      console.log(`  ${order.order_number} (status: ${order.status}) - SKIPPED`);
    }
  }

  // Check for invoices linked to these pending orders
  const pendingOrderIds = pendingOrders.map(o => o.id);

  if (pendingOrderIds.length > 0) {
    const { data: invoices, error: invError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        order_id,
        status,
        total_amount,
        amount_paid
      `)
      .in('order_id', pendingOrderIds);

    if (invError) {
      console.error('Error fetching invoices:', invError.message);
    } else {
      console.log(`\n--- INVOICES LINKED TO PENDING ORDERS (${invoices.length} found) ---`);
      for (const inv of invoices) {
        const order = pendingOrders.find(o => o.id === inv.order_id);
        console.log(`  ${inv.invoice_number}`);
        console.log(`    ID: ${inv.id}`);
        console.log(`    Order: ${order?.order_number}`);
        console.log(`    Status: ${inv.status}`);
        console.log(`    Total: $${inv.total_amount}`);
        console.log(`    Paid: $${inv.amount_paid}`);
        console.log('');
      }

      // Check for invoice line items
      const invoiceIds = invoices.map(i => i.id);
      if (invoiceIds.length > 0) {
        const { data: lineItems } = await supabase
          .from('invoice_line_items')
          .select('id, invoice_id')
          .in('invoice_id', invoiceIds);

        console.log(`Found ${lineItems?.length || 0} invoice line items to delete.`);
      }
    }
  }

  return pendingOrders;
}

async function deleteDuplicates(pendingOrders) {
  console.log('\n=== DELETION PHASE ===\n');

  if (pendingOrders.length === 0) {
    console.log('No pending orders to delete.');
    return;
  }

  const pendingOrderIds = pendingOrders.map(o => o.id);

  // 1. Get invoices for these orders
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id')
    .in('order_id', pendingOrderIds);

  const invoiceIds = invoices?.map(i => i.id) || [];

  // 2. Delete invoice line items first (foreign key constraint)
  if (invoiceIds.length > 0) {
    console.log(`Deleting invoice line items for ${invoiceIds.length} invoices...`);
    const { error: lineError, count: lineCount } = await supabase
      .from('invoice_line_items')
      .delete({ count: 'exact' })
      .in('invoice_id', invoiceIds);

    if (lineError) {
      console.error('Error deleting invoice line items:', lineError.message);
      process.exit(1);
    }
    console.log(`  Deleted ${lineCount || 0} invoice line items.`);
  }

  // 3. Delete invoices
  if (invoiceIds.length > 0) {
    console.log(`Deleting ${invoiceIds.length} invoices...`);
    const { error: invError, count: invCount } = await supabase
      .from('invoices')
      .delete({ count: 'exact' })
      .in('id', invoiceIds);

    if (invError) {
      console.error('Error deleting invoices:', invError.message);
      process.exit(1);
    }
    console.log(`  Deleted ${invCount || 0} invoices.`);
  }

  // 4. Delete orders
  console.log(`Deleting ${pendingOrderIds.length} orders...`);
  const { error: orderError, count: orderCount } = await supabase
    .from('orders')
    .delete({ count: 'exact' })
    .in('id', pendingOrderIds);

  if (orderError) {
    console.error('Error deleting orders:', orderError.message);
    process.exit(1);
  }
  console.log(`  Deleted ${orderCount || 0} orders.`);

  console.log('\n=== DELETION COMPLETE ===');
  console.log(`Summary:`);
  console.log(`  Orders deleted: ${orderCount || 0}`);
  console.log(`  Invoices deleted: ${invoiceIds.length}`);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');

  console.log('========================================');
  console.log('  DUPLICATE ORDER REMOVAL SCRIPT');
  console.log('========================================\n');

  if (dryRun) {
    console.log('*** DRY RUN MODE - No changes will be made ***');
    console.log('*** Run with --execute to perform deletion ***\n');
  } else {
    console.log('*** EXECUTION MODE - Changes WILL be made ***\n');
  }

  const pendingOrders = await verifyDuplicates();

  console.log('\n========================================');
  console.log(`Total pending orders to delete: ${pendingOrders.length}`);
  console.log('========================================\n');

  if (dryRun) {
    console.log('To execute the deletion, run:');
    console.log('  node scripts/remove-duplicate-orders.js --execute');
  } else {
    await deleteDuplicates(pendingOrders);
  }
}

main().catch(console.error);
