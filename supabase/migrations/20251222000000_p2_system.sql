-- Phase 2 (P2): Compound Advantage
-- Combined migration for all P2 components
-- Created: 2025-12-22

-- ============================================================================
-- P2.1: Data Warehouse & Insights Engine
-- ============================================================================

-- Central event store for all agent activities
CREATE TABLE IF NOT EXISTS warehouse_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Event identification
    event_type TEXT NOT NULL, -- 'email_sent', 'card_executed', 'order_created', 'deal_advanced', etc.
    event_source TEXT NOT NULL, -- 'autonomous_cycle', 'user_action', 'webhook', 'browser_automation'
    source_id UUID, -- Reference to source record (card_id, order_id, etc.)

    -- Event data
    payload JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',

    -- Context references
    run_id UUID, -- REFERENCES agent_autonomous_runs(id) - optional FK
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    deal_id UUID, -- Reference to deals table (FK added when deals table exists)

    -- Timing
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,

    -- Indexing support
    event_day DATE, -- Populated by trigger

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for warehouse queries
CREATE INDEX IF NOT EXISTS idx_warehouse_tenant_day ON warehouse_events(tenant_id, event_day DESC);
CREATE INDEX IF NOT EXISTS idx_warehouse_event_type ON warehouse_events(tenant_id, event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_warehouse_client ON warehouse_events(client_id, occurred_at DESC) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_warehouse_unprocessed ON warehouse_events(tenant_id, processed_at) WHERE processed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_warehouse_run ON warehouse_events(run_id) WHERE run_id IS NOT NULL;

-- Trigger to populate event_day
CREATE OR REPLACE FUNCTION set_event_day()
RETURNS TRIGGER AS $$
BEGIN
    NEW.event_day := DATE(NEW.occurred_at);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_event_day ON warehouse_events;
CREATE TRIGGER trg_set_event_day
    BEFORE INSERT OR UPDATE ON warehouse_events
    FOR EACH ROW
    EXECUTE FUNCTION set_event_day();

-- Detected patterns from event analysis
CREATE TABLE IF NOT EXISTS detected_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    pattern_type TEXT NOT NULL, -- 'client_behavior', 'seasonal', 'response_time', 'win_loss', 'engagement'
    pattern_name TEXT NOT NULL,
    description TEXT,

    -- Pattern data
    pattern_config JSONB NOT NULL, -- Rules/conditions that define the pattern
    metrics JSONB DEFAULT '{}', -- Statistical measures (avg, stddev, percentiles)

    -- Confidence and validity
    confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    sample_size INTEGER,
    first_detected_at TIMESTAMPTZ,
    last_validated_at TIMESTAMPTZ,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_actionable BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patterns_tenant ON detected_patterns(tenant_id, pattern_type);
CREATE INDEX IF NOT EXISTS idx_patterns_actionable ON detected_patterns(tenant_id, is_actionable) WHERE is_active = TRUE;

-- AI-generated strategy recommendations
CREATE TABLE IF NOT EXISTS strategy_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    recommendation_type TEXT NOT NULL, -- 'outreach_strategy', 'pricing', 'timing', 'engagement', 'follow_up'
    title TEXT NOT NULL,
    description TEXT NOT NULL,

    -- Source patterns
    source_pattern_ids UUID[] DEFAULT '{}', -- References to detected_patterns

    -- Recommendation details
    action_items JSONB DEFAULT '[]', -- Array of specific actions to take
    expected_impact JSONB DEFAULT '{}', -- { metric: estimated_impact }

    -- Priority and timing
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'implemented', 'expired')),
    implemented_at TIMESTAMPTZ,
    implemented_by UUID REFERENCES profiles(id),
    outcome JSONB, -- Actual results after implementation

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendations_tenant ON strategy_recommendations(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_recommendations_pending ON strategy_recommendations(tenant_id, priority DESC) WHERE status = 'pending';

-- Scheduled insight generation jobs
CREATE TABLE IF NOT EXISTS insight_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    job_type TEXT NOT NULL CHECK (job_type IN ('hourly_changes', 'daily_summary', 'weekly_playbook')),
    scheduled_for TIMESTAMPTZ NOT NULL,

    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Results
    events_processed INTEGER DEFAULT 0,
    patterns_detected INTEGER DEFAULT 0,
    recommendations_created INTEGER DEFAULT 0,
    summary JSONB,

    error_message TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insight_jobs_pending ON insight_jobs(tenant_id, job_type, scheduled_for) WHERE status = 'pending';

-- ============================================================================
-- P2.2: Utility Sandbox (Template-based Scripts)
-- ============================================================================

-- Pre-approved script templates
CREATE TABLE IF NOT EXISTS sandbox_script_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    template_name TEXT NOT NULL UNIQUE,
    template_type TEXT NOT NULL, -- 'parse_pdf', 'extract_contacts', 'clean_csv', 'transform_data', etc.
    description TEXT,

    -- Script definition
    language TEXT NOT NULL DEFAULT 'typescript' CHECK (language IN ('typescript', 'python')),
    script_code TEXT NOT NULL,
    parameters JSONB DEFAULT '[]', -- [{ name, type, required, default, description }]

    -- Security
    allowed_imports TEXT[] DEFAULT '{}', -- Allowed modules
    resource_limits JSONB DEFAULT '{"max_memory_mb": 256, "max_time_seconds": 30}',

    -- Versioning
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sandbox execution logs
CREATE TABLE IF NOT EXISTS sandbox_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- What was run
    template_id UUID NOT NULL REFERENCES sandbox_script_templates(id),
    template_name TEXT NOT NULL,

    -- Input/Output
    input_params JSONB,
    input_file_refs JSONB DEFAULT '[]', -- [{ document_id, file_name, mime_type }]
    output_data JSONB,
    output_file_refs JSONB DEFAULT '[]', -- [{ document_id, file_name, mime_type }]

    -- Execution context
    run_id UUID, -- agent_autonomous_runs reference
    card_id UUID, -- kanban_cards reference
    triggered_by TEXT NOT NULL, -- 'autonomous_cycle', 'user', 'card_execution'

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'timeout', 'killed')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,

    -- Resource usage
    memory_used_mb INTEGER,
    cpu_time_ms INTEGER,

    -- Errors
    error_message TEXT,
    error_stack TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_tenant ON sandbox_executions(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sandbox_pending ON sandbox_executions(tenant_id, status) WHERE status IN ('pending', 'running');
CREATE INDEX IF NOT EXISTS idx_sandbox_template ON sandbox_executions(template_id, created_at DESC);

-- ============================================================================
-- P2.3: Browser Automation for Order Acceptance
-- ============================================================================

-- Allowed domains for browser automation (global + tenant-specific)
CREATE TABLE IF NOT EXISTS domain_allowlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    domain TEXT NOT NULL,
    domain_type TEXT NOT NULL, -- 'vendor_portal', 'document_source', 'research'

    -- Scope
    is_global BOOLEAN DEFAULT TRUE, -- TRUE = applies to all tenants
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL for global domains

    -- Security
    is_active BOOLEAN DEFAULT TRUE,
    added_by UUID REFERENCES profiles(id),
    reason TEXT,
    expires_at TIMESTAMPTZ, -- Optional expiration

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint on domain for global domains (WHERE tenant_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_domain_allowlist_global_unique
ON domain_allowlist(domain) WHERE tenant_id IS NULL;

-- Unique constraint on domain+tenant for tenant-specific domains
CREATE UNIQUE INDEX IF NOT EXISTS idx_domain_allowlist_tenant_unique
ON domain_allowlist(domain, tenant_id) WHERE tenant_id IS NOT NULL;

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_domain_allowlist_lookup ON domain_allowlist(domain, is_global, tenant_id) WHERE is_active = TRUE;

-- Pre-populate with known vendor portals (global domains)
INSERT INTO domain_allowlist (domain, domain_type, is_global, reason) VALUES
('valuetrac.com', 'vendor_portal', TRUE, 'Major appraisal management platform'),
('mercurynetwork.com', 'vendor_portal', TRUE, 'Major appraisal management platform'),
('reggora.com', 'vendor_portal', TRUE, 'Appraisal management platform'),
('clearval.com', 'vendor_portal', TRUE, 'Appraisal management platform'),
('appraisalinstitute.org', 'research', TRUE, 'Industry organization'),
('fanniemae.com', 'research', TRUE, 'GSE guidelines'),
('freddiemac.com', 'research', TRUE, 'GSE guidelines')
ON CONFLICT DO NOTHING;

-- Vendor portal configurations per tenant
CREATE TABLE IF NOT EXISTS vendor_portal_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Portal identification
    portal_name TEXT NOT NULL,
    domain TEXT NOT NULL,

    -- Status
    is_enabled BOOLEAN DEFAULT FALSE,
    requires_human_approval BOOLEAN DEFAULT TRUE, -- For first-time workflows

    -- Credentials reference (not stored directly)
    credential_id UUID, -- Reference to credential_vault

    -- Configuration
    login_url TEXT,
    order_list_url TEXT,
    order_accept_url_pattern TEXT,
    settings JSONB DEFAULT '{}',

    -- Workflow recording
    recorded_workflow JSONB, -- Saved Playwright steps
    workflow_version INTEGER DEFAULT 0,
    last_recorded_at TIMESTAMPTZ,
    workflow_validated BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(tenant_id, domain)
);

CREATE INDEX IF NOT EXISTS idx_portal_configs_tenant ON vendor_portal_configs(tenant_id, is_enabled) WHERE is_enabled = TRUE;

-- Browser automation job queue
CREATE TABLE IF NOT EXISTS browser_automation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Job type
    job_type TEXT NOT NULL CHECK (job_type IN ('order_accept', 'order_status_check', 'document_download', 'custom_workflow')),
    portal_config_id UUID REFERENCES vendor_portal_configs(id) ON DELETE SET NULL,

    -- Target
    target_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    target_url TEXT,
    job_params JSONB DEFAULT '{}',

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'awaiting_approval', 'queued', 'running', 'completed', 'failed', 'cancelled')),

    -- Human approval for new workflows
    requires_approval BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,

    -- Execution
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,

    -- Results
    result_data JSONB,
    confirmation_number TEXT,
    screenshot_paths JSONB DEFAULT '[]',
    trace_path TEXT, -- Playwright trace file for debugging

    -- Errors and retries
    error_message TEXT,
    error_screenshot_path TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMPTZ,

    -- Context
    run_id UUID, -- agent_autonomous_runs reference
    card_id UUID, -- kanban_cards reference

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_browser_jobs_pending ON browser_automation_jobs(tenant_id, status) WHERE status IN ('pending', 'awaiting_approval', 'queued');
CREATE INDEX IF NOT EXISTS idx_browser_jobs_retry ON browser_automation_jobs(next_retry_at) WHERE status = 'failed' AND retry_count < max_retries;
CREATE INDEX IF NOT EXISTS idx_browser_jobs_order ON browser_automation_jobs(target_order_id) WHERE target_order_id IS NOT NULL;

