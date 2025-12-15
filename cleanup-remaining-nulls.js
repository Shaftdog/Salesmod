const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres.zqhenxhgcjxslpfezybm:NsjCsuLJfBswVhdI@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

async function cleanupRemainingNulls() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    console.log('='.repeat(80));
    console.log('PHASE 5: CLEANUP REMAINING NULL TENANT_ID VALUES');
    console.log('='.repeat(80) + '\n');

    // 1. Clean up production_tasks (124 NULL values)
    console.log('1️⃣  Cleaning production_tasks...');

    // Check what columns production_tasks has
    const { rows: ptCols } = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'production_tasks'
        AND column_name IN ('org_id', 'created_by', 'assigned_to')
    `);
    console.log('   Available columns:', ptCols.map(c => c.column_name).join(', '));

    // Try to backfill from created_by or assigned_to
    try {
      const r1 = await client.query(`
        UPDATE public.production_tasks pt
        SET tenant_id = p.tenant_id
        FROM public.profiles p
        WHERE pt.created_by = p.id AND pt.tenant_id IS NULL AND p.tenant_id IS NOT NULL
      `);
      console.log(`   ✅ Updated ${r1.rowCount} production_tasks from created_by`);
    } catch (error) {
      console.log(`   ⚠️  created_by approach failed: ${error.message}`);
    }

    // If still NULLs, delete orphaned records
    const { rows: ptNulls } = await client.query(`
      SELECT COUNT(*) as count FROM production_tasks WHERE tenant_id IS NULL
    `);
    if (parseInt(ptNulls[0].count) > 0) {
      const r1b = await client.query(`DELETE FROM production_tasks WHERE tenant_id IS NULL`);
      console.log(`   ✅ Deleted ${r1b.rowCount} orphaned production_tasks\n`);
    } else {
      console.log('   ✅ All production_tasks have tenant_id\n');
    }

    // 2. Clean up production_template_subtasks (280 NULL values)
    console.log('2️⃣  Cleaning production_template_subtasks...');

    // Check structure
    const { rows: ptsCols } = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'production_template_subtasks'
        AND column_name IN ('template_task_id', 'template_id', 'org_id')
    `);
    console.log('   Available columns:', ptsCols.map(c => c.column_name).join(', '));

    // Try to backfill from template_task_id
    try {
      const r2 = await client.query(`
        UPDATE public.production_template_subtasks pts
        SET tenant_id = ptt.tenant_id
        FROM public.production_template_tasks ptt
        WHERE pts.template_task_id = ptt.id AND pts.tenant_id IS NULL AND ptt.tenant_id IS NOT NULL
      `);
      console.log(`   ✅ Updated ${r2.rowCount} production_template_subtasks from template_task_id`);
    } catch (error) {
      console.log(`   ⚠️  template_task_id approach failed: ${error.message}`);
    }

    // If still NULLs, delete orphaned records
    const { rows: ptsNulls } = await client.query(`
      SELECT COUNT(*) as count FROM production_template_subtasks WHERE tenant_id IS NULL
    `);
    if (parseInt(ptsNulls[0].count) > 0) {
      const r2b = await client.query(`DELETE FROM production_template_subtasks WHERE tenant_id IS NULL`);
      console.log(`   ✅ Deleted ${r2b.rowCount} orphaned production_template_subtasks\n`);
    } else {
      console.log('   ✅ All production_template_subtasks have tenant_id\n');
    }

    // 3. Clean up agent_settings (1 NULL value)
    console.log('3️⃣  Cleaning agent_settings...');

    const { rows: asCols } = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'agent_settings'
        AND column_name IN ('org_id', 'user_id', 'created_by')
    `);
    console.log('   Available columns:', asCols.map(c => c.column_name).join(', '));

    // Try org_id
    try {
      const r3 = await client.query(`
        UPDATE public.agent_settings a_set
        SET tenant_id = p.tenant_id
        FROM public.profiles p
        WHERE a_set.org_id = p.id AND a_set.tenant_id IS NULL AND p.tenant_id IS NOT NULL
      `);
      console.log(`   ✅ Updated ${r3.rowCount} agent_settings from org_id`);
    } catch (error) {
      console.log(`   ⚠️  org_id approach failed: ${error.message}`);
    }

    // If still NULL, delete
    const { rows: asNulls } = await client.query(`
      SELECT COUNT(*) as count FROM agent_settings WHERE tenant_id IS NULL
    `);
    if (parseInt(asNulls[0].count) > 0) {
      const r3b = await client.query(`DELETE FROM agent_settings WHERE tenant_id IS NULL`);
      console.log(`   ✅ Deleted ${r3b.rowCount} orphaned agent_settings\n`);
    } else {
      console.log('   ✅ All agent_settings have tenant_id\n');
    }

    // 4. Clean up goals (3 NULL values)
    console.log('4️⃣  Cleaning goals...');

    const { rows: goalsCols } = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'goals'
        AND column_name IN ('org_id', 'user_id', 'created_by')
    `);
    console.log('   Available columns:', goalsCols.map(c => c.column_name).join(', '));

    // Try org_id
    try {
      const r4 = await client.query(`
        UPDATE public.goals g
        SET tenant_id = p.tenant_id
        FROM public.profiles p
        WHERE g.org_id = p.id AND g.tenant_id IS NULL AND p.tenant_id IS NOT NULL
      `);
      console.log(`   ✅ Updated ${r4.rowCount} goals from org_id`);
    } catch (error) {
      console.log(`   ⚠️  org_id approach failed: ${error.message}`);
    }

    // Try user_id
    try {
      const r4b = await client.query(`
        UPDATE public.goals g
        SET tenant_id = p.tenant_id
        FROM public.profiles p
        WHERE g.user_id = p.id AND g.tenant_id IS NULL AND p.tenant_id IS NOT NULL
      `);
      console.log(`   ✅ Updated ${r4b.rowCount} goals from user_id`);
    } catch (error) {
      console.log(`   ⚠️  user_id approach failed: ${error.message}`);
    }

    // If still NULL, delete
    const { rows: goalsNulls } = await client.query(`
      SELECT COUNT(*) as count FROM goals WHERE tenant_id IS NULL
    `);
    if (parseInt(goalsNulls[0].count) > 0) {
      const r4c = await client.query(`DELETE FROM goals WHERE tenant_id IS NULL`);
      console.log(`   ✅ Deleted ${r4c.rowCount} orphaned goals\n`);
    } else {
      console.log('   ✅ All goals have tenant_id\n');
    }

    // Final verification
    console.log('='.repeat(80));
    console.log('FINAL VERIFICATION');
    console.log('='.repeat(80) + '\n');

    const tables = ['production_tasks', 'production_template_subtasks', 'agent_settings', 'goals'];
    let totalNulls = 0;

    for (const table of tables) {
      const { rows } = await client.query(`SELECT COUNT(*) as count FROM ${table} WHERE tenant_id IS NULL`);
      const nullCount = parseInt(rows[0].count);
      totalNulls += nullCount;

      if (nullCount === 0) {
        console.log(`✅ ${table.padEnd(35)} - All records have tenant_id`);
      } else {
        console.log(`⚠️  ${table.padEnd(35)} - ${nullCount} NULL values remaining`);
      }
    }

    console.log('\n' + '='.repeat(80));
    if (totalNulls === 0) {
      console.log('✅ SUCCESS: All non-critical tables cleaned up!');
    } else {
      console.log(`⚠️  ${totalNulls} NULL values remain (may be acceptable orphans)`);
    }
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

cleanupRemainingNulls();
