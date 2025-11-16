import { Client } from 'pg';

async function cleanup() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Cleaning up demo classification rules...\n');

    const result = await client.query(`
      DELETE FROM agent_memories
      WHERE scope = 'email_classification'
        AND key IN (
          'rule_calendly',
          'rule_zillow_noreply',
          'rule_unsubscribe',
          'rule_realtor_leads'
        )
    `);

    console.log(`✅ Deleted ${result.rowCount} demo rules`);

    // Verify cleanup
    const checkResult = await client.query(`
      SELECT COUNT(*) as count
      FROM agent_memories
      WHERE scope = 'email_classification'
    `);

    console.log(`Remaining classification rules: ${checkResult.rows[0].count}\n`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

cleanup()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
