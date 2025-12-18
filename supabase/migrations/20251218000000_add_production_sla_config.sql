-- Migration: Add Production SLA Configuration
-- Purpose: Configure task due date SLA per stage with inspection date as milestone

-- ============================================================================
-- PRODUCTION SLA CONFIGURATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.production_sla_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- Stage this SLA applies to
  stage TEXT NOT NULL CHECK (stage IN (
    'INTAKE', 'SCHEDULING', 'SCHEDULED', 'INSPECTED',
    'FINALIZATION', 'READY_FOR_DELIVERY', 'DELIVERED',
    'CORRECTION', 'REVISION', 'WORKFILE'
  )),

  -- SLA Configuration
  sla_days INTEGER NOT NULL DEFAULT 1 CHECK (sla_days >= 0),

  -- Reference point for calculating due date
  -- 'stage_entry': due_date = stage entry date + sla_days
  -- 'card_created': due_date = card created date + sla_days
  -- 'inspection_before': due_date = inspection_date - sla_days
  -- 'inspection_after': due_date = inspection_date + sla_days
  reference_point TEXT NOT NULL DEFAULT 'stage_entry' CHECK (reference_point IN (
    'stage_entry',
    'card_created',
    'inspection_before',
    'inspection_after'
  )),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one SLA config per stage per tenant
  UNIQUE(tenant_id, stage)
);

-- Enable RLS
ALTER TABLE public.production_sla_config ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY production_sla_config_tenant_isolation
  ON public.production_sla_config
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Index for fast lookups
CREATE INDEX idx_production_sla_config_tenant_stage
  ON public.production_sla_config(tenant_id, stage);

-- ============================================================================
-- INSERT DEFAULT SLA VALUES
-- ============================================================================

