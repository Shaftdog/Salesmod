-- Migration: Corrections & Revisions Workflow System
-- Creates tables and functions for handling internal corrections and external revisions

-- ============================================================================
-- TABLE: correction_requests
-- ============================================================================
-- Tracks all correction and revision requests

CREATE TABLE IF NOT EXISTS correction_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  production_card_id UUID NOT NULL REFERENCES production_cards(id) ON DELETE CASCADE,
  source_task_id UUID REFERENCES production_tasks(id) ON DELETE SET NULL,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,

  -- Type & Status
  request_type TEXT NOT NULL CHECK (request_type IN ('correction', 'revision')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'review', 'approved', 'rejected')),

  -- Details
  description TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('minor', 'major', 'critical')),
  category TEXT CHECK (category IN ('data', 'format', 'compliance', 'calculation', 'other')),

  -- Stage tracking
  previous_stage TEXT NOT NULL,

  -- Assignment
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Resolution
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,

  -- AI & Metadata
  ai_summary TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for correction_requests
CREATE INDEX IF NOT EXISTS idx_correction_requests_tenant ON correction_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_correction_requests_card ON correction_requests(production_card_id);
CREATE INDEX IF NOT EXISTS idx_correction_requests_assignee ON correction_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_correction_requests_status ON correction_requests(status);
CREATE INDEX IF NOT EXISTS idx_correction_requests_case ON correction_requests(case_id);
CREATE INDEX IF NOT EXISTS idx_correction_requests_type ON correction_requests(request_type);

-- ============================================================================
-- TABLE: resource_work_history
-- ============================================================================
-- Stores work history summaries per resource for performance tracking

CREATE TABLE IF NOT EXISTS resource_work_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES production_resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- References
  correction_request_id UUID REFERENCES correction_requests(id) ON DELETE SET NULL,
  production_task_id UUID REFERENCES production_tasks(id) ON DELETE SET NULL,
  production_card_id UUID REFERENCES production_cards(id) ON DELETE SET NULL,

  -- Event type
  event_type TEXT NOT NULL CHECK (event_type IN (
    'correction_received',
    'correction_completed',
    'correction_approved',
    'correction_rejected',
    'revision_received',
    'revision_completed'
  )),

  -- Details
  summary TEXT NOT NULL,
  impact_score INT CHECK (impact_score >= 1 AND impact_score <= 10),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for resource_work_history
