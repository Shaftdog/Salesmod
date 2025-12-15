const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres.zqhenxhgcjxslpfezybm:NsjCsuLJfBswVhdI@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

async function migrateLegacyPolicies() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    console.log('='.repeat(80));
    console.log('PHASE 5: MIGRATE LEGACY ORG_ID POLICIES');
    console.log('='.repeat(80) + '\n');

    // Tables with legacy org_id policies
    const legacyTables = [
      'validation_logs',
      'property_units',
      'merge_audit',
      'service_territories',
      'equipment_catalog'
    ];

    console.log('📊 Processing tables with legacy policies...\n');

    for (const table of legacyTables) {
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`Processing: ${table}`);
      console.log('─'.repeat(80));

      // Check if table exists
      const { rows: tableExists } = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = $1
        ) as exists
      `, [table]);

      if (!tableExists[0].exists) {
        console.log(`⏭️  Table does not exist, skipping\n`);
        continue;
      }

      // Check if tenant_id column exists
      const { rows: colExists } = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1 AND column_name = 'tenant_id'
        ) as exists
      `, [table]);

      // Add tenant_id column if missing
      if (!colExists[0].exists) {
        console.log('1️⃣  Adding tenant_id column...');
        await client.query(`
          ALTER TABLE public.${table}
          ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE
        `);
        console.log('   ✅ tenant_id column added');
      } else {
        console.log('1️⃣  tenant_id column already exists');
      }

      // Backfill tenant_id from org_id
      console.log('2️⃣  Backfilling tenant_id from org_id...');
      const result = await client.query(`
        UPDATE public.${table} t
        SET tenant_id = p.tenant_id
        FROM public.profiles p
        WHERE t.org_id = p.id AND t.tenant_id IS NULL AND p.tenant_id IS NOT NULL
      `);
      console.log(`   ✅ Updated ${result.rowCount} rows`);

      // Check for remaining NULLs
      const { rows: nullCheck } = await client.query(`
        SELECT COUNT(*) as count FROM ${table} WHERE tenant_id IS NULL
      `);
      const nullCount = parseInt(nullCheck[0].count);

      if (nullCount > 0) {
        console.log(`   ⚠️  ${nullCount} rows still have NULL tenant_id (may be orphaned)`);
      } else {
        // Make NOT NULL if no NULLs
        await client.query(`ALTER TABLE public.${table} ALTER COLUMN tenant_id SET NOT NULL`);
        console.log('   ✅ tenant_id set to NOT NULL');

        // Create index
        await client.query(`CREATE INDEX IF NOT EXISTS idx_${table}_tenant_id ON public.${table}(tenant_id)`);
        console.log('   ✅ Index created');
      }

      // Get existing legacy policies
      console.log('3️⃣  Identifying legacy org_id policies...');
      const { rows: legacyPolicies } = await client.query(`
        SELECT policyname, qual::text as qual
        FROM pg_policies
        WHERE tablename = $1
          AND schemaname = 'public'
          AND (
            qual::text LIKE '%org_id = auth.uid()%'
            OR with_check::text LIKE '%org_id = auth.uid()%'
          )
      `, [table]);

      if (legacyPolicies.length === 0) {
        console.log('   ℹ️  No legacy org_id policies found');
      } else {
        console.log(`   Found ${legacyPolicies.length} legacy policies:`);
        legacyPolicies.forEach(p => console.log(`      - ${p.policyname}`));
      }

      // Drop legacy policies
      console.log('4️⃣  Dropping legacy org_id policies...');
      for (const policy of legacyPolicies) {
        try {
          await client.query(`DROP POLICY IF EXISTS "${policy.policyname}" ON public.${table}`);
          console.log(`   ✅ Dropped: ${policy.policyname}`);
        } catch (error) {
          console.log(`   ❌ Error dropping ${policy.policyname}: ${error.message}`);
        }
      }

      // Create tenant isolation policy
      console.log('5️⃣  Creating tenant isolation policy...');
      try {
        await client.query(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);

        await client.query(`
          CREATE POLICY ${table}_tenant_isolation
            ON public.${table}
            FOR ALL
            USING (tenant_id IN (
              SELECT tenant_id FROM profiles WHERE id = auth.uid()
            ))
            WITH CHECK (tenant_id IN (
              SELECT tenant_id FROM profiles WHERE id = auth.uid()
            ))
        `);
        console.log('   ✅ tenant_isolation policy created');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('   ℹ️  tenant_isolation policy already exists');
        } else {
          console.log(`   ❌ Error creating policy: ${error.message}`);
        }
      }
    }

    // Final verification
    console.log('\n' + '='.repeat(80));
    console.log('FINAL VERIFICATION');
    console.log('='.repeat(80) + '\n');

    const { rows: remainingLegacy } = await client.query(`
      SELECT tablename, policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND (
          qual::text LIKE '%org_id = auth.uid()%'
          OR with_check::text LIKE '%org_id = auth.uid()%'
        )
      ORDER BY tablename, policyname
    `);

    if (remainingLegacy.length === 0) {
      console.log('✅ SUCCESS: No legacy org_id policies remaining!');
    } else {
      console.log(`⚠️  ${remainingLegacy.length} legacy org_id policies still exist:`);
      remainingLegacy.forEach(p => console.log(`   - ${p.tablename}.${p.policyname}`));
    }

    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

migrateLegacyPolicies();
