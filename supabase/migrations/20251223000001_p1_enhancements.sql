-- P1 Enhancements (Post-Migration Optimizations)
-- Apply after 20251223000000_p1_engines.sql
-- These are recommended performance and automation improvements

-- ============================================================================
-- Performance Indexes
-- ============================================================================

-- Optimize deal follow-up queries
CREATE INDEX IF NOT EXISTS idx_deals_follow_up
  ON deals(tenant_id, auto_follow_up_enabled, next_follow_up_at)
  WHERE auto_follow_up_enabled = TRUE;

-- Optimize stall detection queries
CREATE INDEX IF NOT EXISTS idx_deals_stall_detection
  ON deals(tenant_id, stage, last_activity_at)
  WHERE stage NOT IN ('won', 'lost');

-- Optimize contact enrichment email lookups
CREATE INDEX IF NOT EXISTS idx_enrichment_email
  ON contact_enrichment_queue(tenant_id, email_address)
  WHERE status = 'pending';

-- Optimize quote outcomes reporting
CREATE INDEX IF NOT EXISTS idx_quote_outcomes_analysis
  ON quote_outcomes(tenant_id, outcome, recorded_at DESC);

-- ============================================================================
-- Automatic Deal Stage History Tracking
-- ============================================================================

-- Function to automatically log stage changes
CREATE OR REPLACE FUNCTION log_deal_stage_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only log if stage actually changed
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO deal_stage_history (
      tenant_id,
      deal_id,
      from_stage,
      to_stage,
      changed_at,
      changed_by,
      days_in_previous_stage
    ) VALUES (
      NEW.tenant_id,
      NEW.id,
      OLD.stage,
      NEW.stage,
      NOW(),
      auth.uid(), -- Current user making the change
      EXTRACT(DAY FROM (NOW() - OLD.updated_at))::INTEGER
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to automatically track stage changes
DROP TRIGGER IF EXISTS deal_stage_change ON deals;
CREATE TRIGGER deal_stage_change
  AFTER UPDATE ON deals
  FOR EACH ROW
  WHEN (OLD.stage IS DISTINCT FROM NEW.stage)
  EXECUTE FUNCTION log_deal_stage_change();

-- ============================================================================
-- Default Deal Stage Configuration
-- ============================================================================

-- Function to seed default stage config for a tenant
CREATE OR REPLACE FUNCTION seed_default_deal_stages(p_tenant_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert default stage configurations if they don't exist
  INSERT INTO deal_stage_config (tenant_id, stage, max_days_before_stale, follow_up_interval_days, max_follow_ups)
  VALUES
    (p_tenant_id, 'lead', 3, 2, 5),
    (p_tenant_id, 'qualified', 7, 3, 5),
    (p_tenant_id, 'proposal', 5, 2, 7),
    (p_tenant_id, 'negotiation', 7, 3, 5),
    (p_tenant_id, 'closed_won', 999, 30, 1), -- Minimal follow-up for won deals
    (p_tenant_id, 'closed_lost', 999, 30, 1) -- Minimal follow-up for lost deals
  ON CONFLICT (tenant_id, stage) DO NOTHING;
END;
$$;

-- Seed for existing tenants
DO $$
DECLARE
  tenant_record RECORD;
BEGIN
  FOR tenant_record IN SELECT id FROM tenants LOOP
    PERFORM seed_default_deal_stages(tenant_record.id);
  END LOOP;
END $$;

-- ============================================================================
-- Automatic Last Activity Tracking
-- ============================================================================

-- Function to update last_activity_at when deal is modified
CREATE OR REPLACE FUNCTION update_deal_last_activity()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update last_activity_at on any change (except last_activity_at itself)
  IF (
    OLD.stage IS DISTINCT FROM NEW.stage OR
    OLD.value IS DISTINCT FROM NEW.value OR
    OLD.probability IS DISTINCT FROM NEW.probability OR
    OLD.expected_close_date IS DISTINCT FROM NEW.expected_close_date OR
    OLD.description IS DISTINCT FROM NEW.description
  ) THEN
    NEW.last_activity_at := NOW();
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to track deal activity
DROP TRIGGER IF EXISTS deal_activity_update ON deals;
CREATE TRIGGER deal_activity_update
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_deal_last_activity();

-- ============================================================================
-- Quote Number Generation
-- ============================================================================

-- Function to generate next quote number for a tenant
CREATE OR REPLACE FUNCTION generate_quote_number(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year TEXT;
  v_sequence INTEGER;
  v_quote_number TEXT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');

  -- Get next sequence number for this year
  SELECT COALESCE(MAX(
    CASE
      WHEN quote_number ~ ('^Q-' || v_year || '-[0-9]+$')
      THEN SUBSTRING(quote_number FROM '[0-9]+$')::INTEGER
      ELSE 0
    END
  ), 0) + 1 INTO v_sequence
  FROM quotes
  WHERE tenant_id = p_tenant_id
    AND quote_number LIKE 'Q-' || v_year || '-%';

  -- Format: Q-YYYY-0001
  v_quote_number := 'Q-' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');

  RETURN v_quote_number;
END;
$$;

-- ============================================================================
-- Compliance Schedule Management
-- ============================================================================

-- Function to advance compliance schedule to next period
CREATE OR REPLACE FUNCTION advance_compliance_schedule(p_schedule_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_schedule compliance_schedule;
  v_interval INTERVAL;
BEGIN
  SELECT * INTO v_schedule FROM compliance_schedule WHERE id = p_schedule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Schedule not found: %', p_schedule_id;
  END IF;

  -- Calculate interval based on frequency
  v_interval := CASE v_schedule.frequency
    WHEN 'monthly' THEN INTERVAL '1 month'
    WHEN 'quarterly' THEN INTERVAL '3 months'
    WHEN 'semi_annual' THEN INTERVAL '6 months'
    WHEN 'annual' THEN INTERVAL '1 year'
  END;

  -- Update schedule
  UPDATE compliance_schedule
  SET
    next_due_at = next_due_at + v_interval,
    last_completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_schedule_id;
END;
$$;

-- Function to create compliance checks from schedule
CREATE OR REPLACE FUNCTION create_compliance_checks_from_schedule(
  p_schedule_id UUID,
  p_entities JSONB -- Array of entities: [{"id": "uuid", "name": "text"}, ...]
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_schedule compliance_schedule;
  v_entity JSONB;
  v_count INTEGER := 0;
  v_period_start DATE;
  v_period_end DATE;
BEGIN
  SELECT * INTO v_schedule FROM compliance_schedule WHERE id = p_schedule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Schedule not found: %', p_schedule_id;
  END IF;

  -- Calculate period
  v_period_start := CURRENT_DATE;
  v_period_end := CASE v_schedule.frequency
    WHEN 'monthly' THEN CURRENT_DATE + INTERVAL '1 month'
    WHEN 'quarterly' THEN CURRENT_DATE + INTERVAL '3 months'
    WHEN 'semi_annual' THEN CURRENT_DATE + INTERVAL '6 months'
    WHEN 'annual' THEN CURRENT_DATE + INTERVAL '1 year'
  END;

  -- Create a check for each entity
  FOR v_entity IN SELECT * FROM jsonb_array_elements(p_entities)
  LOOP
    INSERT INTO compliance_checks (
      tenant_id,
      schedule_id,
      entity_type,
      entity_id,
      entity_name,
      period_start,
      period_end,
      due_at,
      required_fields,
      status
    ) VALUES (
      v_schedule.tenant_id,
      p_schedule_id,
      v_schedule.target_entity_type,
      (v_entity->>'id')::UUID,
      v_entity->>'name',
      v_period_start,
      v_period_end,
      v_schedule.next_due_at,
      v_schedule.required_fields,
      'pending'
    )
    ON CONFLICT DO NOTHING; -- Prevent duplicate checks

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ============================================================================
-- Signal Scoring Helper
-- ============================================================================

-- Function to calculate opportunity signal strength
-- (This is a simple version - can be enhanced with ML)
CREATE OR REPLACE FUNCTION calculate_signal_strength(
  p_signal_type TEXT,
  p_context JSONB
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_base_score NUMERIC;
BEGIN
  -- Base scores by signal type
  v_base_score := CASE p_signal_type
    WHEN 'complaint' THEN 0.8
    WHEN 'urgency' THEN 0.9
    WHEN 'budget_mention' THEN 0.85
    WHEN 'competitor_mention' THEN 0.75
    WHEN 'expansion' THEN 0.95
    WHEN 'renewal' THEN 0.9
    WHEN 'upsell' THEN 0.85
    WHEN 'referral' THEN 0.95
    WHEN 'churn_risk' THEN 0.95
    ELSE 0.5
  END;

  -- Adjust based on context
  -- Example: Increase if multiple keywords detected
  IF p_context ? 'keyword_count' AND (p_context->>'keyword_count')::INTEGER > 2 THEN
    v_base_score := LEAST(v_base_score + 0.1, 1.0);
  END IF;

  -- Example: Increase if from important contact
  IF p_context ? 'is_decision_maker' AND (p_context->>'is_decision_maker')::BOOLEAN THEN
    v_base_score := LEAST(v_base_score + 0.05, 1.0);
  END IF;

  RETURN ROUND(v_base_score, 2);
END;
$$;

-- ============================================================================
-- Analytics Views
-- ============================================================================

-- Deal velocity by stage
CREATE OR REPLACE VIEW deal_stage_velocity AS
SELECT
  tenant_id,
  to_stage,
  COUNT(*) as transitions,
  AVG(days_in_previous_stage) as avg_days,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_in_previous_stage) as median_days,
  MIN(days_in_previous_stage) as min_days,
  MAX(days_in_previous_stage) as max_days
FROM deal_stage_history
WHERE changed_at > NOW() - INTERVAL '90 days'
GROUP BY tenant_id, to_stage;

-- Quote win rate analysis
CREATE OR REPLACE VIEW quote_win_rates AS
SELECT
  tenant_id,
  COUNT(*) as total_quotes,
  COUNT(*) FILTER (WHERE outcome = 'won') as won_count,
  COUNT(*) FILTER (WHERE outcome = 'lost') as lost_count,
  COUNT(*) FILTER (WHERE outcome = 'no_decision') as no_decision_count,
  ROUND(
    COUNT(*) FILTER (WHERE outcome = 'won')::NUMERIC / NULLIF(COUNT(*), 0) * 100,
    2
  ) as win_rate_pct,
  AVG(total_amount) FILTER (WHERE outcome = 'won') as avg_won_amount,
  AVG(total_amount) FILTER (WHERE outcome = 'lost') as avg_lost_amount
FROM quotes
WHERE status IN ('accepted', 'rejected', 'expired')
  AND created_at > NOW() - INTERVAL '90 days'
GROUP BY tenant_id;

-- Signal action rate
CREATE OR REPLACE VIEW signal_action_rates AS
SELECT
  tenant_id,
  signal_type,
  COUNT(*) as total_signals,
  COUNT(*) FILTER (WHERE actioned = TRUE) as actioned_count,
  ROUND(
    COUNT(*) FILTER (WHERE actioned = TRUE)::NUMERIC / NULLIF(COUNT(*), 0) * 100,
    2
  ) as action_rate_pct,
  AVG(signal_strength) as avg_strength,
  AVG(EXTRACT(EPOCH FROM (actioned_at - created_at)) / 3600) FILTER (WHERE actioned = TRUE) as avg_hours_to_action
FROM opportunity_signals
WHERE created_at > NOW() - INTERVAL '90 days'
GROUP BY tenant_id, signal_type;

-- Compliance completion rate
CREATE OR REPLACE VIEW compliance_completion_rates AS
SELECT
  c.tenant_id,
  s.compliance_type,
  COUNT(*) as total_checks,
  COUNT(*) FILTER (WHERE c.status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE c.status = 'overdue') as overdue_count,
  COUNT(*) FILTER (WHERE c.status = 'waived') as waived_count,
  ROUND(
    COUNT(*) FILTER (WHERE c.status = 'completed')::NUMERIC / NULLIF(COUNT(*), 0) * 100,
    2
  ) as completion_rate_pct,
  AVG(EXTRACT(DAY FROM (c.completed_at - c.created_at))) FILTER (WHERE c.status = 'completed') as avg_days_to_complete
FROM compliance_checks c
JOIN compliance_schedule s ON s.id = c.schedule_id
WHERE c.created_at > NOW() - INTERVAL '90 days'
GROUP BY c.tenant_id, s.compliance_type;

-- Grant view access
GRANT SELECT ON deal_stage_velocity TO authenticated;
GRANT SELECT ON quote_win_rates TO authenticated;
GRANT SELECT ON signal_action_rates TO authenticated;
GRANT SELECT ON compliance_completion_rates TO authenticated;

-- Enable RLS on views (inherit from underlying tables)
ALTER VIEW deal_stage_velocity SET (security_barrier = true);
ALTER VIEW quote_win_rates SET (security_barrier = true);
ALTER VIEW signal_action_rates SET (security_barrier = true);
ALTER VIEW compliance_completion_rates SET (security_barrier = true);

-- ============================================================================
-- Optimization Complete
-- ============================================================================
