/**
 * Get user IDs from the database
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function getUsers() {
  try {
    const client = await pool.connect();

    const { rows } = await client.query(`
      SELECT id, email, full_name
      FROM profiles
      ORDER BY created_at DESC
      LIMIT 5;
    `);

    console.log(`\nFound ${rows.length} users:\n`);
    rows.forEach(row => {
      console.log(`${row.email || 'No email'} (${row.full_name || 'No name'})`);
      console.log(`  ID: ${row.id}\n`);
    });

    client.release();
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

getUsers().catch(console.error);
