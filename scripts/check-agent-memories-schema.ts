import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSchema() {
  console.log('Checking agent_memories table schema...\n');

  // Check constraint
  const constraintQuery = `
    SELECT constraint_name, check_clause
    FROM information_schema.check_constraints
    WHERE constraint_name = 'agent_memories_scope_check';
  `;

  const { data: constraintData, error: constraintError } = await supabase
    .rpc('exec_sql', { sql: constraintQuery });

  console.log('Scope Constraint:');
  if (constraintError) {
    console.error('Error:', constraintError);
  } else {
    console.log(JSON.stringify(constraintData, null, 2));
  }

  // Check indexes
  const indexQuery = `
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'agent_memories'
    ORDER BY indexname;
  `;

  const { data: indexData, error: indexError } = await supabase
    .rpc('exec_sql', { sql: indexQuery });

  console.log('\nIndexes:');
  if (indexError) {
    console.error('Error:', indexError);
  } else {
    console.log(JSON.stringify(indexData, null, 2));
  }

  // Check if table exists and get column info
  const tableQuery = `
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'agent_memories'
    ORDER BY ordinal_position;
  `;

  const { data: tableData, error: tableError } = await supabase
    .rpc('exec_sql', { sql: tableQuery });

  console.log('\nTable Columns:');
  if (tableError) {
    console.error('Error:', tableError);
  } else {
    console.log(JSON.stringify(tableData, null, 2));
  }
}

checkSchema()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
