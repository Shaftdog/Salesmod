-- Add 'scheduled' state to kanban_cards for future-dated tasks
-- Scheduled cards auto-promote to 'suggested' when due_at <= now

-- Drop existing state check constraint
ALTER TABLE public.kanban_cards
  DROP CONSTRAINT IF EXISTS kanban_cards_state_check;

-- Add updated constraint with 'scheduled' state
ALTER TABLE public.kanban_cards
  ADD CONSTRAINT kanban_cards_state_check
  CHECK (state IN ('scheduled', 'suggested', 'in_review', 'approved', 'executing', 'done', 'blocked', 'rejected'));

-- Add index for efficient due_at queries on scheduled cards
CREATE INDEX IF NOT EXISTS idx_kanban_cards_scheduled_due
  ON public.kanban_cards(tenant_id, due_at)
  WHERE state = 'scheduled' AND due_at IS NOT NULL;

-- Add comment explaining the due_at column usage
COMMENT ON COLUMN public.kanban_cards.due_at IS
  'When the card becomes due. For scheduled cards, this is when they auto-promote to suggested.';
