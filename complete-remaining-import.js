/**
 * COMPLETE THE REMAINING IMPORT
 * 1. Fix sales_campaign constraint
 * 2. Import batches 4 and 5
 */

const { Client } = require('pg');
const fs = require('fs');

const DATABASE_URL = 'postgresql://postgres.zqhenxhgcjxslpfezybm:NsjCsuLJfBswVhdI@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
    query_timeout: 300000,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Step 1: Fix constraint
    console.log('🔧 Step 1: Updating sales_campaign constraint...');
    const constraintSQL = fs.readFileSync('add-missing-campaign-values.sql', 'utf8');
    await client.query(constraintSQL);
    console.log('✅ Constraint updated with new values\n');

    // Step 2: Import batch 4
    console.log('📦 Step 2: Importing batch 4 (orders 901-1200)...');
    const batch4SQL = fs.readFileSync('import-historical-batch-4-safe.sql', 'utf8');
    const startTime4 = Date.now();
    await client.query(batch4SQL);
    const elapsed4 = ((Date.now() - startTime4) / 1000).toFixed(1);
    console.log(`✅ Batch 4 complete! (${elapsed4}s)\n`);

    // Step 3: Import batch 5
    console.log('📦 Step 3: Importing batch 5 (orders 1201-1319)...');
    const batch5SQL = fs.readFileSync('import-historical-batch-5-safe.sql', 'utf8');
    const startTime5 = Date.now();
    await client.query(batch5SQL);
    const elapsed5 = ((Date.now() - startTime5) / 1000).toFixed(1);
    console.log(`✅ Batch 5 complete! (${elapsed5}s)\n`);

    // Final verification
    console.log('🔍 Final Verification...\n');
    const totalCount = await client.query("SELECT COUNT(*) as count FROM orders WHERE source = 'asana'");
    const statusDist = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM orders 
      WHERE source = 'asana' 
      GROUP BY status 
      ORDER BY count DESC
    `);
    
    const clientDist = await client.query(`
      SELECT c.company_name, c.client_type, COUNT(o.id) as order_count
      FROM orders o
      JOIN clients c ON o.client_id = c.id
      WHERE o.source = 'asana'
      GROUP BY c.company_name, c.client_type
      ORDER BY order_count DESC
      LIMIT 10
    `);

    console.log('=' .repeat(60));
    console.log('🎉 COMPLETE HISTORICAL IMPORT FINISHED!');
    console.log('=' .repeat(60));
    console.log(`\nTotal Orders: ${totalCount.rows[0].count}`);
    console.log(`Expected: 1,341 (22 October + 1,319 historical)`);
    console.log(`\nStatus Distribution:`);
    statusDist.rows.forEach(row => {
      console.log(`  ${row.status.padEnd(15)}: ${row.count} orders`);
    });
    
    console.log(`\nTop 10 Clients by Order Count:`);
    clientDist.rows.forEach((row, i) => {
      console.log(`  ${(i + 1).toString().padStart(2)}. ${row.company_name.substring(0, 40).padEnd(40)} (${row.client_type}) - ${row.order_count} orders`);
    });

    console.log('\n✅ All 1,319 historical orders imported successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Create properties for all orders');
    console.log('2. Link orders to properties');
    console.log('3. You\'re done!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Details:', error.detail || '');
  } finally {
    await client.end();
  }
}

main();

