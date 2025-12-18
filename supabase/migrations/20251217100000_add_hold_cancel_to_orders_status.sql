-- Add all production stages to orders status CHECK constraint
-- Migration: 20251217100000_add_hold_cancel_to_orders_status.sql
-- Purpose: Allow all production card stages on orders (synced via trigger)
--
-- There's a trigger syncing production_cards.current_stage to orders.status
-- This migration updates the orders constraint to include all valid stages

-- ============================================================================
-- 1. Drop existing orders status constraint and add new one
-- ============================================================================

-- Drop existing constraint
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new constraint including ALL production stages
ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    -- Original order statuses (lowercase)
    'pending', 'assigned', 'in_progress', 'completed', 'cancelled',
    -- Production card stages that sync via trigger (uppercase)
    'INTAKE', 'SCHEDULING', 'SCHEDULED', 'INSPECTED',
    'FINALIZATION', 'READY_FOR_DELIVERY', 'DELIVERED',
    'CORRECTION', 'REVISION', 'WORKFILE',
    'ON_HOLD', 'CANCELLED'
  ));

-- ============================================================================
-- 2. Add comment for documentation
-- ============================================================================

COMMENT ON CONSTRAINT orders_status_check ON orders IS
  'Order status values. Includes production card stages synced via trigger.';
