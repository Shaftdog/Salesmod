/**
 * CAREFULLY MERGE REMAINING I FUND CITIES DUPLICATES
 * Consolidate: I Funds, I Funds LLC → i Fund Cities LLC
 * Preserve all orders and contacts
 */

const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres.zqhenxhgcjxslpfezybm:NsjCsuLJfBswVhdI@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

async function main() {
  const dbClient = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
  });

  try {
    console.log('🔌 Connecting to database...');
    await dbClient.connect();
    console.log('✅ Connected!\n');

    console.log('=' .repeat(60));
    console.log('FINAL i FUND CITIES CONSOLIDATION');
    console.log('=' .repeat(60) + '\n');

    // Step 1: Find ALL remaining i Fund Cities variations
    console.log('📋 Step 1: Finding all i Fund Cities variations...\n');
    
    const allVariations = await dbClient.query(`
      SELECT 
        id,
        company_name,
        client_type,
        (SELECT COUNT(*) FROM orders WHERE client_id = clients.id) as order_count,
        (SELECT COUNT(*) FROM contacts WHERE client_id = clients.id) as contact_count
      FROM clients
      WHERE LOWER(company_name) SIMILAR TO '%(i|1)%fund%(cities|cties|citeis|s|)%'
        OR company_name ILIKE '%Fund Cities%'
        OR company_name ILIKE '%iFund%'
      ORDER BY order_count DESC, contact_count DESC
    `);
    
    console.log(`   Found ${allVariations.rows.length} variations:\n`);
    allVariations.rows.forEach((row, i) => {
      console.log(`   ${(i+1).toString().padStart(2)}. "${row.company_name}" (${row.client_type})`);
      console.log(`       Orders: ${row.order_count}, Contacts: ${row.contact_count}`);
    });

    if (allVariations.rows.length <= 1) {
      console.log('\n✅ No duplicates found!\n');
      return;
    }

    // Step 2: Select winner - prefer "i Fund Cities LLC"
    console.log('\n📋 Step 2: Selecting winner...');
    
    let winner = allVariations.rows.find(r => r.company_name === 'i Fund Cities LLC');
    
    if (!winner) {
      // If "i Fund Cities LLC" doesn't exist, pick the one with most orders/contacts
      winner = allVariations.rows[0];
      console.log(`   Winner: "${winner.company_name}" (renaming to "i Fund Cities LLC")`);
      
      // Rename to standard name
      await dbClient.query(`
        UPDATE clients 
        SET company_name = 'i Fund Cities LLC',
            client_type = 'company'
        WHERE id = $1
      `, [winner.id]);
      
      winner.company_name = 'i Fund Cities LLC';
    } else {
      console.log(`   Winner: "${winner.company_name}"`);
      console.log(`   Current: ${winner.order_count} orders, ${winner.contact_count} contacts`);
    }

    // Ensure winner is marked as company
    await dbClient.query(`
      UPDATE clients
      SET client_type = 'company'
      WHERE id = $1
    `, [winner.id]);

    // Step 3: Merge all duplicates into winner
    console.log('\n📋 Step 3: Merging duplicates...\n');
    
    const duplicates = allVariations.rows.filter(r => r.id !== winner.id);
    
    if (duplicates.length === 0) {
      console.log('   No duplicates to merge!\n');
      return;
    }
    
    console.log(`   Merging ${duplicates.length} duplicates into "${winner.company_name}":\n`);
    
    let totalOrdersMoved = 0;
    let totalContactsMoved = 0;
    
    for (const dup of duplicates) {
      console.log(`   Processing: "${dup.company_name}"`);
      
      // Move orders
      if (dup.order_count > 0) {
        const orderResult = await dbClient.query(`
          UPDATE orders
          SET client_id = $1
          WHERE client_id = $2
        `, [winner.id, dup.id]);
        
        console.log(`      ✅ Moved ${orderResult.rowCount} orders`);
        totalOrdersMoved += orderResult.rowCount;
      }
      
      // Move contacts
      if (dup.contact_count > 0) {
        const contactResult = await dbClient.query(`
          UPDATE contacts
          SET client_id = $1
          WHERE client_id = $2
        `, [winner.id, dup.id]);
        
        console.log(`      ✅ Moved ${contactResult.rowCount} contacts`);
        totalContactsMoved += contactResult.rowCount;
      }
      
      // Delete duplicate
      await dbClient.query(`DELETE FROM clients WHERE id = $1`, [dup.id]);
      console.log(`      ✅ Deleted duplicate client\n`);
    }

    // Step 4: Verify final state
    console.log('=' .repeat(60));
    console.log('📊 FINAL RESULTS');
    console.log('=' .repeat(60) + '\n');
    
    const finalState = await dbClient.query(`
      SELECT 
        company_name,
        client_type,
        (SELECT COUNT(*) FROM orders WHERE client_id = clients.id) as order_count,
        (SELECT COUNT(*) FROM contacts WHERE client_id = clients.id) as contact_count
      FROM clients
      WHERE id = $1
    `, [winner.id]);
    
    if (finalState.rows.length > 0) {
      const final = finalState.rows[0];
      console.log('✅ i Fund Cities LLC (consolidated):');
      console.log(`   - Orders: ${final.order_count}`);
      console.log(`   - Contacts: ${final.contact_count}`);
      console.log(`   - Type: ${final.client_type}`);
      console.log(`   - ID: ${winner.id}`);
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   - Merged ${duplicates.length} duplicate clients`);
    console.log(`   - Moved ${totalOrdersMoved} orders`);
    console.log(`   - Moved ${totalContactsMoved} contacts`);
    
    // Check for any remaining variations
    const remaining = await dbClient.query(`
      SELECT company_name, COUNT(*) as count
      FROM clients
      WHERE LOWER(company_name) SIMILAR TO '%(i|1)%fund%(cities|cties|s|)%'
        OR company_name ILIKE '%Fund Cities%'
        OR company_name ILIKE '%iFund%'
      GROUP BY company_name
    `);
    
    console.log(`\n📋 Remaining variations: ${remaining.rows.length}`);
    if (remaining.rows.length > 1) {
      console.log('   ⚠️  Still have duplicates:');
      remaining.rows.forEach(r => console.log(`      - ${r.company_name}`));
    } else {
      console.log('   ✅ All consolidated into single client!');
    }

    console.log('\n' + '=' .repeat(60));
    console.log('✅ CONSOLIDATION COMPLETE!');
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

