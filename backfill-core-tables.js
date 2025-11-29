const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres.zqhenxhgcjxslpfezybm:NsjCsuLJfBswVhdI@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

async function backfillCoreTables() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    console.log('='.repeat(80));
    console.log('BACKFILLING CORE BUSINESS TABLES');
    console.log('='.repeat(80) + '\n');

    // Backfill clients from org_id → user's tenant_id
    console.log('1️⃣  Backfilling clients...');
    const r1 = await client.query(`
      UPDATE public.clients c
      SET tenant_id = p.tenant_id
      FROM public.profiles p
      WHERE c.org_id = p.id AND c.tenant_id IS NULL
    `);
    console.log(`   ✅ Updated ${r1.rowCount} clients\n`);

    // Backfill orders from org_id → user's tenant_id
    console.log('2️⃣  Backfilling orders...');
    const r2 = await client.query(`
      UPDATE public.orders o
      SET tenant_id = p.tenant_id
      FROM public.profiles p
      WHERE o.org_id = p.id AND o.tenant_id IS NULL
    `);
    console.log(`   ✅ Updated ${r2.rowCount} orders\n`);

    // Backfill properties from org_id → user's tenant_id
    console.log('3️⃣  Backfilling properties...');
    const r3 = await client.query(`
      UPDATE public.properties pr
      SET tenant_id = p.tenant_id
      FROM public.profiles p
      WHERE pr.org_id = p.id AND pr.tenant_id IS NULL
    `);
    console.log(`   ✅ Updated ${r3.rowCount} properties\n`);

    // Backfill activities - try multiple strategies
    console.log('4️⃣  Backfilling activities...');

    // Strategy 1: From client
    const r4a = await client.query(`
      UPDATE public.activities a
      SET tenant_id = c.tenant_id
      FROM public.clients c
      WHERE a.client_id = c.id AND a.tenant_id IS NULL AND c.tenant_id IS NOT NULL
    `);
    console.log(`   ✅ Updated ${r4a.rowCount} activities from clients`);

    // Strategy 2: From order
    const r4b = await client.query(`
      UPDATE public.activities a
      SET tenant_id = o.tenant_id
      FROM public.orders o
      WHERE a.order_id = o.id AND a.tenant_id IS NULL AND o.tenant_id IS NOT NULL
    `);
    console.log(`   ✅ Updated ${r4b.rowCount} activities from orders`);

    // Strategy 3: From created_by
    const r4c = await client.query(`
      UPDATE public.activities a
      SET tenant_id = p.tenant_id
      FROM public.profiles p
      WHERE a.created_by = p.id AND a.tenant_id IS NULL AND p.tenant_id IS NOT NULL
    `);
    console.log(`   ✅ Updated ${r4c.rowCount} activities from created_by\n`);

    // Backfill contact_companies from contacts
    console.log('5️⃣  Backfilling contact_companies...');

    // First check if contacts have tenant_id
    const { rows: contactsCheck } = await client.query(`
      SELECT COUNT(*) as count FROM contacts WHERE tenant_id IS NOT NULL LIMIT 1
    `);

    if (parseInt(contactsCheck[0].count) > 0) {
      const r5 = await client.query(`
        UPDATE public.contact_companies cc
        SET tenant_id = c.tenant_id
        FROM public.contacts c
        WHERE cc.contact_id = c.id AND cc.tenant_id IS NULL AND c.tenant_id IS NOT NULL
      `);
      console.log(`   ✅ Updated ${r5.rowCount} contact_companies\n`);
    } else {
      // Backfill from client via contact
      const r5b = await client.query(`
        UPDATE public.contact_companies cc
        SET tenant_id = cl.tenant_id
        FROM public.contacts c
        JOIN public.clients cl ON c.client_id = cl.id
        WHERE cc.contact_id = c.id AND cc.tenant_id IS NULL AND cl.tenant_id IS NOT NULL
      `);
      console.log(`   ✅ Updated ${r5b.rowCount} contact_companies from client\n`);
    }

    // Backfill production_tasks from production_cards
    console.log('6️⃣  Backfilling production_tasks...');
    const r6 = await client.query(`
      UPDATE public.production_tasks pt
      SET tenant_id = pc.tenant_id
      FROM public.production_cards pc
      WHERE pt.card_id = pc.id AND pt.tenant_id IS NULL AND pc.tenant_id IS NOT NULL
    `);
    console.log(`   ✅ Updated ${r6.rowCount} production_tasks\n`);

    // Backfill production_template_subtasks
    console.log('7️⃣  Backfilling production_template_subtasks...');
    const r7 = await client.query(`
      UPDATE public.production_template_subtasks pts
      SET tenant_id = ptt.tenant_id
      FROM public.production_template_tasks ptt
      WHERE pts.template_task_id = ptt.id AND pts.tenant_id IS NULL AND ptt.tenant_id IS NOT NULL
    `);
    console.log(`   ✅ Updated ${r7.rowCount} production_template_subtasks\n`);

    // Backfill agent_settings and goals
    console.log('8️⃣  Backfilling agent_settings and goals...');
    const r8 = await client.query(`
      UPDATE public.agent_settings a_set
      SET tenant_id = p.tenant_id
      FROM public.profiles p
      WHERE a_set.org_id = p.id AND a_set.tenant_id IS NULL
    `);
    console.log(`   ✅ Updated ${r8.rowCount} agent_settings`);

    const r9 = await client.query(`
      UPDATE public.goals g
      SET tenant_id = p.tenant_id
      FROM public.profiles p
      WHERE g.org_id = p.id AND g.tenant_id IS NULL
    `);
    console.log(`   ✅ Updated ${r9.rowCount} goals\n`);

    console.log('='.repeat(80));
    console.log('BACKFILL COMPLETE');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

backfillCoreTables();
