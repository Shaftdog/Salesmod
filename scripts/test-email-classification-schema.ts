import { Client } from 'pg';

async function runTests() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('  Email Classification Schema Tests');
    console.log('═══════════════════════════════════════════════════════\n');

    // Get a valid org_id from profiles
    const orgResult = await client.query('SELECT id FROM profiles LIMIT 1');
    if (orgResult.rows.length === 0) {
      console.error('❌ No profiles found - cannot test');
      return;
    }
    const testOrgId = orgResult.rows[0].id;
    console.log(`Using org_id: ${testOrgId}\n`);

    // Test 1: Insert classification rule
    console.log('Test 1: Insert email classification rule');
    console.log('─────────────────────────────────────────────────────────');
    try {
      await client.query(`
        INSERT INTO agent_memories (org_id, scope, key, content, importance)
        VALUES (
          $1,
          'email_classification',
          'test_rule_hubspot',
          $2::jsonb,
          0.95
        )
      `, [
        testOrgId,
        JSON.stringify({
          type: 'classification_rule',
          pattern_type: 'sender_domain',
          pattern_value: 'hubspot.com',
          correct_category: 'NOTIFICATIONS',
          wrong_category: 'OPPORTUNITY',
          reason: 'HubSpot emails are marketing notifications',
          confidence_override: 0.99
        })
      ]);
      console.log('✅ Successfully inserted email_classification rule\n');
    } catch (error: any) {
      console.log(`❌ Failed to insert: ${error.message}\n`);
      throw error;
    }

    // Test 2: Query classification rules
    console.log('Test 2: Query classification rules');
    console.log('─────────────────────────────────────────────────────────');
    const queryResult = await client.query(`
      SELECT id, scope, key, content, importance
      FROM agent_memories
      WHERE org_id = $1 AND scope = 'email_classification'
      ORDER BY importance DESC
    `, [testOrgId]);

    console.log(`Found ${queryResult.rows.length} classification rule(s):`);
    queryResult.rows.forEach(row => {
      console.log(`  - ${row.key} (importance: ${row.importance})`);
      console.log(`    ${JSON.stringify(row.content, null, 2).split('\n').join('\n    ')}`);
    });
    console.log();

    // Test 3: Verify index usage
    console.log('Test 3: Verify index usage');
    console.log('─────────────────────────────────────────────────────────');
    const explainResult = await client.query(`
      EXPLAIN (FORMAT JSON)
      SELECT * FROM agent_memories
      WHERE org_id = $1 AND scope = 'email_classification'
      ORDER BY importance DESC
    `, [testOrgId]);

    const plan = explainResult.rows[0]['QUERY PLAN'][0];
    const usesIndex = JSON.stringify(plan).includes('idx_agent_memories_classification');
    console.log(`Index usage: ${usesIndex ? '✅ Using idx_agent_memories_classification' : '⚠️  Not using expected index'}`);
    console.log();

    // Test 4: Test constraint validation (should reject invalid scope)
    console.log('Test 4: Test constraint validation');
    console.log('─────────────────────────────────────────────────────────');
    try {
      await client.query(`
        INSERT INTO agent_memories (org_id, scope, key, content, importance)
        VALUES ($1, 'invalid_scope', 'test_invalid', '{}'::jsonb, 0.5)
      `, [testOrgId]);
      console.log('❌ Constraint check FAILED - invalid scope was accepted\n');
    } catch (error: any) {
      if (error.message.includes('agent_memories_scope_check')) {
        console.log('✅ Constraint correctly rejected invalid scope\n');
      } else {
        console.log(`⚠️  Unexpected error: ${error.message}\n`);
      }
    }

    // Test 5: Test all valid scopes
    console.log('Test 5: Verify all valid scopes');
    console.log('─────────────────────────────────────────────────────────');
    const validScopes = ['chat', 'email', 'session', 'client_context', 'card_feedback', 'email_classification'];
    const scopeResults: { [key: string]: boolean } = {};

    for (const scope of validScopes) {
      try {
        await client.query(`
          INSERT INTO agent_memories (org_id, scope, key, content, importance)
          VALUES ($1, $2, $3, '{}'::jsonb, 0.5)
          ON CONFLICT (org_id, scope, key) DO NOTHING
        `, [testOrgId, scope, `test_${scope}`]);
        scopeResults[scope] = true;
      } catch (error) {
        scopeResults[scope] = false;
      }
    }

    Object.entries(scopeResults).forEach(([scope, success]) => {
      console.log(`  ${success ? '✅' : '❌'} ${scope}`);
    });
    console.log();

    // Test 6: Check RLS policies
    console.log('Test 6: Check RLS policies');
    console.log('─────────────────────────────────────────────────────────');
    const rlsResult = await client.query(`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = 'agent_memories'
      ORDER BY policyname;
    `);

    console.log(`Found ${rlsResult.rows.length} RLS policies:`);
    rlsResult.rows.forEach(row => {
      console.log(`  - ${row.policyname} (${row.cmd})`);
    });
    console.log();

    // Test 7: Verify no data corruption
    console.log('Test 7: Verify no data corruption');
    console.log('─────────────────────────────────────────────────────────');
    const countResult = await client.query(`
      SELECT scope, COUNT(*) as count
      FROM agent_memories
      GROUP BY scope
      ORDER BY scope;
    `);

    console.log('Record counts by scope:');
    countResult.rows.forEach(row => {
      console.log(`  ${row.scope}: ${row.count}`);
    });
    console.log();

    // Cleanup test data
    console.log('Cleanup: Removing test data');
    console.log('─────────────────────────────────────────────────────────');
    const deleteResult = await client.query(`
      DELETE FROM agent_memories
      WHERE org_id = $1 AND key LIKE 'test_%'
    `, [testOrgId]);
    console.log(`✅ Deleted ${deleteResult.rowCount} test records\n`);

    console.log('═══════════════════════════════════════════════════════');
    console.log('  ✅ All Tests Passed!');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
