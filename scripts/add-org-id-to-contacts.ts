/**
 * Add org_id column to contacts table manually
 * This is the surgical fix for the Gmail card creation bug
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

// We need to use a PostgreSQL client for DDL operations
import pkg from 'pg';
const { Client } = pkg;

async function main() {
  console.log('Adding org_id column to contacts table...');
  console.log('='.repeat(80));

  const connectionString = process.env.DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!.replace('https://', 'postgresql://postgres:') + '/postgres';

  console.log('\nNote: This script requires direct database access.');
  console.log('If DATABASE_URL is not set, we will use Supabase client methods.\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check if org_id already exists
  console.log('Checking if org_id column already exists...');

  const { data: sample } = await supabase
    .from('contacts')
    .select('*')
    .limit(1)
    .single();

  if (sample && 'org_id' in sample) {
    console.log('✓ org_id column already exists on contacts table');

    // Check how many contacts have org_id populated
    const { count: withOrgId } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .not('org_id', 'is', null);

    const { count: total } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true });

    console.log(`  ${withOrgId}/${total} contacts have org_id populated`);

    if (withOrgId === 0 || (withOrgId! < total!)) {
      console.log('\nBackfilling org_id from clients...');

      // Get all contacts with clients but no org_id
      const { data: contactsToUpdate } = await supabase
        .from('contacts')
        .select(`
          id,
          client_id,
          clients!inner (
            org_id
          )
        `)
        .not('client_id', 'is', null)
        .is('org_id', null);

      console.log(`  Found ${contactsToUpdate?.length || 0} contacts to update`);

      if (contactsToUpdate && contactsToUpdate.length > 0) {
        for (const contact of contactsToUpdate) {
          const orgId = (contact.clients as any).org_id;

          const { error } = await supabase
            .from('contacts')
            .update({ org_id: orgId })
            .eq('id', contact.id);

          if (error) {
            console.error(`  Error updating contact ${contact.id}:`, error);
          } else {
            console.log(`  ✓ Updated contact ${contact.id} with org_id ${orgId}`);
          }
        }

        console.log('\n✓ Backfill complete');
      }
    }

    console.log('\n✓ Migration already applied');
    return;
  }

  console.log('\n× org_id column does NOT exist');
  console.log('\nWe need to run DDL commands which require direct database access.');
  console.log('Please run the migration file manually:');
  console.log('  supabase/migrations/20251116000000_add_org_id_to_contacts.sql');
  console.log('\nOr use the Supabase Dashboard > SQL Editor to execute the migration.');
}

main().catch(console.error);
