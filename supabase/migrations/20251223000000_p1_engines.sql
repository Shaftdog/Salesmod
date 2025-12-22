-- Phase 1 (P1): Scale the Intelligence
-- Combined migration for all P1 engines
-- Created: 2025-12-23

-- ============================================================================
-- P1.3: Feedback Automation
-- ============================================================================

-- Feedback requests table - tracks post-delivery feedback collection
CREATE TABLE IF NOT EXISTS feedback_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

    -- Status workflow
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'sent', 'responded', 'expired', 'skipped')),

    -- Timing
    delivery_date TIMESTAMPTZ NOT NULL,
    scheduled_for TIMESTAMPTZ NOT NULL, -- delivery_date + 7 days
    sent_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ, -- 30 days after sent

    -- Pre-conditions checked before send
    has_open_case BOOLEAN DEFAULT FALSE,
    skip_reason TEXT,

    -- Response data
    response_email_id TEXT, -- gmail_message_id
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    sentiment_score NUMERIC(3,2), -- -1.0 to 1.0
    response_summary TEXT,

    -- Follow-up actions
    case_created_id UUID,
    service_recovery_triggered BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(tenant_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_pending
    ON feedback_requests(tenant_id, status, scheduled_for)
    WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_feedback_order ON feedback_requests(order_id);

-- ============================================================================
-- P1.4: Deals/Opportunities Engine
-- ============================================================================

-- Add automation columns to existing deals table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'deals' AND column_name = 'last_activity_at') THEN
        ALTER TABLE deals ADD COLUMN last_activity_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'deals' AND column_name = 'stalled_at') THEN
        ALTER TABLE deals ADD COLUMN stalled_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'deals' AND column_name = 'auto_follow_up_enabled') THEN
        ALTER TABLE deals ADD COLUMN auto_follow_up_enabled BOOLEAN DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'deals' AND column_name = 'next_follow_up_at') THEN
        ALTER TABLE deals ADD COLUMN next_follow_up_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'deals' AND column_name = 'follow_up_count') THEN
        ALTER TABLE deals ADD COLUMN follow_up_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Deal stage history for tracking progression
CREATE TABLE IF NOT EXISTS deal_stage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,

    from_stage TEXT,
    to_stage TEXT NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    changed_by UUID REFERENCES profiles(id),
    reason TEXT,

    days_in_previous_stage INTEGER,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_history ON deal_stage_history(deal_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_deal_history_tenant ON deal_stage_history(tenant_id, changed_at DESC);

-- Stage thresholds configuration per tenant
CREATE TABLE IF NOT EXISTS deal_stage_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    stage TEXT NOT NULL,
    max_days_before_stale INTEGER DEFAULT 7,
    follow_up_interval_days INTEGER DEFAULT 3,
    max_follow_ups INTEGER DEFAULT 5,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(tenant_id, stage)
);

-- Function to detect stalled deals
CREATE OR REPLACE FUNCTION get_stalled_deals(p_tenant_id UUID, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    deal_id UUID,
    title TEXT,
    stage TEXT,
    client_id UUID,
    contact_id UUID,
    value NUMERIC,
    last_activity_at TIMESTAMPTZ,
    days_since_activity INTEGER,
    stalled_threshold INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id as deal_id,
        d.title,
        d.stage,
        d.client_id,
        d.contact_id,
        d.value,
        d.last_activity_at,
        EXTRACT(DAY FROM (NOW() - COALESCE(d.last_activity_at, d.created_at)))::INTEGER as days_since_activity,
        COALESCE(c.max_days_before_stale, 7) as stalled_threshold
    FROM deals d
    LEFT JOIN deal_stage_config c ON c.tenant_id = d.tenant_id AND c.stage = d.stage
    WHERE d.tenant_id = p_tenant_id
      AND d.stage NOT IN ('won', 'lost')
      AND d.auto_follow_up_enabled = TRUE
      AND EXTRACT(DAY FROM (NOW() - COALESCE(d.last_activity_at, d.created_at))) > COALESCE(c.max_days_before_stale, 7)
    ORDER BY days_since_activity DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- P1.5: Quotes/Bids Engine
-- ============================================================================

-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,

    -- Quote details
    quote_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,

    -- Status workflow
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'pending_approval', 'sent', 'viewed',
                          'accepted', 'rejected', 'expired', 'countered')),

    -- Pricing
    total_amount NUMERIC(12,2) NOT NULL,
    line_items JSONB DEFAULT '[]',
    valid_until DATE,

    -- Tracking
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    view_count INTEGER DEFAULT 0,

    -- Outcome
    outcome TEXT CHECK (outcome IN ('won', 'lost', 'no_decision')),
    outcome_reason TEXT,
    outcome_competitor TEXT,
    outcome_notes TEXT,

    -- Intel gathered
    intel JSONB DEFAULT '{}', -- { budget, timeline, decision_makers, requirements }

    -- Follow-up tracking
    last_follow_up_at TIMESTAMPTZ,
    follow_up_count INTEGER DEFAULT 0,
    next_follow_up_at TIMESTAMPTZ,
    max_follow_ups INTEGER DEFAULT 5,

    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(tenant_id, quote_number)
);

CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_quotes_client ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_followup ON quotes(tenant_id, next_follow_up_at)
    WHERE status IN ('sent', 'viewed');

-- Quote activities
CREATE TABLE IF NOT EXISTS quote_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,

    activity_type TEXT NOT NULL, -- 'created', 'sent', 'viewed', 'follow_up', 'response', 'outcome'
    notes TEXT,
    metadata JSONB,

    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_activities ON quote_activities(quote_id, created_at DESC);

-- Quote outcomes for pattern learning
CREATE TABLE IF NOT EXISTS quote_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,

    outcome TEXT NOT NULL CHECK (outcome IN ('won', 'lost', 'no_decision')),
    primary_reason TEXT,
    secondary_reasons TEXT[],
    competitor TEXT,

    -- Pricing comparison
    our_amount NUMERIC(12,2),
    competitor_amount NUMERIC(12,2),

    -- Learnings
    learnings JSONB, -- AI-extracted patterns

    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_by UUID REFERENCES profiles(id)
);

-- Function to get quotes needing follow-up
CREATE OR REPLACE FUNCTION get_quotes_needing_followup(p_tenant_id UUID, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    quote_id UUID,
    quote_number TEXT,
    title TEXT,
    client_id UUID,
    contact_id UUID,
    total_amount NUMERIC,
    status TEXT,
    days_since_last_contact INTEGER,
    follow_up_count INTEGER,
    max_follow_ups INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        q.id as quote_id,
        q.quote_number,
        q.title,
        q.client_id,
        q.contact_id,
        q.total_amount,
        q.status,
        EXTRACT(DAY FROM (NOW() - COALESCE(q.last_follow_up_at, q.sent_at)))::INTEGER as days_since_last_contact,
        q.follow_up_count,
        q.max_follow_ups
    FROM quotes q
    WHERE q.tenant_id = p_tenant_id
      AND q.status IN ('sent', 'viewed')
      AND q.outcome IS NULL
      AND q.follow_up_count < q.max_follow_ups
      AND (q.next_follow_up_at IS NULL OR q.next_follow_up_at <= NOW())
    ORDER BY
        q.total_amount DESC,
        days_since_last_contact DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- P1.6: Contact Enrichment
-- ============================================================================

-- Enrichment queue
CREATE TABLE IF NOT EXISTS contact_enrichment_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    email_address TEXT,

    source TEXT NOT NULL, -- 'email_signature', 'apollo', 'manual', 'web_search'
    source_id TEXT, -- gmail_message_id or other source

    status TEXT DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),

    -- Extracted data
    extracted_data JSONB DEFAULT '{}',
    -- { name, title, phone, company, linkedin, address, etc. }

    -- Merge status
    merged_to_contact_id UUID REFERENCES contacts(id),
    merge_conflicts JSONB DEFAULT '[]',

    error_message TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_enrichment_pending
    ON contact_enrichment_queue(tenant_id, status)
    WHERE status = 'pending';

-- Opportunity signals detected from emails/interactions
CREATE TABLE IF NOT EXISTS opportunity_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    source_type TEXT NOT NULL, -- 'email', 'case', 'order', 'deal', 'call'
    source_id TEXT NOT NULL,

    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,

    signal_type TEXT NOT NULL,
    -- 'complaint', 'urgency', 'budget_mention', 'competitor_mention',
    -- 'expansion', 'renewal', 'upsell', 'referral', 'churn_risk'

    signal_strength NUMERIC(3,2) DEFAULT 0.5 CHECK (signal_strength >= 0 AND signal_strength <= 1),
    extracted_text TEXT,
    context JSONB DEFAULT '{}',

    actioned BOOLEAN DEFAULT FALSE,
    actioned_at TIMESTAMPTZ,
    action_taken TEXT,
    action_result TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signals_unactioned
    ON opportunity_signals(tenant_id, actioned, signal_strength DESC)
    WHERE actioned = FALSE;
CREATE INDEX IF NOT EXISTS idx_signals_client ON opportunity_signals(client_id, created_at DESC);

-- ============================================================================
-- P1.7: Quarterly Compliance
-- ============================================================================

