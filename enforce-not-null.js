const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres.zqhenxhgcjxslpfezybm:NsjCsuLJfBswVhdI@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

async function enforceNotNull() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    console.log('='.repeat(80));
    console.log('ENFORCING NOT NULL CONSTRAINTS');
    console.log('='.repeat(80) + '\n');

    // Core tables that must have NOT NULL tenant_id
    const coreTables = [
      'clients', 'orders', 'properties', 'contacts', 'activities',
      'kanban_cards', 'jobs', 'agent_runs', 'campaigns', 'invoices',
      'products', 'contact_companies'
    ];

    for (const table of coreTables) {
      try {
        // Check for NULLs first
        const { rows } = await client.query(`SELECT COUNT(*) as count FROM ${table} WHERE tenant_id IS NULL`);
        const nullCount = parseInt(rows[0].count);

        if (nullCount > 0) {
          console.log(`⚠️  ${table.padEnd(30)} - ${nullCount} NULLs found, skipping NOT NULL`);
          continue;
        }

        // Make NOT NULL
        await client.query(`ALTER TABLE public.${table} ALTER COLUMN tenant_id SET NOT NULL`);
        console.log(`✅ ${table.padEnd(30)} - tenant_id is now NOT NULL`);

        // Create index
        await client.query(`CREATE INDEX IF NOT EXISTS idx_${table}_tenant_id ON public.${table}(tenant_id)`);
        console.log(`   📊 Index created: idx_${table}_tenant_id`);

      } catch (error) {
        console.log(`❌ ${table.padEnd(30)} - ERROR: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('NOT NULL ENFORCEMENT COMPLETE');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

enforceNotNull();
