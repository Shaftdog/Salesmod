#!/usr/bin/env node

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.zqhenxhgcjxslpfezybm:NsjCsuLJfBswVhdI@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function checkCards() {
  try {
    console.log('🔍 Checking kanban_cards table...\n');
    
    // Check total cards
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM kanban_cards');
    console.log(`📊 Total cards in database: ${totalResult.rows[0].total}`);
    
    // Check cards by state
    const stateResult = await pool.query(`
      SELECT state, COUNT(*) as count 
      FROM kanban_cards 
      GROUP BY state 
      ORDER BY count DESC
    `);
    console.log('\n📈 Cards by state:');
    stateResult.rows.forEach(row => {
      console.log(`  - ${row.state}: ${row.count}`);
    });
    
    // Check recent cards
    const recentResult = await pool.query(`
      SELECT id, org_id, type, title, state, priority, created_at 
      FROM kanban_cards 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    console.log('\n📝 Recent cards:');
    recentResult.rows.forEach((row, i) => {
      console.log(`\n  ${i + 1}. ${row.title}`);
      console.log(`     ID: ${row.id}`);
      console.log(`     Org ID: ${row.org_id}`);
      console.log(`     Type: ${row.type}`);
      console.log(`     State: ${row.state}`);
      console.log(`     Priority: ${row.priority}`);
      console.log(`     Created: ${row.created_at}`);
    });
    
    // Check distinct org_ids
    const orgResult = await pool.query(`
      SELECT org_id, COUNT(*) as card_count 
      FROM kanban_cards 
      GROUP BY org_id
    `);
    console.log('\n👥 Cards by org_id:');
    orgResult.rows.forEach(row => {
      console.log(`  - ${row.org_id}: ${row.card_count} cards`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkCards();


