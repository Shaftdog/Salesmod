-- Add lowercase on_hold to orders status CHECK constraint
-- Migration: 20251231000000_add_lowercase_on_hold_status.sql
-- Purpose: Allow both ON_HOLD and on_hold for consistency with app types

-- Drop existing constraint
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new constraint including lowercase on_hold
ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    -- Original order statuses (lowercase)
    'pending', 'assigned', 'in_progress', 'completed', 'cancelled',
    -- Production card stages that sync via trigger (uppercase)
    'INTAKE', 'SCHEDULING', 'SCHEDULED', 'INSPECTED',
    'FINALIZATION', 'READY_FOR_DELIVERY', 'DELIVERED',
    'CORRECTION', 'REVISION', 'WORKFILE',
    'ON_HOLD', 'CANCELLED',
    -- Lowercase variants for app compatibility
    'on_hold'
  ));

COMMENT ON CONSTRAINT orders_status_check ON orders IS
  'Order status values. Includes production card stages and lowercase variants.';
