/**
 * Execute migration to add org_id to contacts using direct PostgreSQL connection
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Client } = pg;

async function main() {
  console.log('Executing Contacts Migration');
  console.log('='.repeat(80));

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL environment variable not set');
    process.exit(1);
  }

  console.log('Connecting to database...');

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // Read migration file
    const migrationPath = join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      '20251116000000_add_org_id_to_contacts.sql'
    );

    console.log(`Reading migration file: ${migrationPath}`);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('\nExecuting migration...\n');

    // Execute the migration
    await client.query(migrationSQL);

    console.log('✓ Migration executed successfully\n');

    // Verify the changes
    console.log('Verifying migration...');

    const result = await client.query(`
      SELECT
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'contacts'
        AND column_name = 'org_id';
    `);

    if (result.rows.length > 0) {
      console.log('✓ org_id column added to contacts table');
      console.log('  Column details:', result.rows[0]);
    } else {
      console.log('× org_id column not found - migration may have failed');
    }

    // Check backfill
    const countResult = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(org_id) as with_org_id
      FROM contacts;
    `);

    const { total, with_org_id } = countResult.rows[0];
    console.log(`\nContacts: ${with_org_id}/${total} have org_id populated`);

    // Check indexes
    const indexResult = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'contacts'
        AND indexname LIKE '%org_id%';
    `);

    console.log(`\nIndexes created: ${indexResult.rows.length}`);
    indexResult.rows.forEach(row => {
      console.log(`  - ${row.indexname}`);
    });

    console.log('\n✓ Migration complete!');

  } catch (error) {
    console.error('\n× Migration failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n✓ Database connection closed');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
