const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres.zqhenxhgcjxslpfezybm:NsjCsuLJfBswVhdI@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

async function backfillTenantId() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    console.log('='.repeat(80));
    console.log('BACKFILLING TENANT_ID VALUES');
    console.log('='.repeat(80) + '\n');

    // Backfill from org_id → user's tenant_id
    const orgIdTables = [
      'kanban_cards', 'production_cards', 'production_tasks', 'jobs',
      'agent_runs', 'agent_memories', 'campaigns', 'invoices', 'products',
      'webinars', 'oauth_tokens', 'production_templates', 'production_resources',
      'production_alerts', 'production_agent_runs', 'email_suppressions'
    ];

    console.log('📊 Backfilling tables with org_id:\n');
    for (const table of orgIdTables) {
      try {
        const result = await client.query(`
          UPDATE public.${table} t
          SET tenant_id = p.tenant_id
          FROM public.profiles p
          WHERE t.org_id = p.id AND t.tenant_id IS NULL
        `);
        console.log(`✅ ${table.padEnd(35)} - ${result.rowCount} rows updated`);
      } catch (error) {
        console.log(`❌ ${table.padEnd(35)} - ERROR: ${error.message}`);
      }
    }

    // Backfill child tables
    console.log('\n📊 Backfilling child tables:\n');

    const childTables = [
      { table: 'production_template_tasks', parent: 'production_templates', key: 'template_id' },
      { table: 'production_template_subtasks', parent: 'production_template_tasks', key: 'task_id' },
      { table: 'production_time_entries', parent: 'production_tasks', key: 'task_id' },
      { table: 'job_tasks', parent: 'jobs', key: 'job_id' },
      { table: 'invoice_line_items', parent: 'invoices', key: 'invoice_id' },
      { table: 'agent_reflections', parent: 'agent_runs', key: 'run_id' },
      { table: 'agent_settings', parent: 'profiles', key: 'user_id' },
      { table: 'webinar_registrations', parent: 'webinars', key: 'webinar_id' },
      { table: 'campaign_contact_status', parent: 'campaigns', key: 'campaign_id' },
    ];

    for (const { table, parent, key } of childTables) {
      try {
        const result = await client.query(`
          UPDATE public.${table} c
          SET tenant_id = p.tenant_id
          FROM public.${parent} p
          WHERE c.${key} = p.id AND c.tenant_id IS NULL
        `);
        console.log(`✅ ${table.padEnd(35)} - ${result.rowCount} rows updated (from ${parent})`);
      } catch (error) {
        console.log(`❌ ${table.padEnd(35)} - ERROR: ${error.message}`);
      }
    }

    // Backfill goals from user_id
    console.log('\n📊 Backfilling goals:\n');
    try {
      const result = await client.query(`
        UPDATE public.goals g
        SET tenant_id = p.tenant_id
        FROM public.profiles p
        WHERE g.user_id = p.id AND g.tenant_id IS NULL
      `);
      console.log(`✅ goals - ${result.rowCount} rows updated`);
    } catch (error) {
      console.log(`❌ goals - ERROR: ${error.message}`);
    }

    // Backfill activities from client
    console.log('\n📊 Backfilling activities and contact_companies:\n');
    try {
      const result1 = await client.query(`
        UPDATE public.activities a
        SET tenant_id = c.tenant_id
        FROM public.clients c
        WHERE a.client_id = c.id AND a.tenant_id IS NULL
      `);
      console.log(`✅ activities - ${result1.rowCount} rows updated (from clients)`);
    } catch (error) {
      console.log(`❌ activities - ERROR: ${error.message}`);
    }

    try {
      const result2 = await client.query(`
        UPDATE public.contact_companies cc
        SET tenant_id = c.tenant_id
        FROM public.contacts c
        WHERE cc.contact_id = c.id AND cc.tenant_id IS NULL
      `);
      console.log(`✅ contact_companies - ${result2.rowCount} rows updated (from contacts)`);
    } catch (error) {
      console.log(`❌ contact_companies - ERROR: ${error.message}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('BACKFILL COMPLETE');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

backfillTenantId();
