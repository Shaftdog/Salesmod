/**
 * FINAL REASSIGNMENT - REMAINING 142 ORDERS
 * Uses comprehensive fuzzy matching against ALL clients in database
 */

const { Client } = require('pg');
const fs = require('fs');
const Papa = require('papaparse');

const DATABASE_URL = 'postgresql://postgres.zqhenxhgcjxslpfezybm:NsjCsuLJfBswVhdI@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

async function main() {
  const dbClient = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
    query_timeout: 600000,
  });

  try {
    console.log('🔌 Connecting...');
    await dbClient.connect();
    console.log('✅ Connected!\n');

    // Get all clients from database
    console.log('📋 Loading all clients from database...');
    const allClients = await dbClient.query(`
      SELECT id, company_name
      FROM clients
      WHERE company_name NOT IN ('[Unassigned Orders]', '[Unassigned Contacts]')
    `);
    console.log(`✅ Loaded ${allClients.rows.length} clients\n`);

    // Build client lookup map (normalized)
    const clientLookup = new Map();
    allClients.rows.forEach(client => {
      const normalized = client.company_name.toLowerCase().replace(/[^a-z0-9]/g, '');
      clientLookup.set(normalized, { id: client.id, name: client.company_name });
    });

    // Read CSV
    console.log('📋 Reading CSV...');
    const csvData = fs.readFileSync('Order Migration/2023-2025.csv', 'utf8');
    const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
    
    // Build Task → Client map
    const taskToClient = new Map();
    parsed.data.forEach(row => {
      const amcClient = row['AMC CLIENT'];
      const lenderClient = row['Lender Client'];  
      const clientName = row['Client Name'];
      
      // Priority: AMC > Lender > Name
      let client = amcClient && amcClient !== 'None' && amcClient !== 'AMC' ? amcClient : 
                   (lenderClient && lenderClient !== 'None' ? lenderClient : 
                   (clientName && clientName !== 'None' ? clientName : null));
      
      if (client) {
        taskToClient.set(row['Task ID'], client.trim());
      }
    });
    
    console.log(`✅ Mapped ${taskToClient.size} tasks to client names\n`);

    // Get unassigned orders
    const unassigned = await dbClient.query(`
      SELECT o.id, o.external_id, o.order_number
      FROM orders o
      JOIN clients c ON o.client_id = c.id
      WHERE c.company_name = '[Unassigned Orders]'
        AND o.source = 'asana'
    `);
    
    console.log(`📋 Processing ${unassigned.rows.length} remaining unassigned orders...\n`);

    // Match and reassign
    let matched = 0;
    let unmatched = 0;
    
    for (const order of unassigned.rows) {
      const csvClientName = taskToClient.get(order.external_id);
      
      if (!csvClientName) {
        unmatched++;
        continue;
      }
      
      // Try to find matching client
      const normalized = csvClientName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchedClient = clientLookup.get(normalized);
      
      if (matchedClient) {
        // Reassign this order
        await dbClient.query(`
          UPDATE orders SET client_id = $1 WHERE id = $2
        `, [matchedClient.id, order.id]);
        matched++;
        
        if (matched % 50 === 0) {
          console.log(`   Progress: ${matched} orders reassigned...`);
        }
      } else {
        unmatched++;
      }
    }

    console.log(`\n✅ Reassignment complete!`);
    console.log(`   Matched: ${matched}`);
    console.log(`   Unmatched: ${unmatched}\n`);

    // Final stats
    const finalCount = await dbClient.query(`
      SELECT COUNT(*) as count
      FROM orders o  
      JOIN clients c ON o.client_id = c.id
      WHERE c.company_name = '[Unassigned Orders]'
        AND o.source = 'asana'
    `);

    console.log('=' .repeat(60));
    console.log(`📊 Final unassigned orders: ${finalCount.rows[0].count}`);
    console.log(`📊 Total reassigned this session: ${316 + matched}`);
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await dbClient.end();
  }
}

main();