-- Compliance schedule
CREATE TABLE IF NOT EXISTS compliance_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    compliance_type TEXT NOT NULL, -- 'vendor_profile_verification', 'license_renewal', etc.
    description TEXT,
    frequency TEXT NOT NULL DEFAULT 'quarterly'
        CHECK (frequency IN ('monthly', 'quarterly', 'semi_annual', 'annual')),

    -- Timing
    next_due_at TIMESTAMPTZ NOT NULL,
    last_completed_at TIMESTAMPTZ,

    -- Target specification
    target_entity_type TEXT NOT NULL, -- 'client', 'contact', 'vendor'
    target_filter JSONB DEFAULT '{}', -- Filter criteria for entities

    -- Required fields to verify
    required_fields JSONB DEFAULT '[]',

    -- Notification settings
    notification_days_before INTEGER DEFAULT 14,
    escalation_days_after INTEGER DEFAULT 7,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_schedule_due
    ON compliance_schedule(tenant_id, next_due_at)
    WHERE is_active = TRUE;

-- Compliance checks (individual items)
CREATE TABLE IF NOT EXISTS compliance_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES compliance_schedule(id) ON DELETE SET NULL,

    -- Target
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    entity_name TEXT,

    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    due_at TIMESTAMPTZ NOT NULL,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_progress', 'awaiting_response',
                          'completed', 'overdue', 'escalated', 'waived')),

    -- Data validation
    required_fields JSONB DEFAULT '[]', -- Fields to verify
    missing_fields JSONB DEFAULT '[]', -- Fields found missing
    validation_errors JSONB DEFAULT '[]',

    -- Communication
    reminder_sent_at TIMESTAMPTZ,
    reminder_count INTEGER DEFAULT 0,
    escalation_sent_at TIMESTAMPTZ,
    escalated_to UUID REFERENCES profiles(id),

    -- Resolution
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES profiles(id),
    waived_reason TEXT,
    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_due
    ON compliance_checks(tenant_id, status, due_at)
    WHERE status IN ('pending', 'in_progress', 'overdue');
CREATE INDEX IF NOT EXISTS idx_compliance_entity ON compliance_checks(entity_type, entity_id);

-- Function to get compliance checks due
CREATE OR REPLACE FUNCTION get_compliance_due(p_tenant_id UUID, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    check_id UUID,
    schedule_id UUID,
    entity_type TEXT,
    entity_id UUID,
    entity_name TEXT,
    due_at TIMESTAMPTZ,
    status TEXT,
    days_until_due INTEGER,
    is_overdue BOOLEAN,
    reminder_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id as check_id,
        c.schedule_id,
        c.entity_type,
        c.entity_id,
        c.entity_name,
        c.due_at,
        c.status,
        EXTRACT(DAY FROM (c.due_at - NOW()))::INTEGER as days_until_due,
        c.due_at < NOW() as is_overdue,
        c.reminder_count
    FROM compliance_checks c
    JOIN compliance_schedule s ON s.id = c.schedule_id
    WHERE c.tenant_id = p_tenant_id
      AND c.status IN ('pending', 'in_progress', 'overdue')
      AND (
          -- Due within notification window
          c.due_at <= NOW() + (s.notification_days_before || ' days')::INTERVAL
          OR
          -- Already overdue
          c.due_at < NOW()
      )
    ORDER BY
        c.due_at < NOW() DESC, -- Overdue first
        c.due_at ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE feedback_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_stage_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_enrichment_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies (USING for reads, WITH CHECK for writes)
CREATE POLICY tenant_isolation ON feedback_requests
    FOR ALL
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY tenant_isolation ON deal_stage_history
    FOR ALL
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY tenant_isolation ON deal_stage_config
    FOR ALL
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY tenant_isolation ON quotes
    FOR ALL
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY tenant_isolation ON quote_activities
    FOR ALL
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY tenant_isolation ON quote_outcomes
    FOR ALL
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY tenant_isolation ON contact_enrichment_queue
    FOR ALL
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY tenant_isolation ON opportunity_signals
    FOR ALL
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY tenant_isolation ON compliance_schedule
    FOR ALL
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY tenant_isolation ON compliance_checks
    FOR ALL
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Service role policies for autonomous agent
CREATE POLICY service_role_all ON feedback_requests
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON deal_stage_history
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON deal_stage_config
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON quotes
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON quote_activities
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON quote_outcomes
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON contact_enrichment_queue
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON opportunity_signals
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON compliance_schedule
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON compliance_checks
    FOR ALL TO service_role USING (true) WITH CHECK (true);
