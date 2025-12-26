import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const TENANT_ID = 'da0563f7-7d29-4c02-b835-422f31c82b7b';
const PROPERTY_ORG_ID = 'e5db2778-aabe-4210-8a5e-d4741eab946f';
const ORDER_ORG_ID = 'bde00714-427d-4024-9fbd-6f895824f733';

interface CSVOrder {
  taskId: string;
  name: string;
  address: string;
  clientName: string;
  fee: string;
  dueDate: string;
  createdAt: string;
  section: string;
  scope: string;
  reportFormat: string;
  purpose: string;
  region: string;
  additionalForms: string;
  billingMethod: string;
  siteInfluence: string;
  siteSize: string;
  contactInfo: string;
}

interface ParsedAddress {
  line1: string;
  city: string;
  state: string;
  zip: string;
}

// Parse Florida addresses
function parseAddress(fullAddress: string): ParsedAddress | null {
  if (!fullAddress) return null;

  // Common patterns: "123 Main St, City, FL 12345" or "123 Main St City FL 12345"
  const patterns = [
    // "123 Main St, City, FL 12345"
    /^(.+?),\s*([^,]+),\s*FL\s*(\d{5}(?:-\d{4})?)/i,
    // "123 Main St, City FL 12345"
    /^(.+?),\s*([^,]+)\s+FL\s*(\d{5}(?:-\d{4})?)/i,
    // "123 Main St City, FL 12345"
    /^(.+?)\s+([A-Za-z\s]+),\s*FL\s*(\d{5}(?:-\d{4})?)/i,
    // "123 Main St, City, Florida 12345"
    /^(.+?),\s*([^,]+),\s*Florida\s*(\d{5}(?:-\d{4})?)/i,
  ];

  for (const pattern of patterns) {
    const match = fullAddress.match(pattern);
    if (match) {
      return {
        line1: match[1].trim(),
        city: match[2].trim(),
        state: 'FL',
        zip: match[3].trim()
      };
    }
  }

  // Fallback: try to extract components more loosely
  const zipMatch = fullAddress.match(/(\d{5}(?:-\d{4})?)\s*$/);
  const stateMatch = fullAddress.match(/,?\s*(FL|Florida)\s*\d{5}/i);

  if (zipMatch && stateMatch) {
    // Try to parse out city
    const beforeZip = fullAddress.replace(/\s*\d{5}(?:-\d{4})?\s*$/, '');
    const beforeState = beforeZip.replace(/,?\s*(FL|Florida)\s*$/i, '');
    const parts = beforeState.split(',').map(p => p.trim()).filter(Boolean);

    if (parts.length >= 2) {
      const city = parts.pop() || '';
      const line1 = parts.join(', ');
      return { line1, city, state: 'FL', zip: zipMatch[1] };
    } else if (parts.length === 1) {
      // Try to split by last space group that looks like a city name
      const lastPart = parts[0];
      const words = lastPart.split(' ');
      // Assume last 2-3 words might be city
      if (words.length >= 4) {
        const cityWords = words.slice(-2);
        const streetWords = words.slice(0, -2);
        return {
          line1: streetWords.join(' '),
          city: cityWords.join(' '),
          state: 'FL',
          zip: zipMatch[1]
        };
      }
    }
  }

  return null;
}

// Normalize client names for matching
function normalizeClientName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Find matching client ID
async function findOrCreateClient(clientName: string, existingClients: any[]): Promise<string | null> {
  if (!clientName || clientName === 'AMC' || clientName === 'None' || clientName === 'n/a') {
    // Return a default "unassigned" client
    const unassigned = existingClients.find(c => c.company_name === '[Unassigned Orders]');
    return unassigned?.id || null;
  }

  const normalized = normalizeClientName(clientName);

  // Try exact match first
  for (const client of existingClients) {
    if (normalizeClientName(client.company_name) === normalized) {
      return client.id;
    }
  }

  // Try partial match
  for (const client of existingClients) {
    const clientNorm = normalizeClientName(client.company_name);
    if (clientNorm.includes(normalized) || normalized.includes(clientNorm)) {
      return client.id;
    }
  }

  // Create new client
  console.log(`  Creating new client: ${clientName}`);
  const slug = normalizeClientName(clientName);
  const { data: newClient, error } = await supabase
    .from('clients')
    .insert({
      tenant_id: TENANT_ID,
      org_id: ORDER_ORG_ID,
      company_name: clientName,
      email: `orders+${slug}@roiappraisal.com`,
      phone: '',
      address: 'N/A',
      billing_address: 'N/A',
      is_active: true,
      client_type: 'company'
    })
    .select('id')
    .single();

  if (error) {
    console.error(`  Error creating client: ${error.message}`);
    return null;
  }

  return newClient?.id || null;
}

