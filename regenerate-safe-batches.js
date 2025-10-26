/**
 * REGENERATE BATCH FILES WITH SAFE CLIENT MATCHING
 * Uses COALESCE to fallback to [Unassigned Orders] if client not found
 */

const fs = require('fs');
const Papa = require('papaparse');

console.log('🔄 REGENERATING BATCH FILES WITH SAFE CLIENT MATCHING\n');

// Read CSV
const csvData = fs.readFileSync('Order Migration/2023-2025.csv', 'utf8');
const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });

const BATCH_SIZE = 300;
const batches = [];

// Helper functions
const escapeSQL = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/'/g, "''")
    .replace(/\n/g, ' ')
    .replace(/\r/g, '')
    .substring(0, 2000);
};

const toSQLDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return null;
  }
};

const parseAddress = (appraisedAddr, nameAddr) => {
  const addr = appraisedAddr || nameAddr || '';
  const cleaned = addr.trim();
  
  const zipMatch = cleaned.match(/(\d{5})(?:-\d{4})?/);
  const zip = zipMatch ? zipMatch[1] : '00000';
  
  const stateMatch = cleaned.match(/\b([A-Z]{2})\s+\d{5}/i);
  const state = stateMatch ? stateMatch[1].toUpperCase() : 'FL';
  
  let beforeStateZip = cleaned;
  if (stateMatch) {
    beforeStateZip = cleaned.substring(0, cleaned.indexOf(stateMatch[0])).trim();
  }
  
  const parts = beforeStateZip.split(',').map(p => p.trim()).filter(Boolean);
  
  if (parts.length >= 2) {
    return { street: parts[0], city: parts[1], state, zip };
  } else if (parts.length === 1) {
    const words = parts[0].split(/\s+/);
    if (words.length >= 3) {
      const city = words[words.length - 1];
      const street = words.slice(0, -1).join(' ');
      return { street, city, state, zip };
    }
    return { street: parts[0], city: 'Unknown', state, zip };
  }
  
  return { street: cleaned.substring(0, 200), city: 'Unknown', state: 'FL', zip: '00000' };
};

const mapScope = (v) => {
  if (!v) return null;
  const l = v.toLowerCase();
  if (l.includes('desktop')) return 'desktop';
  if (l.includes('exterior')) return 'exterior_only';
  if (l.includes('interior')) return 'interior';
  return 'interior';
};

const mapReport = (v) => {
  if (!v) return null;
  const match = v.match(/^([A-Z0-9]+)/i);
  return match ? match[1].toUpperCase() : v.trim().substring(0, 50);
};

const splitForms = (v) => {
  if (!v || v.toLowerCase() === 'n/a' || v.toLowerCase() === 'none') return null;
  const forms = [];
  v.split(/[,;]/).forEach(part => {
    const match = part.match(/(\d{3,4})/);
    if (match) forms.push(match[1]);
  });
  return forms.length > 0 ? forms : null;
};

// Generate orders with SAFE client matching
console.log(`Processing ${parsed.data.length} orders...\n`);

const allOrders = [];

