// Script to create contact_tags table via direct SQL
const https = require('https');

const SUPABASE_URL = 'https://zqhenxhgcjxslpfezybm.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaGVueGhnY2p4c2xwZmV6eWJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM3MTY4MywiZXhwIjoyMDc1OTQ3NjgzfQ.BKuVqBZ25zT5wsmp3flVudi9fXaLOz5wJCR9JEMctEg';
const PROJECT_REF = 'zqhenxhgcjxslpfezybm';

const SQL = `
CREATE TABLE IF NOT EXISTS public.contact_tags (
  contact_id UUID REFERENCES public.contacts ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (contact_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_contact_tags_contact ON public.contact_tags(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_tags_tag ON public.contact_tags(tag_id);

ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_tags_tenant_select" ON public.contact_tags;
DROP POLICY IF EXISTS "contact_tags_tenant_insert" ON public.contact_tags;
DROP POLICY IF EXISTS "contact_tags_tenant_delete" ON public.contact_tags;

CREATE POLICY "contact_tags_tenant_select"
  ON public.contact_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts c
      WHERE c.id = contact_id
      AND c.tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "contact_tags_tenant_insert"
  ON public.contact_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contacts c
      WHERE c.id = contact_id
      AND c.tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "contact_tags_tenant_delete"
  ON public.contact_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts c
      WHERE c.id = contact_id
      AND c.tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

COMMENT ON TABLE public.contact_tags IS 'Many-to-many relationship between contacts and tags';
`;

// Use the Supabase Management API to run SQL
const options = {
  hostname: 'api.supabase.com',
  port: 443,
  path: `/v1/projects/${PROJECT_REF}/database/query`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.SUPABASE_ACCESS_TOKEN || ''}`,
  }
};

// Alternative: Use pg module if available
async function runWithPg() {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      host: 'aws-0-us-east-1.pooler.supabase.com',
      port: 6543,
      database: 'postgres',
      user: 'postgres.zqhenxhgcjxslpfezybm',
      password: process.env.SUPABASE_DB_PASSWORD || 'Blaisenpals1!',
      ssl: { rejectUnauthorized: false }
    });

    console.log('Connecting to database...');
    const client = await pool.connect();

    console.log('Running migration...');
    await client.query(SQL);

    console.log('✅ Migration completed successfully!');
    client.release();
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\n📋 Manual steps required:');
    console.log('1. Go to https://supabase.com/dashboard/project/zqhenxhgcjxslpfezybm/sql');
    console.log('2. Paste the SQL from: supabase/migrations/20251214000000_add_contact_tags.sql');
    console.log('3. Run the query');
  }
}

runWithPg();
