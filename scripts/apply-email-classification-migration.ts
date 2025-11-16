import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

async function applyMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20251116000001_add_email_classification_scope.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('=== Migration SQL ===');
    console.log(migrationSQL);
    console.log('\n=== Applying Migration ===\n');

    // Execute the migration
    await client.query(migrationSQL);

    console.log('✅ Migration applied successfully!\n');

    // Verify the changes
    console.log('=== Verifying Changes ===\n');

    // Check constraint
    const constraintResult = await client.query(`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints
      WHERE constraint_name = 'agent_memories_scope_check';
    `);

    console.log('Updated Scope Constraint:');
    console.log(constraintResult.rows[0]?.check_clause || 'NOT FOUND');

    // Check if email_classification is in the constraint
    const hasEmailClassification = constraintResult.rows[0]?.check_clause?.includes('email_classification');
    console.log(`\nContains 'email_classification': ${hasEmailClassification ? '✅ YES' : '❌ NO'}`);

    // Check index
    const indexResult = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'agent_memories'
        AND indexname = 'idx_agent_memories_classification';
    `);

    console.log('\nClassification Index:');
    if (indexResult.rows.length > 0) {
      console.log('✅ Index created:');
      console.log(`  ${indexResult.rows[0].indexdef}`);
    } else {
      console.log('❌ Index NOT found');
    }

    // Check constraint comment
    const commentResult = await client.query(`
      SELECT
        obj_description(oid, 'pg_constraint') as description
      FROM pg_constraint
      WHERE conname = 'agent_memories_scope_check';
    `);

    console.log('\nConstraint Comment:');
    console.log(commentResult.rows[0]?.description || 'No comment');

    // Record migration in supabase_migrations table
    console.log('\n=== Recording Migration ===\n');

    await client.query(`
      INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
      VALUES ('20251116000001', 'add_email_classification_scope', ARRAY['Migration applied via script'])
      ON CONFLICT (version) DO NOTHING;
    `);

    console.log('✅ Migration recorded in schema_migrations table');

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    throw error;
  } finally {
    await client.end();
  }
}

applyMigration()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });
