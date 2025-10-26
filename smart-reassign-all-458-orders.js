/**
 * SMART REASSIGNMENT OF 458 UNASSIGNED ORDERS
 * Uses fuzzy matching to connect orders to existing clients
 * Based on client names that ARE in the CSV but didn't match during import
 */

const { Client } = require('pg');
const fs = require('fs');
const Papa = require('papaparse');

const DATABASE_URL = 'postgresql://postgres.zqhenxhgcjxslpfezybm:NsjCsuLJfBswVhdI@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

// Client name mapping rules
const clientMappings = [
  // VISION variations
  { pattern: /VISION/i, target: 'VISION' },
  
  // iFund Cities variations  
  { pattern: /i\s*fund\s*cit/i, target: 'i Fund Cities LLC' },
  { pattern: /ifund/i, target: 'i Fund Cities LLC' },
  
  // Consolidated Analytics
  { pattern: /consolidated\s*analytics/i, target: 'Consolidated Analytics, Inc' },
  
  // Great SouthBay
  { pattern: /great\s*south\s*bay/i, target: 'Great SouthBay Appraisal Management Company' },
  
  // MTS GROUP
  { pattern: /mts\s*group/i, target: 'MTS GROUP LLC' },
  
  // Bluebird
  { pattern: /bluebird/i, target: 'Bluebird Valuation' },
  
  // Amo Services  
  { pattern: /amo\s*services/i, target: 'Amo Services' },
  
  // Home Base
  { pattern: /home\s*base/i, target: 'Home Base Appraisal Management' },
  
  // Class Valuation
  { pattern: /class\s*valuation/i, target: 'Class Valuation' },
  
  // AppraiserVendor
  { pattern: /appraiser\s*vendor/i, target: 'AppraiserVendor.com, LLC' },
  
  // E Street
  { pattern: /e\s*street/i, target: 'E STREET APPRAISAL MANAGEMENT LLC (EVO)' },
  
  // Allstate
  { pattern: /allstate/i, target: 'Allstate Appraisal' },
  
  // Tamarisk
  { pattern: /tamarisk/i, target: 'Tamarisk' },
  
  // Appraisal Nation
  { pattern: /appraisal\s*nation/i, target: 'Appraisal Nation' },
  
  // Nationwide
  { pattern: /nationwide\s*appraisal/i, target: 'Nationwide Appraisal Network' },
  
  // Lima One
  { pattern: /lima\s*one/i, target: 'Lima One Capital' },
  
  // Plains Commerce
  { pattern: /plains\s*commerce/i, target: 'Plains Commerce Bank' },
];

