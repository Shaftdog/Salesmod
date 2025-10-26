/**
 * SPLIT HISTORICAL ORDERS INTO MANAGEABLE BATCHES
 * Splits 1,319 orders into smaller SQL files for Supabase SQL Editor
 */

const fs = require('fs');

console.log('🔪 Splitting import-historical-orders.sql into batches...\n');

// Read the generated SQL
const fullSQL = fs.readFileSync('import-historical-orders.sql', 'utf8');
const lines = fullSQL.split('\n');

console.log(`📊 Total lines: ${lines.length}`);

// Find all INSERT statements
const insertStatements = [];
let currentInsert = [];
let inInsert = false;

lines.forEach(line => {
  if (line.includes('INSERT INTO orders')) {
    inInsert = true;
    currentInsert = [line];
  } else if (inInsert) {
    currentInsert.push(line);
    if (line.trim() === '' || line.includes(');')) {
      insertStatements.push(currentInsert.join('\n'));
      currentInsert = [];
      inInsert = false;
    }
  }
});

console.log(`✅ Found ${insertStatements.length} INSERT statements\n`);

// Split into batches of 300 orders each
const BATCH_SIZE = 300;
const batches = [];
for (let i = 0; i < insertStatements.length; i += BATCH_SIZE) {
  batches.push(insertStatements.slice(i, i + BATCH_SIZE));
}

console.log(`📦 Creating ${batches.length} batch files (${BATCH_SIZE} orders each)...\n`);

// Generate batch files
batches.forEach((batch, index) => {
  const batchNum = index + 1;
  const startOrder = (index * BATCH_SIZE) + 1;
  const endOrder = Math.min((index + 1) * BATCH_SIZE, insertStatements.length);
  
  const batchSQL = [];
  batchSQL.push('-- ==============================================');
  batchSQL.push(`-- HISTORICAL ORDERS IMPORT - BATCH ${batchNum} of ${batches.length}`);
  batchSQL.push(`-- Orders ${startOrder}-${endOrder} (${batch.length} orders)`);
  batchSQL.push('-- ==============================================\n');
  
  batchSQL.push(...batch);
  
  batchSQL.push('\n-- ==============================================');
  batchSQL.push('-- BATCH VERIFICATION');
  batchSQL.push('-- ==============================================\n');
  batchSQL.push(`-- Should show ${endOrder} total orders after this batch`);
  batchSQL.push(`SELECT COUNT(*) as total_orders FROM orders WHERE source = 'asana';`);
  batchSQL.push(`SELECT status, COUNT(*) as count FROM orders WHERE source = 'asana' GROUP BY status;`);
  
  const filename = `import-historical-batch-${batchNum}.sql`;
  fs.writeFileSync(filename, batchSQL.join('\n'));
  
  const sizeMB = (batchSQL.join('\n').length / 1024 / 1024).toFixed(2);
  console.log(`✅ Batch ${batchNum}: ${filename} (${batch.length} orders, ${sizeMB} MB)`);
});

console.log('\n🎯 Run these files in order:');
console.log('===========================');
console.log('1. import-historical-clients.sql (already done ✅)');
batches.forEach((_, index) => {
  console.log(`${index + 2}. import-historical-batch-${index + 1}.sql`);
});

console.log('\n📋 Each batch is small enough for Supabase SQL Editor!');
console.log(`Total batches: ${batches.length}`);
console.log(`Time estimate: ~${batches.length * 1.5} minutes (1.5 min per batch)`);

