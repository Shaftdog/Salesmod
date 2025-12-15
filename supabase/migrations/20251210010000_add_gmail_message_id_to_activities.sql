-- Add gmail_message_id to activities table
-- This allows us to link activities to their source email and display full content

ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS gmail_message_id TEXT;

-- Create index for lookups
CREATE INDEX IF NOT EXISTS idx_activities_gmail_message_id
ON public.activities(gmail_message_id)
WHERE gmail_message_id IS NOT NULL;

COMMENT ON COLUMN public.activities.gmail_message_id IS 'Gmail message ID for email activities created from Gmail sync';
