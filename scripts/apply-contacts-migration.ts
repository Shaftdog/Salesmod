/**
 * Apply migration to add org_id to contacts table
 * Run with: npx tsx scripts/apply-contacts-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function main() {
  console.log('Applying contacts migration...');
  console.log('='.repeat(80));

  // Read the migration file
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251116000000_add_org_id_to_contacts.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('\nMigration SQL:');
  console.log('-'.repeat(80));
  console.log(migrationSQL);
  console.log('-'.repeat(80));

  // Execute the migration
  console.log('\nExecuting migration...');

  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('Migration failed:', error);

      // Try executing statements one by one
      console.log('\nTrying to execute statements individually...');
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i] + ';';
        console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
        console.log(stmt.substring(0, 100) + '...');

        const { error: stmtError } = await supabase.rpc('exec_sql', { sql: stmt });

        if (stmtError) {
          console.error(`Statement ${i + 1} failed:`, stmtError);
        } else {
          console.log(`Statement ${i + 1} succeeded`);
        }
      }
    } else {
      console.log('Migration succeeded!', data);
    }

    // Verify the migration
    console.log('\nVerifying migration...');
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, email, org_id, client_id')
      .limit(3);

    console.log('\nSample contacts after migration:');
    contacts?.forEach(c => {
      console.log(`  ${c.email}: org_id=${c.org_id}, client_id=${c.client_id}`);
    });

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

main().catch(console.error);
