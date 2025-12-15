const fs = require('fs');
const { Client } = require('pg');

async function applyHotfix() {
  const connectionString = 'postgresql://postgres.zqhenxhgcjxslpfezybm:NsjCsuLJfBswVhdI@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🚨 APPLYING CRITICAL HOTFIX FOR RLS RECURSION...\n');
    await client.connect();
    console.log('✓ Connected to database\n');

    const sql = fs.readFileSync('supabase/migrations/20251116000000_fix_profiles_rls_recursion.sql', 'utf8');

    console.log('Applying fix...');
    await client.query(sql);

    console.log('\n✅ HOTFIX APPLIED SUCCESSFULLY!');
    console.log('User data loading should now work correctly.\n');

  } catch (error) {
    console.error('❌ HOTFIX FAILED:', error.message);
    console.error('Details:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyHotfix();
