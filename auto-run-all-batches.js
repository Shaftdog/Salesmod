/**
 * AUTO-RUN ALL BATCH IMPORTS
 * Executes all 5 batch files automatically via database connection
 */

const { Client } = require('pg');
const fs = require('fs');

const DATABASE_URL = 'postgresql://postgres:NsjCsuLJfBswVhdI@db.zqhenxhgcjxslpfezybm.supabase.co:5432/postgres';

async function runBatch(client, batchNum, totalBatches) {
  const filename = `import-historical-batch-${batchNum}.sql`;
  
  console.log(`\n📦 Batch ${batchNum}/${totalBatches}: ${filename}`);
  console.log('   Reading file...');
  
  const sql = fs.readFileSync(filename, 'utf8');
  const orderCount = (sql.match(/INSERT INTO orders/g) || []).length;
  
  console.log(`   Executing ${orderCount} INSERT statements...`);
  
  try {
    await client.query(sql);
    console.log(`   ✅ Batch ${batchNum} complete!`);
    return { success: true, count: orderCount };
  } catch (error) {
    console.error(`   ❌ Batch ${batchNum} failed:`, error.message);
    return { success: false, error: error.message, count: 0 };
  }
}

async function main() {
  const dbClient = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('🔌 Connecting to Supabase database...');
    await dbClient.connect();
    console.log('✅ Connected successfully!\n');

    // Check current state
    const beforeCount = await dbClient.query("SELECT COUNT(*) FROM orders WHERE source = 'asana'");
    console.log(`📊 Current orders in database: ${beforeCount.rows[0].count}`);

    // Run all 5 batches
    const batches = [1, 2, 3, 4, 5];
    let totalImported = 0;
    let totalFailed = 0;

    for (const batchNum of batches) {
      const result = await runBatch(dbClient, batchNum, batches.length);
      if (result.success) {
        totalImported += result.count;
      } else {
        totalFailed++;
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Verify final count
    console.log('\n🔍 Verifying import...');
    const afterCount = await dbClient.query("SELECT COUNT(*) FROM orders WHERE source = 'asana'");
    const statusDist = await dbClient.query("SELECT status, COUNT(*) as count FROM orders WHERE source = 'asana' GROUP BY status ORDER BY count DESC");
    
    console.log(`\n✅ IMPORT COMPLETE!`);
    console.log('===================');
    console.log(`Total orders now: ${afterCount.rows[0].count}`);
    console.log(`Newly imported: ${parseInt(afterCount.rows[0].count) - parseInt(beforeCount.rows[0].count)}`);
    console.log(`\nStatus distribution:`);
    statusDist.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count} orders`);
    });

  } catch (error) {
    console.error('\n❌ Connection Error:', error.message);
    console.error('\nFallback: Run batch files manually in Supabase SQL Editor');
    console.error('Files: import-historical-batch-1.sql through import-historical-batch-5.sql');
  } finally {
    await dbClient.end();
  }
}

main();

