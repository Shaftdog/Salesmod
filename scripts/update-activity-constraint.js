const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();

    console.log('Dropping existing constraint...');
    await client.query('ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_activity_type_check');

    console.log('Adding updated constraint with research...');
    await client.query(`
      ALTER TABLE public.activities
      ADD CONSTRAINT activities_activity_type_check
      CHECK (activity_type IN ('call', 'email', 'meeting', 'note', 'task', 'research'))
    `);

    console.log('✓ Constraint updated successfully!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
