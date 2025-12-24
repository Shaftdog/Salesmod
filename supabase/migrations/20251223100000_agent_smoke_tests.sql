-- Agent Smoke Tests Table
-- Stores results of operational validation smoke tests for auditing

CREATE TABLE IF NOT EXISTS agent_smoke_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ran_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ran_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('PASS', 'PARTIAL', 'FAIL')),
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying by tenant
CREATE INDEX IF NOT EXISTS idx_agent_smoke_tests_tenant
  ON agent_smoke_tests(tenant_id, ran_at DESC);

-- RLS policies
ALTER TABLE agent_smoke_tests ENABLE ROW LEVEL SECURITY;

-- Admins can view smoke tests for their tenant
CREATE POLICY "Admins can view own tenant smoke tests"
  ON agent_smoke_tests
  FOR SELECT
  USING (
    tenant_id = (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Super admins can view all smoke tests
CREATE POLICY "Super admins can view all smoke tests"
  ON agent_smoke_tests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Service role can insert (for API)
-- Note: Inserts happen via service role client, so no INSERT policy needed for users

COMMENT ON TABLE agent_smoke_tests IS 'Stores results of agent operational validation smoke tests';
COMMENT ON COLUMN agent_smoke_tests.status IS 'Overall test status: PASS, PARTIAL, or FAIL';
COMMENT ON COLUMN agent_smoke_tests.details IS 'Full test report JSON including individual test results';
