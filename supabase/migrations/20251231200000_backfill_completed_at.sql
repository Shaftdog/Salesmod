-- Backfill completed_at for existing DELIVERED production cards
-- For cards that are already DELIVERED but have no completed_at, we set it to:
-- 1. The updated_at timestamp if available (most accurate approximation)
-- 2. Fallback to created_at + 7 days (reasonable estimate for production time)

UPDATE production_cards
SET completed_at = COALESCE(
  updated_at,
  created_at + INTERVAL '7 days'
)
WHERE current_stage = 'DELIVERED'
  AND completed_at IS NULL;

-- Add a comment explaining the backfill
COMMENT ON COLUMN production_cards.completed_at IS 'Timestamp when the production card was moved to DELIVERED stage. For cards delivered before 2025-12-31, this was backfilled from updated_at or estimated.';
