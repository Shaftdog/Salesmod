/**
 * Import OCT-NOV Orders from CSV
 *
 * This script imports orders from the "Order Migration/OCT-NOV-orders.csv" file
 * and creates:
 * - Clients (matched or created)
 * - Properties (matched or created with proper deduplication)
 * - Orders
 * - Invoices with line items
 * - Product associations
 */

const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Configuration
const CSV_PATH = './Order Migration/OCT-NOV-orders.csv';
const ORG_ID = 'bde00714-427d-4024-9fbd-6f895824f733'; // Rod's org ID
const DEFAULT_CLIENT_NAME = 'Unknown Client';

// Stats tracking
const stats = {
  totalRows: 0,
  ordersCreated: 0,
  ordersSkipped: 0,
  clientsCreated: 0,
  clientsMatched: 0,
  propertiesCreated: 0,
  propertiesMatched: 0,
  invoicesCreated: 0,
  errors: []
};

/**
 * Parse address from CSV format: "123 Main St, City, FL 12345"
 */
function parseAddress(addressString) {
  if (!addressString || typeof addressString !== 'string') {
    return null;
  }

  const trimmed = addressString.trim();

  // Try to parse "Street, City, State Zip" or "Street, City, State, Zip"
  const match = trimmed.match(/^(.+?),\s*(.+?),\s*([A-Z]{2})\s*,?\s*(\d{5}(?:-\d{4})?)$/i);

  if (match) {
    return {
      street: match[1].trim(),
      city: match[2].trim(),
      state: match[3].toUpperCase(),
      zip: match[4].trim()
    };
  }

  // Try alternative format: "Street City State Zip"
  const match2 = trimmed.match(/^(.+?)\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i);
  if (match2) {
    const parts = match2[1].split(/\s+/);
    const city = parts.pop();
    const street = parts.join(' ');
    return {
      street: street.trim(),
      city: city.trim(),
      state: match2[2].toUpperCase(),
      zip: match2[3].trim()
    };
  }

  return null;
}

/**
 * Extract unit number from address
 */
