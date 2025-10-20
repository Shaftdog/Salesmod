-- =============================================
-- Add Unique Constraints for Order Deduplication
-- Ensures idempotent imports by (org_id, source, external_id)
-- =============================================

-- =============================================
-- 0. Add org_id column to orders if it doesn't exist
-- =============================================

-- Add org_id column to orders table (derived from created_by for tenant isolation)
-- This allows multi-tenant isolation at the org level rather than user level
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS org_id UUID;

-- Backfill org_id from created_by for existing orders
UPDATE public.orders SET org_id = created_by WHERE org_id IS NULL;

-- Make org_id NOT NULL after backfill
ALTER TABLE public.orders ALTER COLUMN org_id SET NOT NULL;

-- Add index on org_id for query performance
CREATE INDEX IF NOT EXISTS idx_orders_org_id ON public.orders(org_id);

-- =============================================
-- 1. Preflight: Check for existing duplicates
-- =============================================

-- This query identifies any existing duplicates that must be resolved
-- before adding the unique constraint. Run this first!
-- 
-- WITH duplicates AS (
--   SELECT org_id, COALESCE(source, 'unknown') AS source, external_id, COUNT(*) AS count
--   FROM orders
--   WHERE external_id IS NOT NULL
--   GROUP BY 1, 2, 3
--   HAVING COUNT(*) > 1
-- )
-- SELECT * FROM duplicates;
--
-- If any rows are returned, resolve duplicates manually before proceeding.

-- =============================================
-- 2. Drop old incorrect constraint if it exists
-- =============================================

-- Drop the incorrect constraint that used (created_by, external_id)
DROP INDEX IF EXISTS uq_orders_org_external_id;
DROP INDEX IF EXISTS uq_orders_created_by_external;

-- =============================================
-- 2. Add correct unique constraint with (org_id, source, external_id)
-- =============================================

-- This constraint ensures orders can be re-imported idempotently
-- Different sources (Asana, HubSpot) may reuse the same external_id
-- so we must include source in the constraint
--
-- Uses COALESCE to handle NULL source values
-- Partial index (WHERE external_id IS NOT NULL) for performance
-- Note: CONCURRENTLY removed because migrations run in transaction blocks
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_org_source_external
  ON public.orders(org_id, COALESCE(source, 'unknown'), external_id)
  WHERE external_id IS NOT NULL;

-- =============================================
-- 3. Ensure order_number uniqueness
-- =============================================

-- Ensure fast lookups by order_number for duplicate detection
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_order_number 
  ON public.orders(order_number);

-- =============================================
-- 4. Documentation
-- =============================================

COMMENT ON INDEX uq_orders_org_source_external IS 
  'Ensures idempotent imports: one order per (org_id, source, external_id). Different sources can reuse external_ids.';

COMMENT ON INDEX uq_orders_order_number IS 
  'Enforces unique order numbers across the system';

