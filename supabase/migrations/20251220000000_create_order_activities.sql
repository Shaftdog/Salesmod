-- Migration: Create order_activities table for comprehensive order event tracking
-- This provides a unified timeline of all order-related events

-- =============================================
-- ORDER ACTIVITIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.order_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'order_created',
    'status_changed',
    'assigned',
    'unassigned',
    'document_uploaded',
    'document_deleted',
    'note_added',
    'note_updated',
    'due_date_changed',
    'priority_changed',
    'invoice_created',
    'invoice_sent',
    'payment_received',
    'contact_added',
    'contact_removed',
    'revision_requested',
    'correction_requested',
    'custom'
  )),
  description TEXT NOT NULL,
  -- Flexible metadata for activity-specific data
  metadata JSONB DEFAULT '{}',
  -- Actor info
  performed_by UUID REFERENCES auth.users(id),
  performed_by_name TEXT,  -- Cached for display when user might be deleted
  -- System vs user initiated
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_order_activities_tenant_id ON public.order_activities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_activities_order_id ON public.order_activities(order_id);
CREATE INDEX IF NOT EXISTS idx_order_activities_type ON public.order_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_order_activities_created_at ON public.order_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_activities_performed_by ON public.order_activities(performed_by);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.order_activities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view activities for orders in their tenant
CREATE POLICY order_activities_tenant_select
  ON public.order_activities
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- Policy: Users can insert activities for orders in their tenant
CREATE POLICY order_activities_tenant_insert
  ON public.order_activities
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- =============================================
-- HELPER FUNCTION TO LOG ORDER ACTIVITIES
-- =============================================
CREATE OR REPLACE FUNCTION log_order_activity(
  p_order_id UUID,
  p_activity_type TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}',
  p_is_system BOOLEAN DEFAULT false
) RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_user_name TEXT;
  v_activity_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();

  -- Get tenant_id from order
  SELECT tenant_id INTO v_tenant_id
  FROM public.orders
  WHERE id = p_order_id;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Get user name if not system
  IF NOT p_is_system AND v_user_id IS NOT NULL THEN
    SELECT name INTO v_user_name
    FROM public.profiles
    WHERE id = v_user_id;
  END IF;

  -- Insert activity
  INSERT INTO public.order_activities (
    tenant_id,
    order_id,
    activity_type,
    description,
    metadata,
    performed_by,
    performed_by_name,
    is_system
  ) VALUES (
    v_tenant_id,
    p_order_id,
    p_activity_type,
    p_description,
    p_metadata,
    v_user_id,
    COALESCE(v_user_name, CASE WHEN p_is_system THEN 'System' ELSE 'Unknown' END),
    p_is_system
  ) RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGER: Auto-log status changes
-- =============================================
CREATE OR REPLACE FUNCTION trigger_log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM log_order_activity(
      NEW.id,
      'status_changed',
      'Status changed to ''' || NEW.status || '''',
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status
      ),
      false
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for status changes
DROP TRIGGER IF EXISTS order_status_change_activity ON public.orders;
CREATE TRIGGER order_status_change_activity
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_order_status_change();

-- =============================================
-- TRIGGER: Auto-log assignment changes
-- =============================================
CREATE OR REPLACE FUNCTION trigger_log_order_assignment_change()
RETURNS TRIGGER AS $$
DECLARE
  v_assignee_name TEXT;
  v_old_assignee_name TEXT;
BEGIN
  -- Only log if assigned_to actually changed
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    -- Get new assignee name
    IF NEW.assigned_to IS NOT NULL THEN
      SELECT name INTO v_assignee_name
      FROM public.profiles
      WHERE id = NEW.assigned_to;
    END IF;

    -- Get old assignee name
    IF OLD.assigned_to IS NOT NULL THEN
      SELECT name INTO v_old_assignee_name
      FROM public.profiles
      WHERE id = OLD.assigned_to;
    END IF;

    IF NEW.assigned_to IS NULL THEN
      -- Unassigned
      PERFORM log_order_activity(
        NEW.id,
        'unassigned',
        'Unassigned from ' || COALESCE(v_old_assignee_name, 'unknown'),
        jsonb_build_object(
          'old_assigned_to', OLD.assigned_to,
          'old_assigned_to_name', v_old_assignee_name
        ),
        false
      );
    ELSE
      -- Assigned
      PERFORM log_order_activity(
        NEW.id,
        'assigned',
        'Assigned to ' || COALESCE(v_assignee_name, 'unknown'),
        jsonb_build_object(
          'assigned_to', NEW.assigned_to,
          'assigned_to_name', v_assignee_name,
          'old_assigned_to', OLD.assigned_to,
          'old_assigned_to_name', v_old_assignee_name
        ),
        false
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for assignment changes
DROP TRIGGER IF EXISTS order_assignment_change_activity ON public.orders;
CREATE TRIGGER order_assignment_change_activity
  AFTER UPDATE OF assigned_to ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_order_assignment_change();

-- =============================================
-- TRIGGER: Auto-log new orders
-- =============================================
CREATE OR REPLACE FUNCTION trigger_log_order_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_order_activity(
    NEW.id,
    'order_created',
    'Order created',
    jsonb_build_object(
      'order_number', NEW.order_number,
      'property_address', NEW.property_address,
      'order_type', NEW.order_type
    ),
    false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new orders
DROP TRIGGER IF EXISTS order_created_activity ON public.orders;
CREATE TRIGGER order_created_activity
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_order_created();

-- =============================================
-- TRIGGER: Auto-log document uploads
-- =============================================
CREATE OR REPLACE FUNCTION trigger_log_document_uploaded()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_order_activity(
    NEW.order_id,
    'document_uploaded',
    NEW.file_name || ' uploaded',
    jsonb_build_object(
      'document_id', NEW.id,
      'document_type', NEW.document_type,
      'file_name', NEW.file_name,
      'file_size', NEW.file_size,
      'mime_type', NEW.mime_type
    ),
    false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for document uploads
DROP TRIGGER IF EXISTS document_uploaded_activity ON public.order_documents;
CREATE TRIGGER document_uploaded_activity
  AFTER INSERT ON public.order_documents
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_document_uploaded();

-- =============================================
-- TRIGGER: Auto-log document deletions
-- =============================================
CREATE OR REPLACE FUNCTION trigger_log_document_deleted()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_order_activity(
    OLD.order_id,
    'document_deleted',
    OLD.file_name || ' deleted',
    jsonb_build_object(
      'document_id', OLD.id,
      'document_type', OLD.document_type,
      'file_name', OLD.file_name
    ),
    false
  );

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for document deletions
DROP TRIGGER IF EXISTS document_deleted_activity ON public.order_documents;
CREATE TRIGGER document_deleted_activity
  AFTER DELETE ON public.order_documents
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_document_deleted();

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE public.order_activities IS 'Unified timeline of all order-related events';
COMMENT ON COLUMN public.order_activities.activity_type IS 'Type of activity: order_created, status_changed, assigned, document_uploaded, etc.';
COMMENT ON COLUMN public.order_activities.metadata IS 'Activity-specific data (e.g., old/new status values, document info)';
COMMENT ON COLUMN public.order_activities.is_system IS 'True if activity was auto-generated by the system';
COMMENT ON FUNCTION log_order_activity IS 'Helper function to log order activities from application code';