// Generate order number
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${year}${month}-${random}`;
}

// Generate invoice number
function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}-${random}`;
}

// Parse fee amount
function parseFee(feeStr: string): number {
  if (!feeStr) return 0;
  const cleaned = feeStr.replace(/[$,]/g, '');
  return parseFloat(cleaned) || 0;
}

// Map scope to database value
function mapScope(scope: string): string {
  const scopeLower = (scope || '').toLowerCase();
  if (scopeLower.includes('interior')) return 'interior';
  if (scopeLower.includes('exterior')) return 'exterior';
  if (scopeLower.includes('desktop')) return 'desktop';
  return 'interior';
}

// Map site influence to valid enum value
function mapSiteInfluence(influence: string): string {
  const influenceLower = (influence || '').toLowerCase();
  if (!influenceLower || influenceLower === 'n/a' || influenceLower === 'none' || influenceLower === 'na') {
    return 'none';
  }
  if (influenceLower.includes('water') || influenceLower.includes('lake') || influenceLower.includes('pond') || influenceLower.includes('canal')) {
    return 'water';
  }
  if (influenceLower.includes('golf')) {
    return 'golf';
  }
  if (influenceLower.includes('preserve') || influenceLower.includes('conservation')) {
    return 'preserve';
  }
  if (influenceLower.includes('greenbelt') || influenceLower.includes('park')) {
    return 'greenbelt';
  }
  return 'none';
}

// Map report format
function mapReportFormat(format: string): string {
  if (!format) return '1004';
  if (format.includes('1004')) return '1004';
  if (format.includes('2055')) return '2055';
  if (format.includes('1073')) return '1073';
  if (format.includes('1025')) return '1025';
  return '1004';
}

// Map intended use
function mapIntendedUse(purpose: string): string {
  const purposeLower = (purpose || '').toLowerCase();
  if (purposeLower.includes('refinance')) return 'refinance';
  if (purposeLower.includes('purchase')) return 'purchase';
  if (purposeLower.includes('cash out')) return 'cash_out_refinance';
  if (purposeLower.includes('heloc')) return 'heloc';
  return 'other';
}

// Generate addr_hash for property deduplication
function generateAddrHash(line1: string, city: string, state: string, zip: string): string {
  const cleanLine1 = (line1 || '').toUpperCase().trim();
  const cleanCity = (city || '').toUpperCase().trim();
  const cleanState = (state || 'FL').toUpperCase().trim();
  const cleanZip = (zip || '').substring(0, 5);
  return `${cleanLine1}|${cleanCity}|${cleanState}|${cleanZip}`;
}

