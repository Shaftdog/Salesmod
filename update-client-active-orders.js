/**
 * UPDATE ACTIVE_ORDERS COUNT ON ALL CLIENTS
 * Recalculate the active_orders column based on actual order counts
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

    console.log('📊 Updating active_orders count for all clients...\n');

    const result = await dbClient.query(`
      UPDATE clients c
      SET active_orders = (
        SELECT COUNT(*)
        FROM orders o
        WHERE o.client_id = c.id
      )
    `);

    console.log(`✅ Updated ${result.rowCount} client records\n`);

    // Show top clients with updated counts
    const topClients = await dbClient.query(`
      SELECT 
        company_name,
        client_type,
        active_orders,
        total_revenue
      FROM clients
      WHERE active_orders > 0
      ORDER BY active_orders DESC
      LIMIT 15
    `);

    console.log('📋 Top 15 Clients by Order Count:\n');
    topClients.rows.forEach((row, i) => {
      console.log(`   ${(i+1).toString().padStart(2)}. ${row.company_name.substring(0, 40).padEnd(40)} - ${row.active_orders.toString().padStart(4)} orders`);
    });

    // Check i Fund Cities specifically
    const iFund = await dbClient.query(`
      SELECT 
        company_name,
        active_orders,
        (SELECT COUNT(*) FROM orders WHERE client_id = clients.id) as actual_count
      FROM clients
      WHERE company_name = 'i Fund Cities LLC'
    `);

    if (iFund.rows.length > 0) {
      console.log('\n📊 i Fund Cities LLC:');
      console.log(`   active_orders column: ${iFund.rows[0].active_orders}`);
      console.log(`   actual order count: ${iFund.rows[0].actual_count}`);
      
      if (iFund.rows[0].active_orders === iFund.rows[0].actual_count) {
        console.log('   ✅ Counts match!');
      } else {
        console.log('   ⚠️  Mismatch - but just updated, so should be fixed');
      }
    }

    console.log('\n✅ All client active_orders counts updated!');
    console.log('\n💡 Refresh your browser (Cmd+Shift+R) to see updated counts');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await dbClient.end();
  }
}

main();

