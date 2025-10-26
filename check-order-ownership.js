/**
 * CHECK ORDER OWNERSHIP ISSUE
 * See if orders are assigned to wrong user
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

    // Check all profiles
    const profiles = await dbClient.query(`
      SELECT id, name, email
      FROM profiles
      ORDER BY created_at
    `);
    
    console.log(`👥 Profiles in database: ${profiles.rows.length}\n`);
    profiles.rows.forEach((p, i) => {
      console.log(`   ${i+1}. ${p.email || 'No email'} (${p.name || 'No name'})`);
      console.log(`      ID: ${p.id}`);
    });

    // Check order distribution by created_by
    console.log('\n📊 Orders by created_by:\n');
    const ordersByUser = await dbClient.query(`
      SELECT 
        created_by,
        COUNT(*) as order_count,
        MIN(ordered_date::date) as earliest,
        MAX(ordered_date::date) as latest
      FROM orders
      WHERE source = 'asana'
      GROUP BY created_by
      ORDER BY order_count DESC
    `);
    
    ordersByUser.rows.forEach((row, i) => {
      const profile = profiles.rows.find(p => p.id === row.created_by);
      console.log(`   User ${i+1}: ${profile?.email || 'Unknown'}`);
      console.log(`      Orders: ${row.order_count}`);
      console.log(`      Date range: ${row.earliest} to ${row.latest}\n`);
    });

    console.log('💡 Analysis:');
    if (ordersByUser.rows.length > 1) {
      console.log('   ⚠️  Orders are split across multiple users!');
      console.log('   The UI filters by logged-in user (RLS policy)');
      console.log('   So you only see orders where created_by = your_user_id');
    } else {
      console.log('   ✅ All orders owned by same user');
      console.log('   The UI discrepancy might be a different issue');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await dbClient.end();
  }
}

main();

