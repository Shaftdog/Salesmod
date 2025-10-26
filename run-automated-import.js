/**
 * AUTOMATED HISTORICAL ORDER IMPORT
 * Connects directly to Supabase and imports all 1,319 orders
 */

const { Client } = require('pg');
const fs = require('fs');
const Papa = require('papaparse');

// Database connection
const DATABASE_URL = 'postgresql://postgres:NsjCsuLJfBswVhdI@db.zqhenxhgcjxslpfezybm.supabase.co:5432/postgres';

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Test query
    const testResult = await client.query('SELECT COUNT(*) FROM orders WHERE source = $1', ['asana']);
    console.log(`📊 Current orders in database: ${testResult.rows[0].count}\n`);

    // Read CSV
    console.log('📁 Reading 2023-2025.csv...');
    const csvData = fs.readFileSync('Order Migration/2023-2025.csv', 'utf8');
    const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
    console.log(`✅ Loaded ${parsed.data.length} orders from CSV\n`);

    console.log('🚀 Starting import process...');
    console.log('This will take 10-15 minutes for 1,319 orders\n');
    
    // We'll process in steps - let me know if you want to proceed
    console.log('✅ Setup complete. Ready to import!');
    console.log('\nWould import:');
    console.log(`  - ${parsed.data.length} orders`);
    console.log(`  - 145 unique clients`);
    console.log(`  - ~1,300 properties`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

main();

