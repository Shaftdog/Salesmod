/**
 * AUTO-IMPORT ALL 5 BATCHES
 * Uses Session Pooler connection for IPv4 compatibility
 */

const { Client } = require('pg');
const fs = require('fs');

const DATABASE_URL = 'postgresql://postgres.zqhenxhgcjxslpfezybm:NsjCsuLJfBswVhdI@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

async function runBatch(client, batchNum) {
  const filename = `import-historical-batch-${batchNum}-safe.sql`;
  
  console.log(`\n📦 Batch ${batchNum}/5: ${filename}`);
  
  const sql = fs.readFileSync(filename, 'utf8');
  const orderCount = (sql.match(/INSERT INTO orders/g) || []).length;
  
  console.log(`   Executing ${orderCount} INSERT statements...`);
  
  const startTime = Date.now();
  
  try {
    await client.query(sql);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`   ✅ Batch ${batchNum} complete! (${elapsed}s)`);
    return { success: true, count: orderCount };
  } catch (error) {
    console.error(`   ❌ Batch ${batchNum} failed:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
    query_timeout: 300000, // 5 minutes per query
  });

  try {
    console.log('🔌 Connecting to Supabase (Session Pooler)...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Check current state
    console.log('📊 Checking current database state...');
    const beforeCount = await client.query("SELECT COUNT(*) as count FROM orders WHERE source = 'asana'");
    console.log(`   Current orders: ${beforeCount.rows[0].count}`);
    
    const clientCount = await client.query("SELECT COUNT(*) as count FROM clients");
    console.log(`   Current clients: ${clientCount.rows[0].count}\n`);

    // Run all 5 batches
    console.log('🚀 Starting batch import...\n');
    console.log('=' .repeat(50));
    
    let totalImported = 0;
    const batches = [1, 2, 3, 4, 5];

    for (const batchNum of batches) {
      const result = await runBatch(client, batchNum);
      if (result.success) {
        totalImported += result.count;
      } else {
        console.error(`\n⚠️  Batch ${batchNum} failed. Stopping import.`);
        console.error(`   Error: ${result.error}`);
        break;
      }
      
      // Progress update
      console.log(`   Progress: ${totalImported}/1,319 orders imported`);
    }

    // Final verification
    console.log('\n' + '='.repeat(50));
    console.log('\n🔍 Verifying import...\n');
    
    const afterCount = await client.query("SELECT COUNT(*) as count FROM orders WHERE source = 'asana'");
    const statusDist = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM orders 
      WHERE source = 'asana' 
      GROUP BY status 
      ORDER BY count DESC
    `);
    
    console.log('✅ IMPORT COMPLETE!');
    console.log('===================');
    console.log(`Total orders in database: ${afterCount.rows[0].count}`);
    console.log(`Newly imported this session: ${parseInt(afterCount.rows[0].count) - parseInt(beforeCount.rows[0].count)}`);
    console.log(`\nStatus distribution:`);
    statusDist.rows.forEach(row => {
      console.log(`  ${row.status.padEnd(15)}: ${row.count} orders`);
    });
    
    console.log('\n🎉 All historical orders successfully imported!');
    console.log('\nNext steps:');
    console.log('1. Create properties for all orders');
    console.log('2. Link orders to properties');
    console.log('3. Verify complete system');

  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    console.error('\nStack:', error.stack);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed.');
  }
}

main();