CREATE INDEX IF NOT EXISTS idx_resource_work_history_tenant ON resource_work_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_resource_work_history_resource ON resource_work_history(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_work_history_user ON resource_work_history(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_work_history_created ON resource_work_history(created_at DESC);

-- ============================================================================
-- RLS POLICIES: correction_requests
-- ============================================================================

ALTER TABLE correction_requests ENABLE ROW LEVEL SECURITY;

-- Read: Users can see corrections in their tenant
CREATE POLICY correction_requests_read ON correction_requests
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Insert: Users can create corrections in their tenant
CREATE POLICY correction_requests_insert ON correction_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Update: Users can update corrections in their tenant
CREATE POLICY correction_requests_update ON correction_requests
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Delete: Only the requester or admins can delete
CREATE POLICY correction_requests_delete ON correction_requests
  FOR DELETE
  USING (
    requested_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin')
    )
  );

-- ============================================================================
-- RLS POLICIES: resource_work_history
-- ============================================================================

ALTER TABLE resource_work_history ENABLE ROW LEVEL SECURITY;

-- Read: Users can see work history in their tenant
CREATE POLICY resource_work_history_read ON resource_work_history
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Insert: System can insert work history (via functions)
CREATE POLICY resource_work_history_insert ON resource_work_history
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTION: create_correction_request
-- ============================================================================
-- Creates a correction request and moves the card to CORRECTION stage

CREATE OR REPLACE FUNCTION create_correction_request(
  p_card_id UUID,
  p_source_task_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT '',
  p_severity TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_assigned_to UUID DEFAULT NULL,
  p_reviewer_id UUID DEFAULT NULL,
  p_ai_summary TEXT DEFAULT NULL
)
RETURNS correction_requests AS $$
DECLARE
  v_card production_cards;
  v_request correction_requests;
  v_tenant_id UUID;
  v_user_id UUID;
  v_resource_id UUID;
BEGIN
  v_user_id := auth.uid();

  -- Get tenant_id from user profile
  SELECT tenant_id INTO v_tenant_id
  FROM profiles WHERE id = v_user_id;

  -- Get card and current stage
  SELECT * INTO v_card
  FROM production_cards WHERE id = p_card_id;

  IF v_card IS NULL THEN
    RAISE EXCEPTION 'Production card not found';
  END IF;

  -- If no assigned_to provided, use the original task assignee
  IF p_assigned_to IS NULL AND p_source_task_id IS NOT NULL THEN
    SELECT assigned_to INTO p_assigned_to
    FROM production_tasks WHERE id = p_source_task_id;
  END IF;

  -- If no reviewer provided, use the card's reviewer
  IF p_reviewer_id IS NULL THEN
    p_reviewer_id := v_card.assigned_reviewer_id;
  END IF;

  -- Create the correction request
  INSERT INTO correction_requests (
    tenant_id,
    production_card_id,
    source_task_id,
    request_type,
    description,
    severity,
    category,
    previous_stage,
    assigned_to,
    reviewer_id,
    requested_by,
    ai_summary
  ) VALUES (
    v_tenant_id,
    p_card_id,
    p_source_task_id,
    'correction',
    p_description,
    p_severity,
    p_category,
    v_card.current_stage,
    p_assigned_to,
    p_reviewer_id,
    v_user_id,
    p_ai_summary
  )
  RETURNING * INTO v_request;

  -- Move card to CORRECTION stage
  UPDATE production_cards
  SET
    current_stage = 'CORRECTION',
    updated_at = NOW()
  WHERE id = p_card_id;

  -- Create a correction task
  INSERT INTO production_tasks (
    production_card_id,
    title,
    description,
    stage,
    role,
    assigned_to,
    status,
    is_required,
    sort_order
  ) VALUES (
    p_card_id,
    'Correction: ' || COALESCE(p_ai_summary, LEFT(p_description, 100)),
    p_description,
    'CORRECTION',
    COALESCE((SELECT role FROM production_tasks WHERE id = p_source_task_id), 'appraiser'),
    p_assigned_to,
    'pending',
    true,
    0
  );

  -- Log to work history
  SELECT id INTO v_resource_id
  FROM production_resources
  WHERE user_id = p_assigned_to
  LIMIT 1;

  INSERT INTO resource_work_history (
    tenant_id,
    resource_id,
    user_id,
    correction_request_id,
    production_card_id,
    event_type,
    summary
  ) VALUES (
    v_tenant_id,
    v_resource_id,
    p_assigned_to,
    v_request.id,
    p_card_id,
    'correction_received',
    COALESCE(p_ai_summary, LEFT(p_description, 200))
  );

  -- Update card task counts
  PERFORM update_card_task_counts(p_card_id);

  RETURN v_request;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: create_revision_from_case
-- ============================================================================
-- Creates a revision request from a case

CREATE OR REPLACE FUNCTION create_revision_from_case(
  p_case_id UUID,
  p_description TEXT DEFAULT '',
  p_ai_summary TEXT DEFAULT NULL
)
RETURNS correction_requests AS $$
DECLARE
  v_case RECORD;
  v_card production_cards;
  v_request correction_requests;
  v_tenant_id UUID;
  v_user_id UUID;
  v_researcher_l3_id UUID;
  v_resource_id UUID;
BEGIN
  v_user_id := auth.uid();

  -- Get tenant_id from user profile
  SELECT tenant_id INTO v_tenant_id
  FROM profiles WHERE id = v_user_id;

  -- Get case with order_id
  SELECT * INTO v_case
  FROM cases WHERE id = p_case_id;

  IF v_case IS NULL THEN
    RAISE EXCEPTION 'Case not found';
  END IF;

  IF v_case.order_id IS NULL THEN
    RAISE EXCEPTION 'Case has no linked order';
  END IF;

  -- Get production card for the order
  SELECT * INTO v_card
  FROM production_cards WHERE order_id = v_case.order_id;

  IF v_card IS NULL THEN
    RAISE EXCEPTION 'No production card found for this order';
  END IF;

  -- Get Researcher Level 3 from card assignment
  v_researcher_l3_id := v_card.assigned_researcher_level_3_id;

  -- Create the revision request
  INSERT INTO correction_requests (
    tenant_id,
    production_card_id,
    case_id,
    request_type,
    description,
    previous_stage,
    assigned_to,
    reviewer_id,
    requested_by,
    ai_summary
  ) VALUES (
    v_tenant_id,
    v_card.id,
    p_case_id,
    'revision',
    COALESCE(p_description, v_case.description, 'Revision request from case'),
    v_card.current_stage,
    v_researcher_l3_id,
    v_card.assigned_reviewer_id,
    v_user_id,
    p_ai_summary
  )
  RETURNING * INTO v_request;

  -- Move card to REVISION stage
  UPDATE production_cards
  SET
    current_stage = 'REVISION',
    updated_at = NOW()
  WHERE id = v_card.id;

  -- Create a revision task
  INSERT INTO production_tasks (
    production_card_id,
    title,
    description,
    stage,
    role,
    assigned_to,
    status,
    is_required,
    sort_order
  ) VALUES (
    v_card.id,
    'Revision: ' || COALESCE(p_ai_summary, LEFT(COALESCE(p_description, v_case.subject), 100)),
    COALESCE(p_description, v_case.description),
    'REVISION',
    'researcher_level_3',
    v_researcher_l3_id,
    'pending',
    true,
    0
  );

  -- Log to work history
  IF v_researcher_l3_id IS NOT NULL THEN
    SELECT id INTO v_resource_id
    FROM production_resources
    WHERE user_id = v_researcher_l3_id
    LIMIT 1;

    INSERT INTO resource_work_history (
      tenant_id,
      resource_id,
      user_id,
      correction_request_id,
      production_card_id,
      event_type,
      summary
    ) VALUES (
      v_tenant_id,
      v_resource_id,
      v_researcher_l3_id,
      v_request.id,
      v_card.id,
      'revision_received',
      COALESCE(p_ai_summary, LEFT(COALESCE(p_description, v_case.subject), 200))
    );
  END IF;

  -- Update card task counts
  PERFORM update_card_task_counts(v_card.id);

  RETURN v_request;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: complete_correction
-- ============================================================================
-- Marks correction as ready for review and creates review task

CREATE OR REPLACE FUNCTION complete_correction(
  p_request_id UUID,
  p_resolution_notes TEXT DEFAULT NULL
)
RETURNS correction_requests AS $$
DECLARE
  v_request correction_requests;
  v_tenant_id UUID;
  v_resource_id UUID;
BEGIN
  -- Get the correction request
  SELECT * INTO v_request
  FROM correction_requests WHERE id = p_request_id;

  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Correction request not found';
  END IF;

  -- Update status to review
  UPDATE correction_requests
  SET
    status = 'review',
    resolution_notes = p_resolution_notes,
    updated_at = NOW()
  WHERE id = p_request_id
  RETURNING * INTO v_request;

  -- Mark correction tasks as completed
  UPDATE production_tasks
  SET
    status = 'completed',
    completed_at = NOW()
  WHERE production_card_id = v_request.production_card_id
    AND stage IN ('CORRECTION', 'REVISION')
    AND status != 'completed'
    AND title LIKE 'Correction:%' OR title LIKE 'Revision:%';

  -- Create review task for reviewer
  INSERT INTO production_tasks (
    production_card_id,
    title,
    description,
    stage,
    role,
    assigned_to,
    status,
    is_required,
    sort_order
  ) VALUES (
    v_request.production_card_id,
    'Review ' || v_request.request_type || ': ' || LEFT(v_request.description, 80),
    'Review the completed ' || v_request.request_type || E'.\n\nOriginal Issue: ' || v_request.description || E'\n\nResolution: ' || COALESCE(p_resolution_notes, 'No notes provided'),
    CASE WHEN v_request.request_type = 'correction' THEN 'CORRECTION' ELSE 'REVISION' END,
    'reviewer',
    v_request.reviewer_id,
    'pending',
    true,
    1
  );

  -- Log completion to work history
  SELECT tenant_id INTO v_tenant_id
  FROM profiles WHERE id = v_request.assigned_to;

  SELECT id INTO v_resource_id
  FROM production_resources
  WHERE user_id = v_request.assigned_to
  LIMIT 1;

  INSERT INTO resource_work_history (
    tenant_id,
    resource_id,
    user_id,
    correction_request_id,
    production_card_id,
    event_type,
    summary
  ) VALUES (
    v_tenant_id,
    v_resource_id,
    v_request.assigned_to,
    v_request.id,
    v_request.production_card_id,
    v_request.request_type || '_completed',
    'Completed ' || v_request.request_type || ': ' || LEFT(v_request.description, 150)
  );

  -- Update card task counts
  PERFORM update_card_task_counts(v_request.production_card_id);

  RETURN v_request;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: approve_correction
-- ============================================================================
-- Approves correction and returns card to previous stage

CREATE OR REPLACE FUNCTION approve_correction(
  p_request_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS correction_requests AS $$
DECLARE
  v_request correction_requests;
  v_tenant_id UUID;
  v_resource_id UUID;
BEGIN
  -- Get the correction request
  SELECT * INTO v_request
  FROM correction_requests WHERE id = p_request_id;

  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Correction request not found';
  END IF;

  -- Update status to approved
  UPDATE correction_requests
  SET
    status = 'approved',
    resolution_notes = COALESCE(resolution_notes, '') || E'\n\nApproved: ' || COALESCE(p_notes, 'Approved by reviewer'),
    resolved_at = NOW(),
    updated_at = NOW()
  WHERE id = p_request_id
  RETURNING * INTO v_request;

  -- Mark review tasks as completed
  UPDATE production_tasks
  SET
    status = 'completed',
    completed_at = NOW()
  WHERE production_card_id = v_request.production_card_id
    AND stage IN ('CORRECTION', 'REVISION')
    AND status != 'completed';

  -- Return card to previous stage
  UPDATE production_cards
  SET
    current_stage = v_request.previous_stage,
    updated_at = NOW()
  WHERE id = v_request.production_card_id;

  -- Generate tasks for the previous stage (if needed)
  PERFORM generate_stage_tasks(v_request.production_card_id, v_request.previous_stage);

  -- Log approval to work history
  SELECT tenant_id INTO v_tenant_id
  FROM profiles WHERE id = v_request.assigned_to;

  SELECT id INTO v_resource_id
  FROM production_resources
  WHERE user_id = v_request.assigned_to
  LIMIT 1;

  INSERT INTO resource_work_history (
    tenant_id,
    resource_id,
    user_id,
    correction_request_id,
    production_card_id,
    event_type,
    summary
  ) VALUES (
    v_tenant_id,
    v_resource_id,
    v_request.assigned_to,
    v_request.id,
    v_request.production_card_id,
    'correction_approved',
    'Approved: ' || LEFT(v_request.description, 150)
  );

  -- Update card task counts
  PERFORM update_card_task_counts(v_request.production_card_id);

  RETURN v_request;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: reject_correction (request another)
-- ============================================================================
-- Creates a new correction request if the fix wasn't satisfactory

CREATE OR REPLACE FUNCTION reject_correction(
  p_request_id UUID,
  p_notes TEXT,
  p_create_new BOOLEAN DEFAULT TRUE
)
RETURNS correction_requests AS $$
DECLARE
  v_request correction_requests;
  v_new_request correction_requests;
  v_tenant_id UUID;
  v_resource_id UUID;
BEGIN
  -- Get the correction request
  SELECT * INTO v_request
  FROM correction_requests WHERE id = p_request_id;

  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Correction request not found';
  END IF;

  -- Update status to rejected
  UPDATE correction_requests
  SET
    status = 'rejected',
    resolution_notes = COALESCE(resolution_notes, '') || E'\n\nRejected: ' || p_notes,
    resolved_at = NOW(),
    updated_at = NOW()
  WHERE id = p_request_id
  RETURNING * INTO v_request;

  -- Log rejection to work history
  SELECT tenant_id INTO v_tenant_id
  FROM profiles WHERE id = v_request.assigned_to;

  SELECT id INTO v_resource_id
  FROM production_resources
  WHERE user_id = v_request.assigned_to
  LIMIT 1;

  INSERT INTO resource_work_history (
    tenant_id,
    resource_id,
    user_id,
    correction_request_id,
    production_card_id,
    event_type,
    summary,
    impact_score
  ) VALUES (
    v_tenant_id,
    v_resource_id,
    v_request.assigned_to,
    v_request.id,
    v_request.production_card_id,
    'correction_rejected',
    'Rejected: ' || p_notes,
    CASE v_request.severity
      WHEN 'critical' THEN 8
      WHEN 'major' THEN 5
      ELSE 2
    END
  );

  -- Create new correction if requested
  IF p_create_new THEN
    INSERT INTO correction_requests (
      tenant_id,
      production_card_id,
      source_task_id,
      case_id,
      request_type,
      description,
      severity,
      category,
      previous_stage,
      assigned_to,
      reviewer_id,
      requested_by,
      ai_summary,
      metadata
    )
    SELECT
      tenant_id,
      production_card_id,
      source_task_id,
      case_id,
      request_type,
      'Follow-up: ' || p_notes,
      severity,
      category,
      previous_stage,
      assigned_to,
      reviewer_id,
      auth.uid(),
      'Follow-up ' || request_type || ' required',
      jsonb_build_object('previous_request_id', id)
    FROM correction_requests
    WHERE id = p_request_id
    RETURNING * INTO v_new_request;

    -- Create new correction task
    INSERT INTO production_tasks (
      production_card_id,
      title,
      description,
      stage,
      role,
      assigned_to,
      status,
      is_required,
      sort_order
    ) VALUES (
      v_request.production_card_id,
      'Correction: ' || LEFT(p_notes, 100),
      p_notes,
      CASE WHEN v_request.request_type = 'correction' THEN 'CORRECTION' ELSE 'REVISION' END,
      COALESCE((SELECT role FROM production_tasks WHERE id = v_request.source_task_id), 'appraiser'),
      v_request.assigned_to,
      'pending',
      true,
      0
    );

    -- Log new correction to work history
    INSERT INTO resource_work_history (
      tenant_id,
      resource_id,
      user_id,
      correction_request_id,
      production_card_id,
      event_type,
      summary
    ) VALUES (
      v_tenant_id,
      v_resource_id,
      v_request.assigned_to,
      v_new_request.id,
      v_request.production_card_id,
      'correction_received',
      'Follow-up required: ' || LEFT(p_notes, 150)
    );

    -- Update card task counts
    PERFORM update_card_task_counts(v_request.production_card_id);

    RETURN v_new_request;
  END IF;

  RETURN v_request;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Update timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_correction_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS correction_requests_updated_at ON correction_requests;
CREATE TRIGGER correction_requests_updated_at
  BEFORE UPDATE ON correction_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_correction_request_timestamp();
