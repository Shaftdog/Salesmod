/**
 * CHECK i FUND CITIES ORDER COUNT DISCREPANCY
 * Database says 253, UI says 116 - let's investigate
 */

const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres.zqhenxhgcjxslpfezybm:NsjCsuLJfBswVhdI@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

async function main() {
  const dbClient = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await dbClient.connect();
    console.log('🔌 Connected\n');

    // Get i Fund Cities LLC ID
    const client = await dbClient.query(`
      SELECT id, company_name, client_type
      FROM clients
      WHERE company_name = 'i Fund Cities LLC'
    `);
    
    if (client.rows.length === 0) {
      console.log('❌ i Fund Cities LLC not found!');
      return;
    }
    
    const iFundId = client.rows[0].id;
    console.log(`✅ Found: ${client.rows[0].company_name}`);
    console.log(`   ID: ${iFundId}`);
    console.log(`   Type: ${client.rows[0].client_type}\n`);

    // Count orders by various criteria
    console.log('📊 Order Counts:\n');
    
    // Total orders
    const total = await dbClient.query(`
      SELECT COUNT(*) as count
      FROM orders
      WHERE client_id = $1
    `, [iFundId]);
    console.log(`   Total orders: ${total.rows[0].count}`);
    
    // By source
    const bySource = await dbClient.query(`
      SELECT source, COUNT(*) as count
      FROM orders
      WHERE client_id = $1
      GROUP BY source
      ORDER BY count DESC
    `, [iFundId]);
    console.log(`\n   By source:`);
    bySource.rows.forEach(row => {
      console.log(`      ${(row.source || 'NULL').padEnd(15)}: ${row.count} orders`);
    });
    
    // By status
    const byStatus = await dbClient.query(`
      SELECT status, COUNT(*) as count
      FROM orders
      WHERE client_id = $1
      GROUP BY status
      ORDER BY count DESC
    `, [iFundId]);
    console.log(`\n   By status:`);
    byStatus.rows.forEach(row => {
      console.log(`      ${row.status.padEnd(15)}: ${row.count} orders`);
    });
    
    // Check for org_id / created_by filtering
    const byOrg = await dbClient.query(`
      SELECT created_by, COUNT(*) as count
      FROM orders
      WHERE client_id = $1
      GROUP BY created_by
      ORDER BY count DESC
    `, [iFundId]);
    console.log(`\n   By created_by (org isolation):`);
    byOrg.rows.forEach(row => {
      console.log(`      ${row.created_by.substring(0, 20)}...: ${row.count} orders`);
    });
    
    // Sample orders
    const sample = await dbClient.query(`
      SELECT 
        order_number,
        status,
        source,
        created_by,
        property_address
      FROM orders
      WHERE client_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [iFundId]);
    
    console.log(`\n📋 Sample orders (latest 10):`);
    sample.rows.forEach((row, i) => {
      console.log(`   ${i+1}. ${row.order_number} - ${row.status} - ${row.property_address.substring(0, 30)}`);
    });

    console.log('\n💡 Likely Issue:');
    console.log('   The UI might be filtering by org_id/created_by (tenant isolation)');
    console.log('   If you have multiple users, orders created_by different users');
    console.log('   won\'t show up for the current logged-in user.');
    console.log('\n   The database has 253 total orders for i Fund Cities LLC,');
    console.log('   but only 116 belong to your current user account.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await dbClient.end();
  }
}

main();

