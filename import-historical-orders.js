/**
 * COMPREHENSIVE HISTORICAL ORDER IMPORT
 * Processes 2023-2025.csv and generates complete SQL
 * Handles: Client consolidation, address extraction, workflow fields, properties
 */

const fs = require('fs');
const Papa = require('papaparse');

console.log('🚀 Starting Historical Order Import Analysis...\n');

// Read CSV
const csvData = fs.readFileSync('Order Migration/2023-2025.csv', 'utf8');
const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });

console.log(`📊 Total Orders: ${parsed.data.length}`);
console.log(`📋 Total Columns: ${Object.keys(parsed.data[0] || {}).length}\n`);

// Statistics
const stats = {
  totalOrders: parsed.data.length,
  hasAppraisedPropertyAddress: 0,
  hasNameAddress: 0,
  hasClientName: 0,
  hasAMCClient: 0,
  hasLenderClient: 0,
  hasCompletedDate: 0,
  uniqueClients: new Set(),
  dateRange: { min: null, max: null }
};

// Analyze data
parsed.data.forEach(row => {
  // Address sources
  if (row['Appraised Property Address']) stats.hasAppraisedPropertyAddress++;
  if (row['Name']) stats.hasNameAddress++;
  
  // Client sources
  if (row['Client Name']) stats.hasClientName++;
  if (row['AMC CLIENT']) stats.hasAMCClient++;
  if (row['Lender Client']) stats.hasLenderClient++;
  
  // Completion tracking
  if (row['Completed At']) stats.hasCompletedDate++;
  
  // Collect unique clients
  const client = row['AMC CLIENT'] || row['Lender Client'] || row['Client Name'] || '[Unknown]';
  if (client && client !== 'None' && client !== 'AMC') {
    stats.uniqueClients.add(client.trim());
  }
  
  // Date range
  const createdDate = row['Created At'];
  if (createdDate) {
    if (!stats.dateRange.min || createdDate < stats.dateRange.min) stats.dateRange.min = createdDate;
    if (!stats.dateRange.max || createdDate > stats.dateRange.max) stats.dateRange.max = createdDate;
  }
});

console.log('📈 Data Analysis:');
console.log('================');
console.log(`Address Sources:`);
console.log(`  - Appraised Property Address: ${stats.hasAppraisedPropertyAddress} orders`);
console.log(`  - Name field: ${stats.hasNameAddress} orders`);
console.log(`  - Need fallback to Name: ${stats.totalOrders - stats.hasAppraisedPropertyAddress} orders\n`);

console.log(`Client Sources:`);
console.log(`  - Client Name: ${stats.hasClientName} orders`);
console.log(`  - AMC CLIENT: ${stats.hasAMCClient} orders`);
console.log(`  - Lender Client: ${stats.hasLenderClient} orders\n`);

console.log(`Completion:`);
console.log(`  - Completed orders: ${stats.hasCompletedDate} (${Math.round(stats.hasCompletedDate/stats.totalOrders*100)}%)`);
console.log(`  - Active orders: ${stats.totalOrders - stats.hasCompletedDate}\n`);

console.log(`Unique Clients: ${stats.uniqueClients.size}`);
console.log(`Date Range: ${stats.dateRange.min?.substring(0,10)} to ${stats.dateRange.max?.substring(0,10)}\n`);

console.log('Top 20 Clients by Frequency:');
const clientCounts = {};
parsed.data.forEach(row => {
  const client = row['AMC CLIENT'] || row['Lender Client'] || row['Client Name'] || '[Unknown]';
  const cleanClient = (client && client !== 'None' && client !== 'AMC') ? client.trim() : '[Unknown]';
  clientCounts[cleanClient] = (clientCounts[cleanClient] || 0) + 1;
});

const sortedClients = Object.entries(clientCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20);

sortedClients.forEach(([client, count]) => {
  console.log(`  ${count.toString().padStart(4)} orders - ${client}`);
});

console.log('\n📋 Recommendation:');
console.log('================');
if (stats.totalOrders > 1000) {
  console.log('✅ Generate batched SQL (500 orders per file)');
  console.log(`✅ Will create ${Math.ceil(stats.totalOrders / 500)} SQL batch files`);
} else {
  console.log('✅ Generate single SQL file');
}

console.log('\n🎯 Next Steps:');
console.log('1. Review client list above');
console.log('2. Decide if you want to import all 1,319 orders or filter by date');
console.log('3. Run full import generator');

// Save analysis
const analysis = {
  stats,
  topClients: sortedClients,
  sampleOrders: parsed.data.slice(0, 5).map(r => ({
    taskId: r['Task ID'],
    name: r['Name'],
    appraisedAddress: r['Appraised Property Address'],
    client: r['AMC CLIENT'] || r['Lender Client'] || r['Client Name'],
    fee: r['Appraisal Fee'],
    createdAt: r['Created At'],
    completedAt: r['Completed At']
  }))
};

fs.writeFileSync('import-analysis.json', JSON.stringify(analysis, null, 2));
console.log('\n✅ Saved detailed analysis to: import-analysis.json');

