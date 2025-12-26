/**
 * Fix RLS policy for production_time_entries table
 * Run with: npx tsx scripts/fix-timer-rls.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixRLS() {
  console.log('Fixing production_time_entries RLS policies...\n');

  // First, check what policies currently exist
  const { data: policies, error: policyError } = await supabase
    .rpc('get_policies_for_table', { table_name: 'production_time_entries' });

  if (policyError) {
    console.log('Could not fetch policies via RPC, continuing with fix...');
  } else {
    console.log('Current policies:', policies);
  }

  // The fix requires running raw SQL. Since we can't do that via the JS client,
  // we'll output the SQL that needs to be run.
  console.log('\n=== SQL TO RUN IN SUPABASE SQL EDITOR ===\n');
  console.log(`
-- Drop the legacy policy causing the issue
DROP POLICY IF EXISTS production_time_entries_via_task ON public.production_time_entries;

-- Drop and recreate the tenant isolation policy
DROP POLICY IF EXISTS production_time_entries_tenant_isolation ON public.production_time_entries;

CREATE POLICY production_time_entries_tenant_isolation
  ON public.production_time_entries
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );
`);

  console.log('=== END SQL ===\n');
  console.log('Run the above SQL in your Supabase SQL Editor at:');
  console.log('https://supabase.com/dashboard/project/zqhenxhgcjxslpfezybm/sql/new');
}

fixRLS().catch(console.error);