parsed.data.forEach((row, index) => {
  const taskId = row['Task ID'];
  const createdAt = toSQLDate(row['Created At']) || toSQLDate(row['Last Modified']) || new Date().toISOString();
  const completedAt = toSQLDate(row['Completed At']);
  const dueDate = toSQLDate(row['Due to Client']) || toSQLDate(row['Due Date']);
  const fee = parseFloat(row['Appraisal Fee']) || 0;
  
  // Consolidate client
  let client = row['AMC CLIENT'] || row['Lender Client'] || row['Client Name'] || '[Unknown Client]';
  if (client === 'None' || client === 'AMC' || !client.trim()) client = '[Unknown Client]';
  client = client.trim();
  
  // Parse address
  const addr = parseAddress(row['Appraised Property Address'], row['Name']);
  
  // Workflow fields
  const scope = mapScope(row['SCOPE OF WORK']);
  const intendedUse = row['PURPOSE'] ? escapeSQL(row['PURPOSE'].substring(0, 200)) : null;
  const reportForm = mapReport(row['Report Format']);
  const additionalForms = splitForms(row['Addition Forms Required']);
  const billing = row['Billing Method']?.toLowerCase() === 'online' ? 'online' : (row['Billing Method']?.toLowerCase() === 'cod' ? 'cod' : 'bill');
  const campaign = (row['SALES CAMPAIGN'] || 'client_selection').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  const region = row['AREA'] ? escapeSQL(row['AREA'].substring(0, 100)) : null;
  const siteInfluence = row['Site Influence'] && row['Site Influence'].toLowerCase().includes('water') ? 'water' : 'none';
  const status = completedAt ? 'completed' : 'new';
  
  // Build INSERT with SAFE client matching
  const orderSQL = [];
  orderSQL.push(`INSERT INTO orders (`);
  orderSQL.push(`  external_id, source, order_number,`);
  orderSQL.push(`  property_address, property_city, property_state, property_zip, property_type,`);
  orderSQL.push(`  borrower_name, client_id, fee_amount, total_amount,`);
  orderSQL.push(`  status, priority, order_type,`);
  orderSQL.push(`  ordered_date, due_date, completed_date,`);
  orderSQL.push(`  created_by, org_id,`);
  orderSQL.push(`  scope_of_work, intended_use, report_form_type, additional_forms,`);
  orderSQL.push(`  billing_method, sales_campaign, service_region, site_influence,`);
  orderSQL.push(`  zoning_type, is_multiunit, is_new_construction,`);
  orderSQL.push(`  props`);
  orderSQL.push(`) VALUES (`);
  orderSQL.push(`  '${escapeSQL(taskId)}', 'asana', 'ORD-${taskId}',`);
  orderSQL.push(`  '${escapeSQL(addr.street)}', '${escapeSQL(addr.city)}', '${addr.state}', '${addr.zip}', 'single_family',`);
  // SAFE client matching with fallback
  orderSQL.push(`  'Unknown Borrower',`);
  orderSQL.push(`  COALESCE(`);
  orderSQL.push(`    (SELECT id FROM clients WHERE company_name = '${escapeSQL(client)}' LIMIT 1),`);
  orderSQL.push(`    (SELECT id FROM clients WHERE company_name ILIKE '%${escapeSQL(client)}%' LIMIT 1),`);
  orderSQL.push(`    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)`);
  orderSQL.push(`  ),`);
  orderSQL.push(`  ${fee}, ${fee},`);
  orderSQL.push(`  '${status}', 'normal', 'refinance',`);
  orderSQL.push(`  '${createdAt}', ${dueDate ? `'${dueDate}'` : `'${createdAt}'`}, ${completedAt ? `'${completedAt}'` : 'NULL'},`);
  orderSQL.push(`  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),`);
  orderSQL.push(`  ${scope ? `'${scope}'` : 'NULL'}, ${intendedUse ? `'${intendedUse}'` : 'NULL'}, ${reportForm ? `'${reportForm}'` : 'NULL'},`);
  orderSQL.push(`  ${additionalForms ? `ARRAY[${additionalForms.map(f => `'${f}'`).join(', ')}]::text[]` : 'NULL'},`);
  orderSQL.push(`  '${billing}', '${campaign}', ${region ? `'${region}'` : 'NULL'}, '${siteInfluence}',`);
  orderSQL.push(`  'residential', false, false,`);
  orderSQL.push(`  '{"original_address": "${escapeSQL(addr.street + ', ' + addr.city + ', ' + addr.state + ' ' + addr.zip)}"}'::jsonb`);
  orderSQL.push(`);\n`);
  
  allOrders.push(orderSQL.join('\n'));
});

console.log(`✅ Generated ${allOrders.length} safe INSERT statements\n`);

// Split into batches
for (let i = 0; i < allOrders.length; i += BATCH_SIZE) {
  const batchNum = Math.floor(i / BATCH_SIZE) + 1;
  const batch = allOrders.slice(i, i + BATCH_SIZE);
  
  const sql = [];
  sql.push('-- ==============================================');
  sql.push(`-- HISTORICAL ORDERS - BATCH ${batchNum} (SAFE VERSION)`);
  sql.push(`-- Orders ${i + 1}-${Math.min(i + BATCH_SIZE, allOrders.length)}`);
  sql.push(`-- With fallback client matching`);
  sql.push('-- ==============================================\n');
  sql.push(...batch);
  sql.push('\n-- Verify batch');
  sql.push(`SELECT COUNT(*) as total FROM orders WHERE source = 'asana';`);
  
  const filename = `import-historical-batch-${batchNum}-safe.sql`;
  fs.writeFileSync(filename, sql.join('\n'));
  
  console.log(`✅ ${filename} (${batch.length} orders)`);
}

console.log('\n✅ All 5 safe batch files generated!');
console.log('\nFiles created:');
console.log('  - import-historical-batch-1-safe.sql');
console.log('  - import-historical-batch-2-safe.sql');
console.log('  - import-historical-batch-3-safe.sql');
console.log('  - import-historical-batch-4-safe.sql');
console.log('  - import-historical-batch-5-safe.sql');
console.log('\nThese use COALESCE to prevent NULL client_id errors');

