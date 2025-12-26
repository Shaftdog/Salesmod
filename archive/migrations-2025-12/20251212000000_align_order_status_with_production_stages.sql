-- =============================================
-- Align Order Status with Production Stages
-- Migration: 20251212000000_align_order_status_with_production_stages.sql
-- Purpose: Update order status values to match the 10 production Kanban stages
-- =============================================

-- Production Stages:
-- INTAKE → SCHEDULING → SCHEDULED → INSPECTED → FINALIZATION →
-- READY_FOR_DELIVERY → DELIVERED → CORRECTION → REVISION → WORKFILE

-- =============================================
-- 1. Drop existing constraint on orders.status
-- =============================================
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

-- =============================================
-- 2. Migrate existing order statuses
-- =============================================
-- Map old values to new production stages (MUST happen before adding new constraint)
UPDATE public.orders SET status = 'INTAKE' WHERE status = 'pending';
UPDATE public.orders SET status = 'INTAKE' WHERE status = 'new';
UPDATE public.orders SET status = 'SCHEDULING' WHERE status = 'assigned';
UPDATE public.orders SET status = 'SCHEDULED' WHERE status = 'scheduled';
UPDATE public.orders SET status = 'INSPECTED' WHERE status = 'in_progress';
UPDATE public.orders SET status = 'DELIVERED' WHERE status = 'completed';
-- cancelled stays as cancelled

-- =============================================
-- 3. Add new constraint with production stages
-- =============================================
-- Map old statuses to new:
-- pending → INTAKE
-- assigned → SCHEDULING
-- in_progress → INSPECTED (or keep flexible)
-- completed → DELIVERED
-- cancelled → stays as cancelled

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    -- Production workflow stages
    'INTAKE',
    'SCHEDULING',
    'SCHEDULED',
    'INSPECTED',
    'FINALIZATION',
    'READY_FOR_DELIVERY',
    'DELIVERED',
    'CORRECTION',
    'REVISION',
    'WORKFILE',
    -- Legacy/special statuses
    'cancelled',
    'on_hold'
  )) NOT VALID;

-- Validate the constraint now that data is migrated
ALTER TABLE public.orders VALIDATE CONSTRAINT orders_status_check;

-- =============================================
-- 4. Update default value
-- =============================================
ALTER TABLE public.orders
  ALTER COLUMN status SET DEFAULT 'INTAKE';

-- =============================================
-- 5. Update the auto-status trigger to use new values
-- =============================================
CREATE OR REPLACE FUNCTION auto_set_order_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If completed_date is set, auto-set status to DELIVERED
  IF NEW.completed_date IS NOT NULL AND OLD.completed_date IS NULL THEN
    NEW.status := 'DELIVERED';
    RAISE NOTICE 'Auto-set status to DELIVERED for order % (completed_date: %)', NEW.order_number, NEW.completed_date;
  END IF;

  -- If completed_date is cleared, revert status
  IF NEW.completed_date IS NULL AND OLD.completed_date IS NOT NULL THEN
    IF NEW.status = 'DELIVERED' THEN
      -- Revert to FINALIZATION if it was auto-set
      NEW.status := 'FINALIZATION';
      RAISE NOTICE 'Reset status from DELIVERED to FINALIZATION for order % (completed_date cleared)', NEW.order_number;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 6. Add index for the new status values
-- =============================================
DROP INDEX IF EXISTS idx_orders_status;
CREATE INDEX idx_orders_status ON public.orders(status);

-- =============================================
-- 7. Add comment documenting the status workflow
-- =============================================
COMMENT ON COLUMN public.orders.status IS
'Order status aligned with production Kanban stages:
INTAKE - New order, initial review
SCHEDULING - Contacting for inspection appointment
SCHEDULED - Inspection appointment confirmed
INSPECTED - Inspection completed, processing data
FINALIZATION - Writing/reviewing appraisal report
READY_FOR_DELIVERY - QC complete, ready to send
DELIVERED - Sent to client
CORRECTION - Client requested corrections
REVISION - Client requested revisions
WORKFILE - Archived, complete
cancelled - Order cancelled
on_hold - Order paused';

-- =============================================
-- 8. Verify the migration
-- =============================================
SELECT status, COUNT(*) as count
FROM public.orders
GROUP BY status
ORDER BY count DESC;

-- =============================================
-- Migration Complete
-- =============================================
