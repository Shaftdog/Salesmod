-- Temporarily disable RLS on campaigns table for development
-- This allows the API to work without setting app.current_org_id

ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'campaigns';
