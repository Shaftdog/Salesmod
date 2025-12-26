-- =============================================
-- Order Status Migration - APPLIED VIA SCRIPT
-- =============================================
-- This migration was applied via run-status-migration.js on 2025-12-12
-- The script version was used because:
-- 1. Needed to disable trigger_auto_set_order_status during migration
-- 2. The trigger was preventing status updates
-- 3. Required careful transaction management
--
-- Migration Details:
-- - Migrated 1,357 orders from 'completed' to 'DELIVERED'
-- - Updated constraint to allow production stage values
-- - Updated auto_set_order_status() function
-- - Updated default value to 'INTAKE'
--
-- This file is for reference only and should NOT be re-run.
-- =============================================

-- Verification query (for reference):
SELECT status, COUNT(*) as count
FROM public.orders
GROUP BY status
ORDER BY count DESC;

-- Expected results:
-- DELIVERED: ~986+ orders
-- INTAKE: ~4 orders
-- INSPECTED: ~4 orders
-- SCHEDULING: ~4 orders
-- SCHEDULED: ~1 order
-- cancelled: ~1 order
