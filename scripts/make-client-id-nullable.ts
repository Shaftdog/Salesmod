/**
 * Make client_id nullable on contacts table
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Client } = pg;

async function main() {
  console.log('Making client_id nullable on contacts table');
  console.log('='.repeat(80));

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  console.log('\\nExecuting: ALTER TABLE contacts ALTER COLUMN client_id DROP NOT NULL;');

  try {
    await client.query('ALTER TABLE contacts ALTER COLUMN client_id DROP NOT NULL;');
    console.log('✓ client_id is now nullable');

    // Verify
    const result = await client.query(`
      SELECT
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'contacts'
        AND column_name = 'client_id';
    `);

    console.log('\\nVerification:');
    console.log(result.rows[0]);

  } catch (error: any) {
    console.error('✗ Error:', error.message);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