-- ============================================================================
-- P2.4: Credential Manager
-- ============================================================================

-- Encrypted credential storage
CREATE TABLE IF NOT EXISTS credential_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Credential identification
    credential_name TEXT NOT NULL,
    credential_type TEXT NOT NULL CHECK (credential_type IN ('oauth2', 'api_key', 'username_password', 'certificate')),

    -- Target system
    target_system TEXT NOT NULL, -- 'valuetrac', 'mercurynetwork', 'email_provider', etc.

    -- Encrypted data (using pgcrypto)
    -- In production, use Supabase Vault or external KMS
    encrypted_data TEXT NOT NULL, -- Base64 encoded encrypted JSON
    encryption_version INTEGER DEFAULT 1, -- For key rotation

    -- Access control
    allowed_purposes TEXT[] DEFAULT '{}', -- ['browser_automation', 'api_call']

    -- OAuth specific
    token_expires_at TIMESTAMPTZ,
    needs_refresh BOOLEAN DEFAULT FALSE,

    -- Metadata
    account_identifier TEXT, -- Username/email (non-sensitive)
    last_used_at TIMESTAMPTZ,
    last_rotated_at TIMESTAMPTZ,
    rotation_required_at TIMESTAMPTZ,

    -- Status
    is_valid BOOLEAN DEFAULT TRUE,
    validation_error TEXT,
    validation_checked_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(tenant_id, credential_name)
);