function extractUnit(address) {
  if (!address) return { street: address, unit: null };

  const unitMatch = address.match(/\s+(apt|unit|ste|suite|#)\s+([a-z0-9\-]+)$/i);
  if (unitMatch) {
    const street = address.replace(/\s+(apt|unit|ste|suite|#)\s+[a-z0-9\-]+$/i, '').trim();
    const unit = unitMatch[2];
    return { street, unit };
  }

  return { street: address, unit: null };
}

/**
 * Create normalized address hash for deduplication
 */
function createAddressHash(street, city, state, zip) {
  const { street: streetNoUnit } = extractUnit(street);
  const zip5 = zip.substring(0, 5);
  return `${streetNoUnit.toUpperCase()}|${city.toUpperCase()}|${state.toUpperCase()}|${zip5}`;
}

/**
 * Find or create client
 */
async function findOrCreateClient(clientName, email = null, phone = null) {
  if (!clientName || clientName.trim() === '' || clientName === 'None') {
    clientName = DEFAULT_CLIENT_NAME;
  }

  // Try to find existing client by company name
  const { data: existing, error: searchError } = await supabase
    .from('clients')
    .select('id, company_name')
    .eq('company_name', clientName)
    .maybeSingle();

  if (searchError) {
    console.error('Error searching for client:', searchError);
    throw searchError;
  }

  if (existing) {
    stats.clientsMatched++;
    return existing.id;
  }

  // Create new client
  const { data: newClient, error: createError } = await supabase
    .from('clients')
    .insert({
      company_name: clientName,
      primary_contact: clientName,
      email: email || 'noreply@example.com',
      phone: phone || '000-000-0000',
      address: 'TBD',
      billing_address: 'TBD',
      payment_terms: 30,
      is_active: true
    })
    .select('id')
    .single();

  if (createError) {
    console.error('Error creating client:', createError);
    throw createError;
  }

  stats.clientsCreated++;
  return newClient.id;
}

/**
 * Find or create property
 */
async function findOrCreateProperty(address, city, state, zip, propertyType = 'single_family') {
  const { street, unit } = extractUnit(address);
  const addrHash = createAddressHash(street, city, state, zip);

  // Try to find existing property
  const { data: existing, error: searchError } = await supabase
    .from('properties')
    .select('id')
    .eq('org_id', ORG_ID)
    .eq('addr_hash', addrHash)
    .maybeSingle();

  if (searchError) {
    console.error('Error searching for property:', searchError);
    throw searchError;
  }

  if (existing) {
    stats.propertiesMatched++;
    return { propertyId: existing.id, unit };
  }

  // Create new property
  const { data: newProperty, error: createError } = await supabase
    .from('properties')
    .insert({
      org_id: ORG_ID,
      address_line1: street,
      address_line2: unit,
      city: city,
      state: state.toUpperCase(),
      postal_code: zip.substring(0, 5),
      country: 'US',
      property_type: propertyType,
      addr_hash: addrHash
    })
    .select('id')
    .single();

  if (createError) {
    console.error('Error creating property:', createError);
    throw createError;
  }

  stats.propertiesCreated++;
  return { propertyId: newProperty.id, unit };
}

/**
 * Map product from scope of work
 */
async function mapProductFromScope(scopeOfWork, billingMethod, notes) {
  // Get all products for the org
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('org_id', ORG_ID)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching products:', error);
    return null;
  }

  if (!products || products.length === 0) {
    console.warn('⚠️  No products found in database. Please create products first.');
    return null;
  }

  // Try to match based on scope of work
  const scope = (scopeOfWork || '').toLowerCase();

  // Common mappings (you may need to adjust based on your actual product names)
  const productMappings = {
    'field inspection': ['field', 'inspection'],
    'desktop': ['desktop'],
    'full appraisal': ['full appraisal', 'complete appraisal'],
    'update': ['update', 'recertification'],
    'drive-by': ['drive-by', 'exterior'],
    '1004': ['1004'],
    '2055': ['2055'],
  };

  for (const product of products) {
    const productName = product.name.toLowerCase();

    // Try exact match first
    if (scope.includes(productName)) {
      return product;
    }

    // Try keyword matching
    for (const [key, keywords] of Object.entries(productMappings)) {
      if (productName.includes(key)) {
        for (const keyword of keywords) {
          if (scope.includes(keyword)) {
            return product;
          }
        }
      }
    }
  }

  // Default to first product if no match found
  console.warn(`⚠️  No product match found for scope: "${scopeOfWork}". Using default product.`);
  return products[0];
}

/**
 * Parse fee amount from string
 */
function parseFee(feeString) {
  if (!feeString) return 0;

  // Remove currency symbols and commas
  const cleaned = feeString.toString().replace(/[$,]/g, '').trim();
  const parsed = parseFloat(cleaned);

  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse date from CSV format
 */
function parseDate(dateString) {
  if (!dateString || dateString === '') return null;

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;

    // Return ISO date string (YYYY-MM-DD)
    return date.toISOString().split('T')[0];
  } catch (e) {
    return null;
  }
}

/**
 * Determine payment method for invoices from billing method
 */
function mapPaymentMethod(billingMethod) {
  if (!billingMethod) return 'net_terms';

  const method = billingMethod.toLowerCase();

  if (method.includes('cod') || method.includes('cash')) {
    return 'cod';
  } else if (method.includes('online') || method.includes('stripe') || method.includes('card')) {
    return 'stripe_link';
  } else {
    return 'net_terms';
  }
}

/**
 * Map billing method to valid order billing_method values
 */
function mapOrderBillingMethod(billingMethod) {
  if (!billingMethod) return 'bill';

  const method = billingMethod.toLowerCase();

  if (method.includes('cod')) {
    return 'cod';
  } else if (method.includes('online')) {
    return 'online';
  } else {
    return 'bill';
  }
}

/**
 * Map sales campaign to valid enum values
 */
function mapSalesCampaign(salesCampaign) {
  if (!salesCampaign) return null;

  const campaign = salesCampaign.toLowerCase().replace(/\s+/g, '_');

  // Direct mapping
  const validValues = [
    'client_selection', 'bid_request', 'case_management', 'collections',
    'client_maintenance', 'feedback', 'client_recognition', 'education',
    'networking', 'new_client', 'partnership', 'market_expansion',
    'product_expansion', 'prospecting', 'suspecting', 'update_profile',
    'contact_attempts', 'administration', 'admin_support', 'scheduling',
    'training', 'meeting'
  ];

  if (validValues.includes(campaign)) {
    return campaign;
  }

  return null;
}

/**
 * Map scope of work to valid enum values
 */
function mapScopeOfWork(scopeOfWork) {
  if (!scopeOfWork) return 'interior';

  const scope = scopeOfWork.toLowerCase();

  // Try to map common values
  if (scope.includes('desktop')) return 'desktop';
  if (scope.includes('exterior')) return 'exterior_only';
  if (scope.includes('interior') || scope.includes('field')) return 'interior';
  if (scope.includes('inspection')) return 'inspection_only';
  if (scope.includes('desk') && scope.includes('review')) return 'desk_review';
  if (scope.includes('field') && scope.includes('review')) return 'field_review';

  // Default to interior if unclear
  return 'interior';
}

/**
 * Process a single row
 */
async function processRow(row, index) {
  try {
    // Skip rows without address
    if (!row['Appraised Property Address']) {
      console.log(`⏭️  Row ${index + 1}: Skipping - no property address`);
      stats.ordersSkipped++;
      return;
    }

    // Parse address
    const parsedAddress = parseAddress(row['Appraised Property Address']);
    if (!parsedAddress) {
      console.warn(`⚠️  Row ${index + 1}: Could not parse address: ${row['Appraised Property Address']}`);
      stats.ordersSkipped++;
      return;
    }

    console.log(`\n📋 Processing Row ${index + 1}: ${row['Appraised Property Address']}`);

    // Get client name
    const clientName = row['Client Name'] || row['Lender Client'] || row['AMC CLIENT'] || DEFAULT_CLIENT_NAME;

    // Find or create client
    const clientId = await findOrCreateClient(
      clientName,
      null, // email
      row['Contact Primary Phone']
    );

    // Find or create property
    const { propertyId, unit } = await findOrCreateProperty(
      parsedAddress.street,
      parsedAddress.city,
      parsedAddress.state,
      parsedAddress.zip,
      'single_family' // default type
    );

    // Generate order number from Task ID or create one
    const orderNumber = row['Task ID'] || `ORD-${Date.now()}-${index}`;

    // Check if order already exists
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('order_number', orderNumber)
      .maybeSingle();

    if (existingOrder) {
      console.log(`⏭️  Order ${orderNumber} already exists. Skipping.`);
      stats.ordersSkipped++;
      return;
    }

    // Parse dates
    const createdDate = parseDate(row['Created At']);
    const completedDate = parseDate(row['Completed At']);
    const dueDate = parseDate(row['Due to Client']);

    // Parse fee
    const feeAmount = parseFee(row['Appraisal Fee']);

    // Determine status
    let status = 'pending';
    if (completedDate) {
      status = 'completed';
    } else if (row['Section/Column']?.includes('NEEDS SCHEDULING') || row['Section/Column']?.includes('Recently assigned')) {
      status = 'assigned';
    } else if (row['Section/Column']?.includes('IN PROGRESS') || row['Section/Column']?.includes('IN PRODUCTION')) {
      status = 'in_progress';
    }

    // Create order
    const orderData = {
      org_id: ORG_ID,
      client_id: clientId,
      property_id: propertyId,
      order_number: orderNumber,
      property_address: parsedAddress.street,
      property_city: parsedAddress.city,
      property_state: parsedAddress.state,
      property_zip: parsedAddress.zip,
      property_type: 'single_family',
      borrower_name: row['Contact For Entry'] || null,
      order_type: 'refinance', // Default to refinance, can't determine from CSV
      status: status,
      priority: 'normal',
      due_date: dueDate,
      completed_date: completedDate,
      ordered_date: createdDate,
      fee_amount: feeAmount,
      total_amount: feeAmount,
      special_instructions: row['Notes'] || null,
      scope_of_work: mapScopeOfWork(row['SCOPE OF WORK']),
      billing_method: mapOrderBillingMethod(row['Billing Method']),
      sales_campaign: mapSalesCampaign(row['SALES CAMPAIGN']),
      created_by: ORG_ID,
      created_at: createdDate || new Date().toISOString()
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select('id')
      .single();

    if (orderError) {
      console.error(`❌ Error creating order:`, orderError);
      stats.errors.push({ row: index + 1, error: orderError.message });
      return;
    }

    stats.ordersCreated++;
    console.log(`✅ Created order: ${orderNumber}`);

    // Create invoice if fee amount exists
    if (feeAmount > 0) {
      // Map product from scope of work
      const product = await mapProductFromScope(
        row['SCOPE OF WORK'],
        row['Billing Method'],
        row['Notes']
      );

      // Determine payment method
      const paymentMethod = mapPaymentMethod(row['Billing Method']);

      // Calculate due date for invoice (30 days from order date or today)
      const invoiceDueDate = new Date(createdDate || Date.now());
      invoiceDueDate.setDate(invoiceDueDate.getDate() + 30);

      // Create invoice
      const invoiceData = {
        org_id: ORG_ID,
        client_id: clientId,
        invoice_date: createdDate || new Date().toISOString().split('T')[0],
        due_date: invoiceDueDate.toISOString().split('T')[0],
        payment_method: paymentMethod,
        status: completedDate ? 'sent' : 'draft',
        subtotal: feeAmount,
        tax_rate: 0,
        tax_amount: 0,
        discount_amount: 0,
        total_amount: feeAmount,
        amount_paid: 0,
        amount_due: feeAmount,
        notes: `Imported from Asana order ${orderNumber}`
      };

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select('id, invoice_number')
        .single();

      if (invoiceError) {
        console.error(`❌ Error creating invoice:`, invoiceError);
        stats.errors.push({ row: index + 1, error: invoiceError.message });
        return;
      }

      // Create invoice line item
      const lineItemData = {
        invoice_id: invoice.id,
        order_id: order.id,
        description: row['SCOPE OF WORK'] || 'Appraisal Service',
        quantity: 1,
        unit_price: feeAmount,
        amount: feeAmount,
        line_order: 1
      };

      const { error: lineItemError } = await supabase
        .from('invoice_line_items')
        .insert(lineItemData);

      if (lineItemError) {
        console.error(`❌ Error creating line item:`, lineItemError);
        stats.errors.push({ row: index + 1, error: lineItemError.message });
        return;
      }

      stats.invoicesCreated++;
      console.log(`💰 Created invoice: ${invoice.invoice_number}`);
    }

  } catch (error) {
    console.error(`❌ Error processing row ${index + 1}:`, error);
    stats.errors.push({ row: index + 1, error: error.message });
  }
}

/**
 * Main import function
 */
async function main() {
  console.log('🚀 Starting OCT-NOV Orders Import\n');
  console.log(`📁 CSV File: ${CSV_PATH}`);
  console.log(`🏢 Organization ID: ${ORG_ID}\n`);

  // Read and parse CSV
  let records;
  try {
    const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
    records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true // Handle BOM if present
    });

    stats.totalRows = records.length;
    console.log(`📊 Found ${stats.totalRows} rows in CSV\n`);
  } catch (error) {
    console.error('❌ Error reading CSV file:', error);
    process.exit(1);
  }

  // Process each row
  for (let i = 0; i < records.length; i++) {
    await processRow(records[i], i);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total rows processed:    ${stats.totalRows}`);
  console.log(`Orders created:          ${stats.ordersCreated}`);
  console.log(`Orders skipped:          ${stats.ordersSkipped}`);
  console.log(`Clients created:         ${stats.clientsCreated}`);
  console.log(`Clients matched:         ${stats.clientsMatched}`);
  console.log(`Properties created:      ${stats.propertiesCreated}`);
  console.log(`Properties matched:      ${stats.propertiesMatched}`);
  console.log(`Invoices created:        ${stats.invoicesCreated}`);
  console.log(`Errors encountered:      ${stats.errors.length}`);
  console.log('='.repeat(60));

  if (stats.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    stats.errors.forEach(err => {
      console.log(`  Row ${err.row}: ${err.error}`);
    });
  }

  console.log('\n✨ Import complete!\n');
}

// Run the import
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