-- Function to initialize default SLA for a tenant
CREATE OR REPLACE FUNCTION initialize_production_sla_defaults(p_tenant_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert default SLA configuration for each stage
  INSERT INTO public.production_sla_config (tenant_id, stage, sla_days, reference_point)
  VALUES
    -- Pre-inspection stages (relative to stage entry or card created)
    (p_tenant_id, 'INTAKE', 1, 'card_created'),
    (p_tenant_id, 'SCHEDULING', 1, 'stage_entry'),

    -- Inspection-relative stages
    (p_tenant_id, 'SCHEDULED', 1, 'inspection_before'),
    (p_tenant_id, 'INSPECTED', 1, 'inspection_after'),
    (p_tenant_id, 'FINALIZATION', 1, 'inspection_after'),
    (p_tenant_id, 'READY_FOR_DELIVERY', 1, 'inspection_after'),

    -- Post-delivery stages (relative to stage entry)
    (p_tenant_id, 'DELIVERED', 1, 'stage_entry'),
    (p_tenant_id, 'CORRECTION', 2, 'stage_entry'),
    (p_tenant_id, 'REVISION', 2, 'stage_entry'),
    (p_tenant_id, 'WORKFILE', 1, 'stage_entry')
  ON CONFLICT (tenant_id, stage) DO NOTHING;
END;
$$;

-- ============================================================================
-- FUNCTION: Calculate task due date based on SLA
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_task_due_date(
  p_tenant_id UUID,
  p_stage TEXT,
  p_card_created_at TIMESTAMPTZ,
  p_stage_entered_at TIMESTAMPTZ,
  p_inspection_date TIMESTAMPTZ
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
AS $$
DECLARE
  v_sla RECORD;
  v_base_date TIMESTAMPTZ;
  v_due_date TIMESTAMPTZ;
BEGIN
  -- Get SLA config for this stage
  SELECT sla_days, reference_point
  INTO v_sla
  FROM public.production_sla_config
  WHERE tenant_id = p_tenant_id AND stage = p_stage;

  -- If no SLA config, return NULL (no automatic due date)
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Determine base date based on reference point
  CASE v_sla.reference_point
    WHEN 'card_created' THEN
      v_base_date := p_card_created_at;
    WHEN 'stage_entry' THEN
      v_base_date := p_stage_entered_at;
    WHEN 'inspection_before' THEN
      -- If no inspection date, fall back to stage entry
      v_base_date := COALESCE(p_inspection_date, p_stage_entered_at);
      IF p_inspection_date IS NOT NULL THEN
        -- Subtract days for "before inspection"
        RETURN v_base_date - make_interval(days => v_sla.sla_days);
      END IF;
    WHEN 'inspection_after' THEN
      -- If no inspection date, fall back to stage entry
      v_base_date := COALESCE(p_inspection_date, p_stage_entered_at);
  END CASE;

  -- Calculate due date (add days for most reference points)
  IF v_sla.reference_point != 'inspection_before' THEN
    v_due_date := v_base_date + make_interval(days => v_sla.sla_days);
  ELSE
    v_due_date := v_base_date;
  END IF;

  RETURN v_due_date;
END;
$$;

-- ============================================================================
-- UPDATE generate_stage_tasks TO SET DUE DATES
-- ============================================================================

-- Drop existing function and recreate with due date logic
DROP FUNCTION IF EXISTS generate_stage_tasks(UUID, TEXT);

CREATE OR REPLACE FUNCTION generate_stage_tasks(p_card_id UUID, p_stage TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_card RECORD;
  v_template_task RECORD;
  v_new_task_id UUID;
  v_subtask RECORD;
  v_assigned_user UUID;
  v_task_due_date TIMESTAMPTZ;
  v_inspection_date TIMESTAMPTZ;
BEGIN
  -- Get card details including inspection date from order
  SELECT
    c.*,
    o.inspection_date
  INTO v_card
  FROM production_cards c
  JOIN orders o ON o.id = c.order_id
  WHERE c.id = p_card_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Production card not found: %', p_card_id;
  END IF;

  -- Check if stage already processed
  IF p_stage = ANY(v_card.processed_stages) THEN
    RETURN; -- Already processed, skip
  END IF;

  -- Calculate task due date based on SLA
  v_task_due_date := calculate_task_due_date(
    v_card.tenant_id,
    p_stage,
    v_card.created_at,
    NOW(), -- stage entered at
    v_card.inspection_date
  );

  -- Get template tasks for this stage
  FOR v_template_task IN
    SELECT * FROM production_template_tasks
    WHERE template_id = v_card.template_id AND stage = p_stage
    ORDER BY sort_order
  LOOP
    -- Determine assigned user based on role
    v_assigned_user := CASE v_template_task.default_role
      WHEN 'appraiser' THEN v_card.assigned_appraiser_id
      WHEN 'reviewer' THEN v_card.assigned_reviewer_id
      WHEN 'admin' THEN v_card.assigned_admin_id
      WHEN 'trainee' THEN v_card.assigned_trainee_id
      WHEN 'researcher_level_1' THEN COALESCE(
        v_card.assigned_researcher_level_1_id,
        v_card.assigned_researcher_level_2_id,
        v_card.assigned_researcher_level_3_id
      )
      WHEN 'researcher_level_2' THEN COALESCE(
        v_card.assigned_researcher_level_2_id,
        v_card.assigned_researcher_level_3_id
      )
      WHEN 'researcher_level_3' THEN v_card.assigned_researcher_level_3_id
      WHEN 'inspector' THEN v_card.assigned_inspector_id
      ELSE NULL
    END;

    -- Create task with due date
    INSERT INTO production_tasks (
      production_card_id,
      tenant_id,
      template_task_id,
      title,
      description,
      stage,
      role,
      assigned_to,
      status,
      is_required,
      sort_order,
      estimated_minutes,
      due_date
    ) VALUES (
      p_card_id,
      v_card.tenant_id,
      v_template_task.id,
      v_template_task.title,
      v_template_task.description,
      p_stage,
      v_template_task.default_role,
      v_assigned_user,
      'pending',
      v_template_task.is_required,
      v_template_task.sort_order,
      v_template_task.estimated_minutes,
      v_task_due_date
    )
    RETURNING id INTO v_new_task_id;

    -- Create subtasks with same due date
    FOR v_subtask IN
      SELECT * FROM production_template_subtasks
      WHERE parent_task_id = v_template_task.id
      ORDER BY sort_order
    LOOP
      -- Determine subtask assigned user
      v_assigned_user := CASE v_subtask.default_role
        WHEN 'appraiser' THEN v_card.assigned_appraiser_id
        WHEN 'reviewer' THEN v_card.assigned_reviewer_id
        WHEN 'admin' THEN v_card.assigned_admin_id
        WHEN 'trainee' THEN v_card.assigned_trainee_id
        WHEN 'researcher_level_1' THEN COALESCE(
          v_card.assigned_researcher_level_1_id,
          v_card.assigned_researcher_level_2_id,
          v_card.assigned_researcher_level_3_id
        )
        WHEN 'researcher_level_2' THEN COALESCE(
          v_card.assigned_researcher_level_2_id,
          v_card.assigned_researcher_level_3_id
        )
        WHEN 'researcher_level_3' THEN v_card.assigned_researcher_level_3_id
        WHEN 'inspector' THEN v_card.assigned_inspector_id
        ELSE NULL
      END;

      INSERT INTO production_tasks (
        production_card_id,
        tenant_id,
        parent_task_id,
        title,
        description,
        stage,
        role,
        assigned_to,
        status,
        is_required,
        sort_order,
        estimated_minutes,
        due_date
      ) VALUES (
        p_card_id,
        v_card.tenant_id,
        v_new_task_id,
        v_subtask.title,
        v_subtask.description,
        p_stage,
        v_subtask.default_role,
        v_assigned_user,
        'pending',
        v_subtask.is_required,
        v_subtask.sort_order,
        v_subtask.estimated_minutes,
        v_task_due_date
      );
    END LOOP;
  END LOOP;

  -- Mark stage as processed
  UPDATE production_cards
  SET processed_stages = array_append(processed_stages, p_stage)
  WHERE id = p_card_id;
END;
$$;

-- ============================================================================
-- FUNCTION: Update task due dates when inspection date changes
-- ============================================================================

CREATE OR REPLACE FUNCTION update_task_due_dates_on_inspection_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_card RECORD;
  v_task_due_date TIMESTAMPTZ;
BEGIN
  -- Only trigger if inspection_date changed
  IF OLD.inspection_date IS DISTINCT FROM NEW.inspection_date THEN
    -- Find all production cards for this order (with explicit tenant check for defense-in-depth)
    FOR v_card IN
      SELECT pc.*
      FROM production_cards pc
      WHERE pc.order_id = NEW.id
        AND pc.tenant_id = NEW.tenant_id  -- Defense-in-depth: explicit tenant check
        AND pc.completed_at IS NULL
    LOOP
      -- Update due dates for inspection-relative stages
      UPDATE production_tasks pt
      SET due_date = calculate_task_due_date(
        v_card.tenant_id,
        pt.stage,
        v_card.created_at,
        v_card.updated_at,
        NEW.inspection_date
      )
      WHERE pt.production_card_id = v_card.id
        AND pt.status IN ('pending', 'in_progress')
        AND pt.stage IN ('SCHEDULED', 'INSPECTED', 'FINALIZATION', 'READY_FOR_DELIVERY');
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS trg_update_task_due_dates_on_inspection ON orders;
CREATE TRIGGER trg_update_task_due_dates_on_inspection
  AFTER UPDATE OF inspection_date ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_task_due_dates_on_inspection_change();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.production_sla_config IS
  'SLA configuration for production task due dates per stage. Inspection date serves as milestone for post-scheduling stages.';

COMMENT ON COLUMN public.production_sla_config.reference_point IS
  'Base date for SLA calculation: card_created, stage_entry, inspection_before (due X days before inspection), inspection_after (due X days after inspection)';

COMMENT ON FUNCTION calculate_task_due_date IS
  'Calculates task due date based on tenant SLA configuration and reference point (card created, stage entry, or inspection date)';