CREATE INDEX IF NOT EXISTS idx_credential_vault_tenant ON credential_vault(tenant_id, target_system);
CREATE INDEX IF NOT EXISTS idx_credential_vault_refresh ON credential_vault(needs_refresh, token_expires_at) WHERE needs_refresh = TRUE;

-- Credential access audit log
CREATE TABLE IF NOT EXISTS credential_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    credential_id UUID NOT NULL REFERENCES credential_vault(id) ON DELETE CASCADE,

    -- Access details
    accessed_by TEXT NOT NULL, -- 'autonomous_cycle', 'browser_automation:job_id', 'user:profile_id'
    access_purpose TEXT NOT NULL,

    -- Context
    run_id UUID, -- agent_autonomous_runs reference
    browser_job_id UUID REFERENCES browser_automation_jobs(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,

    -- Outcome
    access_granted BOOLEAN NOT NULL,
    denial_reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credential_access_tenant ON credential_access_log(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credential_access_credential ON credential_access_log(credential_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credential_access_denied ON credential_access_log(tenant_id, access_granted, created_at DESC) WHERE access_granted = FALSE;

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Capture warehouse event
CREATE OR REPLACE FUNCTION capture_warehouse_event(
    p_tenant_id UUID,
    p_event_type TEXT,
    p_event_source TEXT,
    p_payload JSONB,
    p_source_id UUID DEFAULT NULL,
    p_client_id UUID DEFAULT NULL,
    p_contact_id UUID DEFAULT NULL,
    p_order_id UUID DEFAULT NULL,
    p_deal_id UUID DEFAULT NULL,
    p_run_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO warehouse_events (
        tenant_id, event_type, event_source, payload,
        source_id, client_id, contact_id, order_id, deal_id, run_id,
        metadata
    ) VALUES (
        p_tenant_id, p_event_type, p_event_source, p_payload,
        p_source_id, p_client_id, p_contact_id, p_order_id, p_deal_id, p_run_id,
        p_metadata
    )
    RETURNING id INTO v_event_id;

    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- Get pending insight jobs
CREATE OR REPLACE FUNCTION get_pending_insight_jobs(p_tenant_id UUID, p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
    job_id UUID,
    job_type TEXT,
    scheduled_for TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        j.id as job_id,
        j.job_type,
        j.scheduled_for
    FROM insight_jobs j
    WHERE j.tenant_id = p_tenant_id
      AND j.status = 'pending'
      AND j.scheduled_for <= NOW()
    ORDER BY j.scheduled_for ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get pending sandbox executions
CREATE OR REPLACE FUNCTION get_pending_sandbox_jobs(p_tenant_id UUID, p_limit INTEGER DEFAULT 3)
RETURNS TABLE (
    execution_id UUID,
    template_id UUID,
    template_name TEXT,
    input_params JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id as execution_id,
        e.template_id,
        e.template_name,
        e.input_params
    FROM sandbox_executions e
    WHERE e.tenant_id = p_tenant_id
      AND e.status = 'pending'
    ORDER BY e.created_at ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get pending browser automation jobs
CREATE OR REPLACE FUNCTION get_pending_browser_jobs(p_tenant_id UUID, p_limit INTEGER DEFAULT 2)
RETURNS TABLE (
    job_id UUID,
    job_type TEXT,
    portal_config_id UUID,
    portal_name TEXT,
    target_order_id UUID,
    target_url TEXT,
    requires_approval BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        j.id as job_id,
        j.job_type,
        j.portal_config_id,
        p.portal_name,
        j.target_order_id,
        j.target_url,
        j.requires_approval
    FROM browser_automation_jobs j
    LEFT JOIN vendor_portal_configs p ON p.id = j.portal_config_id
    WHERE j.tenant_id = p_tenant_id
      AND j.status IN ('pending', 'queued')
      AND (j.requires_approval = FALSE OR j.approved_at IS NOT NULL)
    ORDER BY j.created_at ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Check domain allowlist
CREATE OR REPLACE FUNCTION is_domain_allowed(p_domain TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM domain_allowlist
        WHERE domain = p_domain
          AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql;

-- Log credential access
CREATE OR REPLACE FUNCTION log_credential_access(
    p_tenant_id UUID,
    p_credential_id UUID,
    p_accessed_by TEXT,
    p_access_purpose TEXT,
    p_access_granted BOOLEAN,
    p_denial_reason TEXT DEFAULT NULL,
    p_run_id UUID DEFAULT NULL,
    p_browser_job_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO credential_access_log (
        tenant_id, credential_id, accessed_by, access_purpose,
        access_granted, denial_reason, run_id, browser_job_id, ip_address
    ) VALUES (
        p_tenant_id, p_credential_id, p_accessed_by, p_access_purpose,
        p_access_granted, p_denial_reason, p_run_id, p_browser_job_id, p_ip_address
    )
    RETURNING id INTO v_log_id;

    -- Update last_used_at on credential if access was granted
    IF p_access_granted THEN
        UPDATE credential_vault
        SET last_used_at = NOW()
        WHERE id = p_credential_id;
    END IF;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE warehouse_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE detected_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox_script_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_portal_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE browser_automation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_access_log ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies
CREATE POLICY tenant_isolation ON warehouse_events
    FOR ALL
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY tenant_isolation ON detected_patterns
    FOR ALL
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY tenant_isolation ON strategy_recommendations
    FOR ALL
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY tenant_isolation ON insight_jobs
    FOR ALL
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Script templates are global (no tenant_id), read-only for users
CREATE POLICY read_all ON sandbox_script_templates
    FOR SELECT USING (true);

CREATE POLICY tenant_isolation ON sandbox_executions
    FOR ALL
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Domain allowlist is global, read-only for users
CREATE POLICY read_all ON domain_allowlist
    FOR SELECT USING (true);

CREATE POLICY tenant_isolation ON vendor_portal_configs
    FOR ALL
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY tenant_isolation ON browser_automation_jobs
    FOR ALL
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY tenant_isolation ON credential_vault
    FOR ALL
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY tenant_isolation ON credential_access_log
    FOR ALL
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Service role policies for autonomous agent
CREATE POLICY service_role_all ON warehouse_events
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON detected_patterns
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON strategy_recommendations
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON insight_jobs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON sandbox_script_templates
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON sandbox_executions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON domain_allowlist
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON vendor_portal_configs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON browser_automation_jobs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON credential_vault
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON credential_access_log
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- Seed Data: Script Templates
-- ============================================================================

INSERT INTO sandbox_script_templates (template_name, template_type, description, language, script_code, parameters, resource_limits) VALUES
('parse_pdf', 'parse_pdf', 'Extract text content from PDF files', 'typescript', '
// Uses existing pdf-parse library from P1.1
import { extractPdfText } from "@/lib/documents/document-extractor";
export async function execute(params: { documentId: string }) {
  return await extractPdfText(params.documentId);
}
', '[{"name": "documentId", "type": "string", "required": true, "description": "Document ID to extract text from"}]', '{"max_memory_mb": 512, "max_time_seconds": 60}'),

('parse_docx', 'parse_docx', 'Extract text content from DOCX files', 'typescript', '
// Uses existing mammoth library from P1.1
import { extractDocxText } from "@/lib/documents/document-extractor";
export async function execute(params: { documentId: string }) {
  return await extractDocxText(params.documentId);
}
', '[{"name": "documentId", "type": "string", "required": true, "description": "Document ID to extract text from"}]', '{"max_memory_mb": 256, "max_time_seconds": 30}'),

('extract_contacts', 'extract_contacts', 'Extract contact information from text', 'typescript', '
import { parseEmailSignature } from "@/lib/agent/contact-enricher";
export async function execute(params: { text: string }) {
  return await parseEmailSignature(params.text);
}
', '[{"name": "text", "type": "string", "required": true, "description": "Text to extract contacts from"}]', '{"max_memory_mb": 128, "max_time_seconds": 15}'),

('clean_csv', 'clean_csv', 'Clean and normalize CSV data, remove duplicates', 'typescript', '
export async function execute(params: { csvContent: string, dedupeColumns?: string[] }) {
  const lines = params.csvContent.split("\n").filter(l => l.trim());
  const headers = lines[0].split(",").map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((h, i) => [h, values[i]?.trim() || ""]));
  });
  // Dedupe
  const seen = new Set();
  const deduped = rows.filter(row => {
    const key = (params.dedupeColumns || headers).map(c => row[c]).join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { headers, rows: deduped, originalCount: rows.length, dedupedCount: deduped.length };
}
', '[{"name": "csvContent", "type": "string", "required": true, "description": "CSV content"}, {"name": "dedupeColumns", "type": "array", "required": false, "description": "Columns to use for deduplication"}]', '{"max_memory_mb": 256, "max_time_seconds": 30}'),

('normalize_orders', 'normalize_orders', 'Normalize order data from various export formats', 'typescript', '
export async function execute(params: { orders: object[], mappings?: Record<string, string> }) {
  const normalized = params.orders.map(order => {
    const mapped = {};
    for (const [key, value] of Object.entries(order)) {
      const normalizedKey = params.mappings?.[key] || key.toLowerCase().replace(/[^a-z0-9]/g, "_");
      mapped[normalizedKey] = value;
    }
    return mapped;
  });
  return { orders: normalized, count: normalized.length };
}
', '[{"name": "orders", "type": "array", "required": true, "description": "Array of order objects"}, {"name": "mappings", "type": "object", "required": false, "description": "Field name mappings"}]', '{"max_memory_mb": 256, "max_time_seconds": 30}'),

('bid_comparison', 'bid_comparison', 'Generate bid comparison table', 'typescript', '
export async function execute(params: { bids: Array<{name: string, price: number, features: string[]}> }) {
  const sorted = [...params.bids].sort((a, b) => a.price - b.price);
  const allFeatures = [...new Set(params.bids.flatMap(b => b.features))];
  const comparison = sorted.map(bid => ({
    ...bid,
    featureMatrix: allFeatures.map(f => bid.features.includes(f))
  }));
  return { comparison, features: allFeatures, lowestPrice: sorted[0]?.name };
}
', '[{"name": "bids", "type": "array", "required": true, "description": "Array of bid objects with name, price, and features"}]', '{"max_memory_mb": 128, "max_time_seconds": 15}'),

('engagement_report', 'engagement_report', 'Generate engagement compliance report', 'typescript', '
import { getEngagementStats } from "@/lib/agent/engagement-engine";
export async function execute(params: { tenantId: string }) {
  return await getEngagementStats(params.tenantId);
}
', '[{"name": "tenantId", "type": "string", "required": true, "description": "Tenant ID to generate report for"}]', '{"max_memory_mb": 256, "max_time_seconds": 30}'),

('invoice_extractor', 'invoice_extractor', 'Extract line items from invoice text', 'typescript', '
export async function execute(params: { invoiceText: string }) {
  // Simple line item extraction regex patterns
  const lineItemPattern = /^(.+?)\s+(\d+)\s+\$?([\d,]+\.?\d*)\s+\$?([\d,]+\.?\d*)$/gm;
  const lineItems = [];
  let match;
  while ((match = lineItemPattern.exec(params.invoiceText)) !== null) {
    lineItems.push({
      description: match[1].trim(),
      quantity: parseInt(match[2]),
      unitPrice: parseFloat(match[3].replace(",", "")),
      total: parseFloat(match[4].replace(",", ""))
    });
  }
  const grandTotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  return { lineItems, grandTotal, itemCount: lineItems.length };
}
', '[{"name": "invoiceText", "type": "string", "required": true, "description": "Invoice text to extract line items from"}]', '{"max_memory_mb": 128, "max_time_seconds": 15}')

ON CONFLICT (template_name) DO UPDATE SET
  description = EXCLUDED.description,
  script_code = EXCLUDED.script_code,
  parameters = EXCLUDED.parameters,
  resource_limits = EXCLUDED.resource_limits,
  version = sandbox_script_templates.version + 1,
  updated_at = NOW();

-- ============================================================================
-- Rate Limit Updates for P2
-- ============================================================================

-- Ensure agent_rate_limits table has P2 action types
-- (Table should exist from P0 migration)
DO $$
BEGIN
    -- Add P2 rate limit defaults to system_config if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_config') THEN
        UPDATE system_config
        SET value = jsonb_set(
            COALESCE(value, '{}'),
            '{rate_limits}',
            COALESCE(value->'rate_limits', '{}') ||
            '{"sandbox_job": {"max": 5, "window": "hour"}, "browser_automation": {"max": 10, "window": "hour"}, "insight_job": {"max": 3, "window": "hour"}}'::jsonb
        )
        WHERE key = 'agent_config';

        -- Insert if not exists
        INSERT INTO system_config (key, value)
        SELECT 'agent_config', '{"rate_limits": {"sandbox_job": {"max": 5, "window": "hour"}, "browser_automation": {"max": 10, "window": "hour"}, "insight_job": {"max": 3, "window": "hour"}}}'::jsonb
        WHERE NOT EXISTS (SELECT 1 FROM system_config WHERE key = 'agent_config');
    END IF;
END $$;
