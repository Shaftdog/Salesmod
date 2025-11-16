import { Client } from 'pg';

async function checkSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Check constraint
    console.log('=== Scope Constraint ===');
    const constraintResult = await client.query(`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints
      WHERE constraint_name = 'agent_memories_scope_check';
    `);
    console.log(constraintResult.rows);

    // Check indexes
    console.log('\n=== Indexes on agent_memories ===');
    const indexResult = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'agent_memories'
      ORDER BY indexname;
    `);
    indexResult.rows.forEach(row => {
      console.log(`${row.indexname}:`);
      console.log(`  ${row.indexdef}`);
    });

    // Check table columns
    console.log('\n=== Table Columns ===');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'agent_memories'
      ORDER BY ordinal_position;
    `);
    console.table(columnsResult.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkSchema();