async function main() {
  // Read missing orders
  const missingPath = path.join(__dirname, '../Order Migration/missing_orders.json');
  const missingOrders: CSVOrder[] = JSON.parse(fs.readFileSync(missingPath, 'utf-8'));

  console.log(`Found ${missingOrders.length} missing orders to import\n`);

  // Get existing clients
  const { data: existingClients, error: clientsError } = await supabase
    .from('clients')
    .select('id, company_name');

  if (clientsError) {
    console.error('Error fetching clients:', clientsError);
    process.exit(1);
  }

  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (const csvOrder of missingOrders) {
    const addressStr = csvOrder.address || csvOrder.name;
    if (!addressStr) {
      console.log(`Skipping order ${csvOrder.taskId}: no address`);
      errorCount++;
      continue;
    }

    console.log(`\nImporting: ${addressStr}`);

    // Parse address
    const parsed = parseAddress(addressStr);
    if (!parsed) {
      console.log(`  Warning: Could not parse address, using as-is`);
    }

    // Find or create client
    const clientId = await findOrCreateClient(csvOrder.clientName, existingClients || []);

    // Generate addr_hash for property
    const line1 = parsed?.line1 || addressStr;
    const city = parsed?.city || '';
    const state = parsed?.state || 'FL';
    // Try to extract zip from raw address if parsing failed
    let zip = parsed?.zip || '';
    if (!zip) {
      const zipMatch = addressStr.match(/\d{5}(?:-\d{4})?/);
      if (zipMatch) {
        zip = zipMatch[0].substring(0, 5);
      }
    }
    // Ensure zip is exactly 5 digits
    zip = zip.replace(/[^0-9]/g, '').substring(0, 5);
    if (zip.length < 5) {
      zip = zip.padEnd(5, '0');
    }
    const addrHash = generateAddrHash(line1, city, state, zip);

    // Try to find existing property first
    let property: { id: string } | null = null;
    const { data: existingProp } = await supabase
      .from('properties')
      .select('id')
      .eq('org_id', PROPERTY_ORG_ID)
      .eq('addr_hash', addrHash)
      .single();

    if (existingProp) {
      property = existingProp;
      console.log(`  Found existing property: ${property.id}`);
    } else {
      // Create property
      const { data: newProp, error: propError } = await supabase
        .from('properties')
        .insert({
          tenant_id: TENANT_ID,
          org_id: PROPERTY_ORG_ID,
          address_line1: line1,
          city: city,
          state: state,
          postal_code: zip,
          country: 'USA',
          property_type: 'single_family',
          addr_hash: addrHash
        })
        .select('id')
        .single();

      if (propError) {
        console.log(`  Error creating property: ${propError.message}`);
        errors.push(`${addressStr}: Property error - ${propError.message}`);
        errorCount++;
        continue;
      }
      property = newProp;
      console.log(`  Created property: ${property.id}`);
    }

    if (!property) {
      console.log(`  Error: No property found or created`);
      errors.push(`${addressStr}: No property found or created`);
      errorCount++;
      continue;
    }

    // Parse fee
    const feeAmount = parseFee(csvOrder.fee);

    // Parse due date - use ordered date + 7 days if not specified
    let dueDate = null;
    if (csvOrder.dueDate) {
      const dueParsed = new Date(csvOrder.dueDate);
      if (!isNaN(dueParsed.getTime())) {
        dueDate = dueParsed.toISOString().split('T')[0];
      }
    }
    if (!dueDate) {
      const orderedDate = csvOrder.createdAt ? new Date(csvOrder.createdAt) : new Date();
      orderedDate.setDate(orderedDate.getDate() + 7);
      dueDate = orderedDate.toISOString().split('T')[0];
    }

    // Parse additional forms into array format
    let additionalForms: string[] | null = null;
    if (csvOrder.additionalForms && csvOrder.additionalForms !== 'N/A' && csvOrder.additionalForms !== 'n/a') {
      // Extract form numbers like "1007" from text like "1007 - Rent Survey"
      const formMatch = csvOrder.additionalForms.match(/\d{3,4}/g);
      if (formMatch && formMatch.length > 0) {
        additionalForms = formMatch;
      }
    }

    // Create order
    const orderNumber = generateOrderNumber();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        tenant_id: TENANT_ID,
        org_id: ORDER_ORG_ID,
        external_id: csvOrder.taskId,
        order_number: orderNumber,
        source: 'asana_import',
        status: 'pending',
        priority: 'normal',
        order_type: 'refinance',
        property_type: 'single_family',
        property_id: property.id,
        property_address: line1,
        property_city: city,
        property_state: state,
        property_zip: zip,
        client_id: clientId,
        borrower_name: csvOrder.contactInfo || 'Unknown',
        fee_amount: feeAmount,
        total_amount: feeAmount,
        ordered_date: csvOrder.createdAt || new Date().toISOString().split('T')[0],
        due_date: dueDate,
        scope_of_work: mapScope(csvOrder.scope),
        report_form_type: mapReportFormat(csvOrder.reportFormat),
        intended_use: mapIntendedUse(csvOrder.purpose),
        service_region: csvOrder.region || null,
        additional_forms: additionalForms,
        billing_method: 'bill',
        site_influence: mapSiteInfluence(csvOrder.siteInfluence),
        property_contact_name: csvOrder.contactInfo || null,
        created_by: ORDER_ORG_ID
      })
      .select('id')
      .single();

    if (orderError) {
      console.log(`  Error creating order: ${orderError.message}`);
      errors.push(`${addressStr}: Order error - ${orderError.message}`);
      errorCount++;
      continue;
    }

    console.log(`  Created order: ${order.id} (${orderNumber})`);

    // Create invoice if fee > 0
    if (feeAmount > 0) {
      const invoiceNumber = generateInvoiceNumber();
      const { data: invoice, error: invError } = await supabase
        .from('invoices')
        .insert({
          tenant_id: TENANT_ID,
          org_id: ORDER_ORG_ID,
          order_id: order.id,
          client_id: clientId,
          invoice_number: invoiceNumber,
          invoice_date: csvOrder.createdAt || new Date().toISOString().split('T')[0],
          due_date: dueDate,
          status: 'draft',
          payment_method: 'net_terms',
          subtotal: feeAmount,
          tax_rate: 0,
          tax_amount: 0,
          discount_amount: 0,
          total_amount: feeAmount,
          amount_paid: 0,
          amount_due: feeAmount
        })
        .select('id')
        .single();

      if (invError) {
        console.log(`  Warning: Could not create invoice: ${invError.message}`);
      } else {
        console.log(`  Created invoice: ${invoice.id} (${invoiceNumber})`);
      }
    }

    successCount++;
  }

  console.log('\n=== Import Summary ===');
  console.log(`Successfully imported: ${successCount}`);
  console.log(`Errors: ${errorCount}`);

  if (errors.length > 0) {
    console.log('\nErrors encountered:');
    errors.forEach(e => console.log(`  - ${e}`));
  }
}

main();
