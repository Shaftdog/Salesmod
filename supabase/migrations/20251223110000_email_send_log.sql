-- Email Send Log Table
-- Audit trail for ALL email send attempts (including dry_run and blocked)
-- Essential for operational validation and debugging

CREATE TABLE IF NOT EXISTS email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('agent', 'api', 'campaign', 'invoice', 'broadcast', 'manual')),
  contact_id UUID REFERENCES contacts(id),
  card_id UUID,
  mode TEXT NOT NULL,
  simulated BOOLEAN NOT NULL DEFAULT true,
  success BOOLEAN NOT NULL DEFAULT false,
  blocked BOOLEAN NOT NULL DEFAULT false,
  message_id TEXT,
  error TEXT,
  duration_ms INTEGER,
  payload_preview JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for querying
CREATE INDEX IF NOT EXISTS idx_email_send_log_tenant
  ON email_send_log(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_send_log_success
  ON email_send_log(tenant_id, success, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_send_log_mode
  ON email_send_log(tenant_id, mode, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_send_log_source
  ON email_send_log(tenant_id, source, created_at DESC);

-- RLS policies
ALTER TABLE email_send_log ENABLE ROW LEVEL SECURITY;

-- Admins can view email logs for their tenant
CREATE POLICY "Admins can view own tenant email logs"
  ON email_send_log
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

-- Super admins can view all email logs
CREATE POLICY "Super admins can view all email logs"
  ON email_send_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

COMMENT ON TABLE email_send_log IS 'Audit trail for all email send attempts including simulated/blocked';
COMMENT ON COLUMN email_send_log.mode IS 'Email mode: dry_run, internal_only, limited_live, live, no_api_key, suppressed, validation_failed';
COMMENT ON COLUMN email_send_log.simulated IS 'True if email was NOT actually sent (dry_run, internal_only blocked, no API key)';
COMMENT ON COLUMN email_send_log.blocked IS 'True if email was blocked by policy or rate limit';
COMMENT ON COLUMN email_send_log.source IS 'Origin of the email: agent, api, campaign, invoice, broadcast, manual';
