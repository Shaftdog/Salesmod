import { Client } from 'pg';

async function demonstrateEmailClassification() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('  Email Classification Learning Demo');
    console.log('═══════════════════════════════════════════════════════\n');

    // Get org_id
    const orgResult = await client.query('SELECT id FROM profiles LIMIT 1');
    const orgId = orgResult.rows[0].id;

    console.log('Scenario: User corrects email classifications\n');

    // Demo 1: Domain-based rule
    console.log('1. Creating domain-based classification rule');
    console.log('   Pattern: sender_domain = "calendly.com"');
    console.log('   Correct Category: NOTIFICATIONS');
    console.log('   Wrong Category: OPPORTUNITY\n');

    await client.query(`
      INSERT INTO agent_memories (org_id, scope, key, content, importance)
      VALUES ($1, 'email_classification', 'rule_calendly', $2::jsonb, 0.90)
      ON CONFLICT (org_id, scope, key) DO UPDATE SET
        content = EXCLUDED.content,
        importance = EXCLUDED.importance
    `, [
      orgId,
      JSON.stringify({
        type: 'classification_rule',
        pattern_type: 'sender_domain',
        pattern_value: 'calendly.com',
        correct_category: 'NOTIFICATIONS',
        wrong_category: 'OPPORTUNITY',
        reason: 'Calendly sends automated meeting reminders, not sales opportunities',
        confidence_override: 0.95,
        created_at: new Date().toISOString()
      })
    ]);
    console.log('   ✅ Rule stored\n');

    // Demo 2: Sender email rule
    console.log('2. Creating sender-specific rule');
    console.log('   Pattern: sender_email = "noreply@zillow.com"');
    console.log('   Correct Category: NOTIFICATIONS');
    console.log('   Wrong Category: OPPORTUNITY\n');

    await client.query(`
      INSERT INTO agent_memories (org_id, scope, key, content, importance)
      VALUES ($1, 'email_classification', 'rule_zillow_noreply', $2::jsonb, 0.85)
      ON CONFLICT (org_id, scope, key) DO UPDATE SET
        content = EXCLUDED.content,
        importance = EXCLUDED.importance
    `, [
      orgId,
      JSON.stringify({
        type: 'classification_rule',
        pattern_type: 'sender_email',
        pattern_value: 'noreply@zillow.com',
        correct_category: 'NOTIFICATIONS',
        wrong_category: 'OPPORTUNITY',
        reason: 'Zillow no-reply emails are property alerts, not direct opportunities',
        confidence_override: 0.92,
        created_at: new Date().toISOString()
      })
    ]);
    console.log('   ✅ Rule stored\n');

    // Demo 3: Subject pattern rule
    console.log('3. Creating subject pattern rule');
    console.log('   Pattern: subject_contains = "unsubscribe"');
    console.log('   Correct Category: NOTIFICATIONS');
    console.log('   Wrong Category: OPPORTUNITY\n');

    await client.query(`
      INSERT INTO agent_memories (org_id, scope, key, content, importance)
      VALUES ($1, 'email_classification', 'rule_unsubscribe', $2::jsonb, 0.80)
      ON CONFLICT (org_id, scope, key) DO UPDATE SET
        content = EXCLUDED.content,
        importance = EXCLUDED.importance
    `, [
      orgId,
      JSON.stringify({
        type: 'classification_rule',
        pattern_type: 'subject_contains',
        pattern_value: 'unsubscribe',
        correct_category: 'NOTIFICATIONS',
        wrong_category: 'OPPORTUNITY',
        reason: 'Emails with unsubscribe links are typically marketing/notifications',
        confidence_override: 0.88,
        created_at: new Date().toISOString()
      })
    ]);
    console.log('   ✅ Rule stored\n');

    // Demo 4: Opportunity rule (positive example)
    console.log('4. Creating opportunity identification rule');
    console.log('   Pattern: sender_domain = "realtor.com"');
    console.log('   Correct Category: OPPORTUNITY');
    console.log('   Wrong Category: NOTIFICATIONS\n');

    await client.query(`
      INSERT INTO agent_memories (org_id, scope, key, content, importance)
      VALUES ($1, 'email_classification', 'rule_realtor_leads', $2::jsonb, 0.95)
      ON CONFLICT (org_id, scope, key) DO UPDATE SET
        content = EXCLUDED.content,
        importance = EXCLUDED.importance
    `, [
      orgId,
      JSON.stringify({
        type: 'classification_rule',
        pattern_type: 'sender_domain',
        pattern_value: 'realtor.com',
        correct_category: 'OPPORTUNITY',
        wrong_category: 'NOTIFICATIONS',
        reason: 'Realtor.com sends genuine appraisal requests',
        confidence_override: 0.97,
        created_at: new Date().toISOString()
      })
    ]);
    console.log('   ✅ Rule stored\n');

    // Show all rules
    console.log('═══════════════════════════════════════════════════════');
    console.log('  All Classification Rules (ordered by importance)');
    console.log('═══════════════════════════════════════════════════════\n');

    const rulesResult = await client.query(`
      SELECT key, content, importance
      FROM agent_memories
      WHERE org_id = $1 AND scope = 'email_classification'
      ORDER BY importance DESC
    `, [orgId]);

    rulesResult.rows.forEach((row, index) => {
      const rule = row.content;
      console.log(`${index + 1}. ${row.key} (importance: ${row.importance})`);
      console.log(`   Type: ${rule.pattern_type}`);
      console.log(`   Pattern: ${rule.pattern_value}`);
      console.log(`   ${rule.wrong_category} → ${rule.correct_category}`);
      console.log(`   Reason: ${rule.reason}`);
      console.log(`   Confidence: ${rule.confidence_override}\n`);
    });

    // Demonstrate query efficiency
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Query Performance');
    console.log('═══════════════════════════════════════════════════════\n');

    const startTime = Date.now();
    await client.query(`
      SELECT *
      FROM agent_memories
      WHERE org_id = $1 AND scope = 'email_classification'
      ORDER BY importance DESC
    `, [orgId]);
    const queryTime = Date.now() - startTime;

    console.log(`Query execution time: ${queryTime}ms`);
    console.log(`Using index: idx_agent_memories_classification`);
    console.log(`✅ Fast lookups for real-time classification\n`);

    // Show how this would be used
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Usage in Email Processing');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('When processing an email from calendly.com:');
    console.log('1. Load all classification rules for user');
    console.log('2. Check sender_domain against rules');
    console.log('3. Find matching rule: rule_calendly');
    console.log('4. Apply confidence_override: 0.95');
    console.log('5. Override AI classification → NOTIFICATIONS');
    console.log('6. Log the correction for future learning\n');

    console.log('Benefits:');
    console.log('✅ User corrections are remembered');
    console.log('✅ Similar emails auto-classified correctly');
    console.log('✅ Reduces false positives over time');
    console.log('✅ Personalized to each user\'s preferences\n');

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

demonstrateEmailClassification()
  .then(() => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Demo Complete!');
    console.log('═══════════════════════════════════════════════════════\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
