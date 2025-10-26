/**
 * ANALYZE THE 458 UNASSIGNED ORDERS
 * Check what client info they had in the original CSV
 */

const fs = require('fs');
const Papa = require('papaparse');

console.log('🔍 ANALYZING UNASSIGNED ORDERS FROM CSV\n');

// Read CSV
const csvData = fs.readFileSync('Order Migration/2023-2025.csv', 'utf8');
const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });

console.log(`📊 Total orders in CSV: ${parsed.data.length}\n`);

// Find orders that would become "Unknown Client"
const unknownOrders = [];
const clientNameDistribution = {};

parsed.data.forEach(row => {
  const taskId = row['Task ID'];
  const amcClient = row['AMC CLIENT'];
  const lenderClient = row['Lender Client'];
  const clientName = row['Client Name'];
  
  // This is the consolidation logic from import
  let finalClient = null;
  if (amcClient && amcClient !== 'None' && amcClient !== 'AMC' && amcClient.trim()) {
    finalClient = amcClient.trim();
  } else if (lenderClient && lenderClient !== 'None' && lenderClient.trim()) {
    finalClient = lenderClient.trim();
  } else if (clientName && clientName !== 'None' && clientName.trim()) {
    finalClient = clientName.trim();
  }
  
  if (!finalClient) {
    unknownOrders.push({
      taskId,
      name: row['Name'],
      amcClient: amcClient || '(empty)',
      lenderClient: lenderClient || '(empty)',
      clientName: clientName || '(empty)',
      address: row['Appraised Property Address'] || row['Name'],
      fee: row['Appraisal Fee'],
      notes: (row['Notes'] || '').substring(0, 200)
    });
  }
  
  // Track what was in the client fields
  const key = `AMC:${amcClient || 'empty'} | Lender:${lenderClient || 'empty'} | Name:${clientName || 'empty'}`;
  clientNameDistribution[key] = (clientNameDistribution[key] || 0) + 1;
});

console.log(`📋 Orders with no valid client name: ${unknownOrders.length}\n`);

console.log('Top 20 client field patterns in these unknown orders:');
console.log('=' .repeat(80));
const sorted = Object.entries(clientNameDistribution)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20);

sorted.forEach(([pattern, count]) => {
  if (count >= 5) {
    console.log(`${count.toString().padStart(4)} orders: ${pattern.substring(0, 75)}`);
  }
});

console.log('\nSample of unknown orders (first 10):');
console.log('=' .repeat(80));
unknownOrders.slice(0, 10).forEach((order, i) => {
  console.log(`\n${i + 1}. Task ID: ${order.taskId}`);
  console.log(`   Address: ${order.address}`);
  console.log(`   Fee: $${order.fee}`);
  console.log(`   AMC CLIENT: "${order.amcClient}"`);
  console.log(`   Lender Client: "${order.lenderClient}"`);
  console.log(`   Client Name: "${order.clientName}"`);
  if (order.notes) {
    console.log(`   Notes preview: ${order.notes.substring(0, 100)}...`);
  }
});

console.log('\n\n📋 Analysis Summary:');
console.log('=' .repeat(80));
console.log(`Total orders with no client: ${unknownOrders.length}`);
console.log(`These are the 458 unassigned orders you see in the database`);
console.log('\n💡 To fix these, you would need to:');
console.log('1. Manually review each order');
console.log('2. Determine correct client from context (notes, address, etc.)');
console.log('3. Assign manually or create assignment rules');
console.log('\nOR');
console.log('Leave them in [Unassigned Orders] and assign as you process them');

// Save detailed list
fs.writeFileSync('unassigned-orders-analysis.json', JSON.stringify(unknownOrders, null, 2));
console.log('\n✅ Saved detailed analysis to: unassigned-orders-analysis.json');

