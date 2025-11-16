/**
 * Check contacts table constraints
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
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  // Get constraint info
  const result = await client.query(`
    SELECT
      conname as constraint_name,
      contype as constraint_type,
      pg_get_constraintdef(oid) as constraint_definition
    FROM pg_constraint
    WHERE conrelid = 'contacts'::regclass
    ORDER BY conname;
  `);

  console.log('Contacts table constraints:');
  console.log('='.repeat(80));

  result.rows.forEach(row => {
    console.log(`\\n${row.constraint_name} (${row.constraint_type}):`);
    console.log(`  ${row.constraint_definition}`);
  });

  // Get column nullability
  const colResult = await client.query(`
    SELECT
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_name = 'contacts'
    ORDER BY ordinal_position;
  `);

  console.log('\\n\\nContacts table columns:');
  console.log('='.repeat(80));

  colResult.rows.forEach(col => {
    const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
    console.log(`${col.column_name}: ${col.data_type} ${nullable}`);
    if (col.column_default) {
      console.log(`  Default: ${col.column_default}`);
    }
  });

  await client.end();
}

main().catch(console.error);
