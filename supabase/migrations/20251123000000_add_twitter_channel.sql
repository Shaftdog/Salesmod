-- Add twitter/x as a valid channel in content_schedule
-- This enables the social media agent system to schedule Twitter posts

-- Drop and recreate the constraint with twitter included
ALTER TABLE public.content_schedule
DROP CONSTRAINT IF EXISTS content_schedule_channel_check;

ALTER TABLE public.content_schedule
ADD CONSTRAINT content_schedule_channel_check
CHECK (channel IN ('email', 'linkedin', 'twitter', 'substack', 'tiktok', 'instagram', 'facebook', 'pinterest', 'youtube', 'blog', 'newsletter', 'webinar'));