async function main() {
  const dbClient = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
    query_timeout: 600000,
  });

  try {
    console.log('🔌 Connecting to database...');
    await dbClient.connect();
    console.log('✅ Connected!\n');

    console.log('=' .repeat(60));
    console.log('SMART REASSIGNMENT OF 458 UNASSIGNED ORDERS');
    console.log('=' .repeat(60) + '\n');

    // Read CSV to get original client names
    console.log('📋 Reading original CSV data...');
    const csvData = fs.readFileSync('Order Migration/2023-2025.csv', 'utf8');
    const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
    console.log(`✅ Loaded ${parsed.data.length} orders from CSV\n`);

    // Build mapping of Task ID → Original Client Name
    console.log('📋 Building Task ID → Client Name mapping...');
    const taskToClient = new Map();
    
    parsed.data.forEach(row => {
      const taskId = row['Task ID'];
      const amcClient = row['AMC CLIENT'];
      const lenderClient = row['Lender Client'];
      const clientName = row['Client Name'];
      
      // Store all client field values for this task
      taskToClient.set(taskId, {
        amc: amcClient || '',
        lender: lenderClient || '',
        name: clientName || ''
      });
    });
    
    console.log(`✅ Mapped ${taskToClient.size} task IDs\n`);

    // Get all unassigned orders
    console.log('📋 Fetching unassigned orders from database...');
    const unassigned = await dbClient.query(`
      SELECT 
        o.id,
        o.order_number,
        o.external_id,
        o.property_address
      FROM orders o
      JOIN clients c ON o.client_id = c.id
      WHERE c.company_name = '[Unassigned Orders]'
        AND o.source = 'asana'
    `);
    
    console.log(`✅ Found ${unassigned.rows.length} unassigned orders\n`);

    // Match each order to a client
    console.log('📋 Matching orders to clients...\n');
    const reassignments = {};
    
    for (const order of unassigned.rows) {
      const taskId = order.external_id;
      const clientInfo = taskToClient.get(taskId);
      
      if (!clientInfo) continue;
      
      // Check all client fields
      const clientText = `${clientInfo.amc} ${clientInfo.lender} ${clientInfo.name}`.toLowerCase();
      
      // Try to match against patterns
      for (const mapping of clientMappings) {
        if (mapping.pattern.test(clientText)) {
          if (!reassignments[mapping.target]) {
            reassignments[mapping.target] = [];
          }
          reassignments[mapping.target].push(order.id);
          break;
        }
      }
    }

    console.log('Matched orders by client:');
    console.log('=' .repeat(60));
    Object.entries(reassignments).forEach(([clientName, orderIds]) => {
      console.log(`  ${clientName.padEnd(45)}: ${orderIds.length} orders`);
    });
    
    const totalMatched = Object.values(reassignments).reduce((sum, ids) => sum + ids.length, 0);
    console.log(`\nTotal matched: ${totalMatched} / ${unassigned.rows.length}`);
    console.log(`Remaining unmatched: ${unassigned.rows.length - totalMatched}\n`);

    // Execute reassignments
    console.log('📋 Executing reassignments...\n');
    let totalReassigned = 0;
    
    for (const [clientName, orderIds] of Object.entries(reassignments)) {
      if (orderIds.length === 0) continue;
      
      try {
        const result = await dbClient.query(`
          UPDATE orders
          SET client_id = (
            SELECT id FROM clients 
            WHERE company_name = $1 
            LIMIT 1
          )
          WHERE id = ANY($2::uuid[])
        `, [clientName, orderIds]);
        
        console.log(`✅ ${clientName.substring(0, 40).padEnd(40)} - ${result.rowCount} orders reassigned`);
        totalReassigned += result.rowCount;
      } catch (error) {
        console.error(`❌ Failed to reassign to ${clientName}:`, error.message);
      }
    }

    // Final verification
    console.log('\n' + '=' .repeat(60));
    console.log('📊 FINAL RESULTS');
    console.log('=' .repeat(60) + '\n');
    
    const finalUnassigned = await dbClient.query(`
      SELECT COUNT(*) as count
      FROM orders o
      JOIN clients c ON o.client_id = c.id
      WHERE c.company_name = '[Unassigned Orders]'
        AND o.source = 'asana'
    `);
    
    console.log(`Total reassigned: ${totalReassigned} orders`);
    console.log(`Remaining unassigned: ${finalUnassigned.rows[0].count} orders`);
    console.log(`Success rate: ${((totalReassigned / unassigned.rows.length) * 100).toFixed(1)}%`);

    // Show top clients now
    const topClients = await dbClient.query(`
      SELECT 
        c.company_name,
        COUNT(o.id) as order_count
      FROM orders o
      JOIN clients c ON o.client_id = c.id
      WHERE o.source = 'asana'
        AND c.company_name != '[Unassigned Orders]'
      GROUP BY c.company_name
      ORDER BY order_count DESC
      LIMIT 10
    `);
    
    console.log('\nTop 10 Clients After Reassignment:');
    topClients.rows.forEach((row, i) => {
      console.log(`  ${(i+1).toString().padStart(2)}. ${row.company_name.substring(0, 40).padEnd(40)} - ${row.order_count} orders`);
    });

    console.log('\n' + '=' .repeat(60));
    console.log('✅ SMART REASSIGNMENT COMPLETE!');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await dbClient.end();
    console.log('\n🔌 Connection closed.');
  }
}

main();

