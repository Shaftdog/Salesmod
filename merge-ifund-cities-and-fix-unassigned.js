/**
 * MERGE ALL I FUND CITIES VARIATIONS & FIX UNASSIGNED ORDERS
 * 1. Find all iFund/Fund Cities duplicates
 * 2. Merge into "i Fund Cities LLC"
 * 3. Reassign unassigned orders that mention iFund/Fund Cities
 */

const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres.zqhenxhgcjxslpfezybm:NsjCsuLJfBswVhdI@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
    query_timeout: 600000,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('=' .repeat(60));
    console.log('MERGING I FUND CITIES DUPLICATES');
    console.log('=' .repeat(60) + '\n');

    // Step 1: Find all iFund Cities variations
    console.log('📋 Step 1: Finding all i Fund Cities variations...');
    
    const variations = await client.query(`
      SELECT 
        id,
        company_name,
        client_type,
        (SELECT COUNT(*) FROM orders WHERE client_id = clients.id) as order_count
      FROM clients
      WHERE LOWER(company_name) ~ '(i|ifund).?(fund).?(cities|cties|citeis)'
        OR company_name ILIKE '%Fund Cities%'
        OR company_name ILIKE '%iFund%'
      ORDER BY order_count DESC
    `);
    
    console.log(`   Found ${variations.rows.length} variations:\n`);
    variations.rows.forEach((row, i) => {
      console.log(`   ${(i+1).toString().padStart(2)}. ${row.company_name.padEnd(40)} - ${row.order_count} orders`);
    });

    if (variations.rows.length <= 1) {
      console.log('\n✅ No duplicates to merge!\n');
      return;
    }

    // Step 2: Pick winner (i Fund Cities LLC with most orders/contacts)
    console.log('\n📋 Step 2: Selecting winner client...');
    
    const winner = await client.query(`
      SELECT 
        id,
        company_name,
        (SELECT COUNT(*) FROM orders WHERE client_id = clients.id) as order_count,
        (SELECT COUNT(*) FROM contacts WHERE client_id = clients.id) as contact_count
      FROM clients
      WHERE company_name = 'i Fund Cities LLC'
      LIMIT 1
    `);
    
    let winnerId, winnerName;
    
    if (winner.rows.length > 0) {
      winnerId = winner.rows[0].id;
      winnerName = winner.rows[0].company_name;
      console.log(`   Winner: "${winnerName}" (${winner.rows[0].order_count} orders, ${winner.rows[0].contact_count} contacts)`);
    } else {
      // Pick the one with most orders
      winnerId = variations.rows[0].id;
      winnerName = variations.rows[0].company_name;
      console.log(`   Winner: "${winnerName}" (${variations.rows[0].order_count} orders) - will rename to "i Fund Cities LLC"`);
      
      // Rename winner to standard name
      await client.query(`
        UPDATE clients 
        SET company_name = 'i Fund Cities LLC',
            client_type = 'company'
        WHERE id = $1
      `, [winnerId]);
      
      winnerName = 'i Fund Cities LLC';
    }

    // Step 3: Merge all variations
    console.log('\n📋 Step 3: Merging all variations into winner...');
    
    const duplicateIds = variations.rows
      .filter(row => row.id !== winnerId)
      .map(row => row.id);
    
    console.log(`   Merging ${duplicateIds.length} duplicate clients...`);
    
    if (duplicateIds.length > 0) {
      // Reassign orders
      const orderUpdate = await client.query(`
        UPDATE orders
        SET client_id = $1
        WHERE client_id = ANY($2::uuid[])
      `, [winnerId, duplicateIds]);
      
      console.log(`   ✅ Reassigned ${orderUpdate.rowCount} orders to "${winnerName}"`);
      
      // Reassign contacts
      const contactUpdate = await client.query(`
        UPDATE contacts
        SET client_id = $1
        WHERE client_id = ANY($2::uuid[])
      `, [winnerId, duplicateIds]);
      
      console.log(`   ✅ Reassigned ${contactUpdate.rowCount} contacts to "${winnerName}"`);
      
      // Delete duplicates
      const deleteResult = await client.query(`
        DELETE FROM clients
        WHERE id = ANY($1::uuid[])
      `, [duplicateIds]);
      
      console.log(`   ✅ Deleted ${deleteResult.rowCount} duplicate client records`);
    }

    // Step 4: Fix unassigned orders that should be i Fund Cities
    console.log('\n📋 Step 4: Reassigning unassigned i Fund Cities orders...');
    
    const reassignUnassigned = await client.query(`
      UPDATE orders o
      SET client_id = $1
      FROM clients c
      WHERE o.client_id = c.id
        AND c.company_name = '[Unassigned Orders]'
        AND o.source = 'asana'
        AND (
          o.props->>'original_address' ILIKE '%ifund%'
          OR o.props->>'original_address' ILIKE '%fund cities%'
          OR o.props->>'notes' ILIKE '%ifund%'
          OR o.props->>'notes' ILIKE '%fund cities%'
        )
    `, [winnerId]);
    
    console.log(`   ✅ Reassigned ${reassignUnassigned.rowCount} unassigned orders to "${winnerName}"`);

    // Final stats
    console.log('\n' + '=' .repeat(60));
    console.log('📊 FINAL RESULTS');
    console.log('=' .repeat(60) + '\n');
    
    const finalStats = await client.query(`
      SELECT 
        company_name,
        client_type,
        (SELECT COUNT(*) FROM orders WHERE client_id = clients.id) as order_count,
        (SELECT COUNT(*) FROM contacts WHERE client_id = clients.id) as contact_count
      FROM clients
      WHERE company_name = 'i Fund Cities LLC'
    `);
    
    if (finalStats.rows.length > 0) {
      const stats = finalStats.rows[0];
      console.log('✅ i Fund Cities LLC (consolidated):');
      console.log(`   - Orders: ${stats.order_count}`);
      console.log(`   - Contacts: ${stats.contact_count}`);
      console.log(`   - Type: ${stats.client_type}`);
    }
    
    const remainingUnassigned = await client.query(`
      SELECT COUNT(*) as count
      FROM orders o
      JOIN clients c ON o.client_id = c.id
      WHERE c.company_name = '[Unassigned Orders]'
        AND o.source = 'asana'
    `);
    
    console.log(`\n📊 Remaining unassigned orders: ${remainingUnassigned.rows[0].count}`);
    console.log(`   (down from 458)`);

    console.log('\n' + '=' .repeat(60));
    console.log('✅ i Fund Cities consolidation complete!');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed.');
  }
}

main();

