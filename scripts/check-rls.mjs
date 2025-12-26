import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRLS() {
  // Check RLS policies on correction_requests
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT pol.polname, pol.polcmd, pg_get_expr(pol.polqual, pol.polrelid) as using_expr
      FROM pg_policy pol
      JOIN pg_class cls ON pol.polrelid = cls.oid
      WHERE cls.relname = 'correction_requests'
    `
  });

  if (error) {
    // Try direct query
    const { data: policies, error: e2 } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'correction_requests');

    if (e2) {
      console.error('Error:', e2);
      // Just check if RLS is enabled
      console.log('\nTrying to fetch corrections as anon user...');

      const anonClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaGVueGhnY2p4c2xwZmV6eWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNzE2ODMsImV4cCI6MjA3NTk0NzY4M30.0uZHsn0Ob6m_gMCHB3YcWzrw5dg-8nWq_Y4MJFcBvqw'
      );

      const { data: corrections, error: corrError } = await anonClient
        .from('correction_requests')
        .select('id, case_id')
        .limit(5);

      console.log('Anon fetch result:', corrections, corrError);
      return;
    }
    console.log('Policies:', policies);
  } else {
    console.log('RLS Policies:', data);
  }
}

checkRLS();
