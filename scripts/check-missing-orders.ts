import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

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

function parseCSV(content: string): CSVOrder[] {
  const orders: CSVOrder[] = [];

  // The CSV has a pattern where each record ends with the summary row containing key data
  // Let's find all summary rows by looking for the pattern: ORDERS,,,,FEE.00,ClientName,ContactInfo
  const lines = content.split('\n');

  // Find all lines that start with a task ID (16 digit number in quotes)
  const recordStarts: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    // Format: "1212478771540446",2025-12-16,, (no quotes around date)
    if (lines[i].match(/^"\d{13,}",\d{4}-\d{2}-\d{2}/)) {
      recordStarts.push(i);
    }
  }

  console.log(`Found ${recordStarts.length} record start markers`);

  for (let r = 0; r < recordStarts.length; r++) {
    const startLine = recordStarts[r];
    const endLine = r < recordStarts.length - 1 ? recordStarts[r + 1] : lines.length;

    // Get the full record
    const recordLines = lines.slice(startLine, endLine);
    const recordText = recordLines.join('\n');

    // Extract task ID and created date from first line
    const firstLine = recordLines[0];
    // Format: "1212478771540446",2025-12-16,,2025-12-16,"305 Joyce St,...
    const idMatch = firstLine.match(/^"(\d+)",(\d{4}-\d{2}-\d{2})/);
    if (!idMatch) continue;

    const taskId = idMatch[1];
    const createdAt = idMatch[2];

    // Extract the name/address from first line - it's in quotes after the date fields
    const nameMatch = firstLine.match(/\d{4}-\d{2}-\d{2},"([^"]+)"/);
    const name = nameMatch ? nameMatch[1].trim() : '';

    // Find the summary row - it contains "ORDERS,,,," pattern
    const summaryLine = recordLines.find(l => l.includes('ORDERS,,,,'));
    if (!summaryLine) continue;

    // Parse the summary line - it's comma separated with some quoted fields
    // Format: ORDERS,,,,FEE,ClientName,"ContactInfo",,Scope,ReportFormat,Purpose,Region,Prior,...
    const afterOrders = summaryLine.split('ORDERS,,,,')[1];
    if (!afterOrders) continue;

    // Split carefully respecting quotes
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of afterOrders) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(current.trim());

    // Extract fields
    // [0] = Fee, [1] = Client, [2] = Contact, [3] = empty?, [4] = Scope, [5] = ReportFormat, [6] = Purpose, [7] = Region, [8] = Prior
    // [9] = Address, [10] = DateOfValue, [11] = Additional Forms, [12] = BillingMethod, [13] = SiteInfluence, [14] = SiteSize
    // [15] = Admin, [16] = empty, [17] = SalesCampaign, [18] = SalesRep, [19] = DueDate

    const fee = parts[0] || '';
    const clientName = parts[1] || '';
    const contactInfo = parts[2] || '';
    const scope = parts[4] || '';
    const reportFormat = parts[5] || '';
    const purpose = parts[6] || '';
    const region = parts[7] || '';
    const address = parts[9] || name; // Use name if no address found
    const additionalForms = parts[11] || '';
    const billingMethod = parts[12] || '';
    const siteInfluence = parts[13] || '';
    const siteSize = parts[14] || '';
    const dueDate = parts[19] || '';

    // Get section from first line
    const sectionMatch = firstLine.match(/",([^,]+),Rod Haugabrooks/);
    const section = sectionMatch ? sectionMatch[1] : '';

    orders.push({
      taskId,
      name,
      address: address.replace(/"/g, '').trim(),
      clientName: clientName.replace(/"/g, '').trim(),
      fee,
      dueDate,
      createdAt,
      section,
      scope,
      reportFormat,
      purpose,
      region,
      additionalForms,
      billingMethod,
      siteInfluence,
      siteSize,
      contactInfo: contactInfo.replace(/"/g, '').trim()
    });
  }

  return orders;
}

async function main() {
  // Read the CSV file
  const csvPath = path.join(__dirname, '../Order Migration/last_90_days.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');

  console.log('Parsing CSV file...');
  const csvOrders = parseCSV(csvContent);
  console.log(`Found ${csvOrders.length} orders in CSV\n`);

  // Get all orders from database
  console.log('Fetching orders from database...');
  const { data: dbOrders, error } = await supabase
    .from('orders')
    .select('id, property_address, order_number, status, fee_amount, external_id');

  if (error) {
    console.error('Error fetching orders:', error);
    process.exit(1);
  }

  console.log(`Found ${dbOrders?.length || 0} orders in database\n`);

  // Normalize addresses for comparison
  const normalizeAddress = (addr: string) => {
    if (!addr) return '';
    return addr
      .toLowerCase()
      .replace(/[.,#]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/street/g, 'st')
      .replace(/avenue/g, 'ave')
      .replace(/drive/g, 'dr')
      .replace(/boulevard/g, 'blvd')
      .replace(/road/g, 'rd')
      .replace(/lane/g, 'ln')
      .replace(/court/g, 'ct')
      .replace(/circle/g, 'cir')
      .trim();
  };

  // Create sets for matching
  const dbAddressSet = new Set(
    (dbOrders || []).map(o => normalizeAddress(o.property_address))
  );
  const dbExternalIdSet = new Set(
    (dbOrders || []).filter(o => o.external_id).map(o => o.external_id)
  );

  // Find missing orders
  const missingOrders: CSVOrder[] = [];
  const foundOrders: CSVOrder[] = [];

  for (const csvOrder of csvOrders) {
    const normalizedAddr = normalizeAddress(csvOrder.address || csvOrder.name);
    const hasExternalId = dbExternalIdSet.has(csvOrder.taskId);
    const hasAddress = normalizedAddr && dbAddressSet.has(normalizedAddr);

    if (!hasExternalId && !hasAddress) {
      missingOrders.push(csvOrder);
    } else {
      foundOrders.push(csvOrder);
    }
  }

  // Check specifically for 1400 Milton Street
  console.log('=== Checking for 1400 Milton Street ===');
  const miltonSearch = '1400 milton';
  const miltonInDb = (dbOrders || []).filter(o =>
    normalizeAddress(o.property_address).includes(miltonSearch)
  );
  const miltonInCsv = csvOrders.filter(o =>
    normalizeAddress(o.address).includes(miltonSearch) ||
    normalizeAddress(o.name).includes(miltonSearch)
  );

  console.log(`In CSV: ${miltonInCsv.length} records`);
  miltonInCsv.forEach(o => console.log(`  - ${o.address || o.name} (Task ID: ${o.taskId})`));
  console.log(`In Database: ${miltonInDb.length} records`);
  miltonInDb.forEach(o => console.log(`  - ${o.property_address} (ID: ${o.id})`));

  console.log('\n=== Summary ===');
  console.log(`Total in CSV: ${csvOrders.length}`);
  console.log(`Found in DB: ${foundOrders.length}`);
  console.log(`Missing from DB: ${missingOrders.length}`);

  if (missingOrders.length > 0) {
    console.log('\n=== Missing Orders (showing first 30) ===');
    missingOrders.slice(0, 30).forEach((o, i) => {
      console.log(`${i + 1}. ${o.address || o.name}`);
      console.log(`   Task ID: ${o.taskId}`);
      console.log(`   Client: ${o.clientName}`);
      console.log(`   Fee: $${o.fee}`);
      console.log(`   Created: ${o.createdAt}`);
      console.log('');
    });

    if (missingOrders.length > 30) {
      console.log(`... and ${missingOrders.length - 30} more missing orders`);
    }

    // Write full list to file
    const outputPath = path.join(__dirname, '../Order Migration/missing_orders.json');
    fs.writeFileSync(outputPath, JSON.stringify(missingOrders, null, 2));
    console.log(`\nFull list written to: ${outputPath}`);
  }
}

main();
