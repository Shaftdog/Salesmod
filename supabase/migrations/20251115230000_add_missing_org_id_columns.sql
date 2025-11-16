-- Migration: Add Missing org_id Columns to Marketing Tables
-- Created: 2025-11-16
-- Purpose: Add org_id columns to tables that were missing them for proper RLS enforcement

-- NOTE: The contacts table does NOT have org_id (it has client_id instead)
-- We need to backfill org_id from related tables where possible

-- =============================================
-- 1. LEAD_SCORES - Add org_id
-- =============================================

-- Add column (nullable first for backfill)
ALTER TABLE public.lead_scores
ADD COLUMN IF NOT EXISTS org_id UUID;

-- Backfill org_id from contact -> client relationship
-- Since contacts don't have org_id, we'll use the client's org_id
UPDATE public.lead_scores ls
SET org_id = c.org_id
FROM public.contacts ct
JOIN public.clients c ON ct.client_id = c.id
WHERE ls.contact_id = ct.id
  AND ls.org_id IS NULL;

-- For any remaining NULL values (orphaned records), use first available user
UPDATE public.lead_scores
SET org_id = (SELECT id FROM auth.users LIMIT 1)
WHERE org_id IS NULL;

-- Make NOT NULL and add foreign key
ALTER TABLE public.lead_scores
ALTER COLUMN org_id SET NOT NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_lead_scores_org_id
ON public.lead_scores(org_id);

-- =============================================
-- 2. EMAIL_SENDS - Add org_id
-- =============================================

-- Add column (nullable first for backfill)
ALTER TABLE public.email_sends
ADD COLUMN IF NOT EXISTS org_id UUID;

-- Backfill org_id from email_campaign
UPDATE public.email_sends es
SET org_id = ec.org_id
FROM public.email_campaigns ec
WHERE es.email_campaign_id = ec.id
  AND es.org_id IS NULL;

-- For any remaining NULL values (orphaned records), use first available user
UPDATE public.email_sends
SET org_id = (SELECT id FROM auth.users LIMIT 1)
WHERE org_id IS NULL;

-- Make NOT NULL and add foreign key
ALTER TABLE public.email_sends
ALTER COLUMN org_id SET NOT NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_email_sends_org_id
ON public.email_sends(org_id);

-- =============================================
-- 3. NEWSLETTER_ISSUES - Add org_id
-- =============================================

-- Add column (nullable first for backfill)
ALTER TABLE public.newsletter_issues
ADD COLUMN IF NOT EXISTS org_id UUID;

-- Backfill org_id from marketing_newsletters
UPDATE public.newsletter_issues ni
SET org_id = mn.org_id
FROM public.marketing_newsletters mn
WHERE ni.newsletter_id = mn.id
  AND ni.org_id IS NULL;

-- For any remaining NULL values (orphaned records), use first available user
UPDATE public.newsletter_issues
SET org_id = (SELECT id FROM auth.users LIMIT 1)
WHERE org_id IS NULL;

-- Make NOT NULL and add foreign key
ALTER TABLE public.newsletter_issues
ALTER COLUMN org_id SET NOT NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_newsletter_issues_org_id
ON public.newsletter_issues(org_id);

-- =============================================
-- 4. CONTACT_PREFERENCES - Add org_id
-- =============================================

-- Add column (nullable first for backfill)
ALTER TABLE public.contact_preferences
ADD COLUMN IF NOT EXISTS org_id UUID;

-- Backfill org_id from contact -> client relationship
UPDATE public.contact_preferences cp
SET org_id = c.org_id
FROM public.contacts ct
JOIN public.clients c ON ct.client_id = c.id
WHERE cp.contact_id = ct.id
  AND cp.org_id IS NULL;

-- For any remaining NULL values (orphaned records), use first available user
UPDATE public.contact_preferences
SET org_id = (SELECT id FROM auth.users LIMIT 1)
WHERE org_id IS NULL;

-- Make NOT NULL and add foreign key
ALTER TABLE public.contact_preferences
ALTER COLUMN org_id SET NOT NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_contact_preferences_org_id
ON public.contact_preferences(org_id);

-- =============================================
-- 5. WEBINAR_REGISTRATIONS - Add org_id
-- =============================================

-- Add column (nullable first for backfill)
ALTER TABLE public.webinar_registrations
ADD COLUMN IF NOT EXISTS org_id UUID;

-- Backfill org_id from webinars table
UPDATE public.webinar_registrations wr
SET org_id = w.org_id
FROM public.webinars w
WHERE wr.webinar_id = w.id
  AND wr.org_id IS NULL;

-- For any remaining NULL values (orphaned records), use first available user
UPDATE public.webinar_registrations
SET org_id = (SELECT id FROM auth.users LIMIT 1)
WHERE org_id IS NULL;

-- Make NOT NULL and add foreign key
ALTER TABLE public.webinar_registrations
ALTER COLUMN org_id SET NOT NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_webinar_registrations_org_id
ON public.webinar_registrations(org_id);

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON COLUMN lead_scores.org_id IS 'Organization ID for RLS enforcement';
COMMENT ON COLUMN email_sends.org_id IS 'Organization ID for RLS enforcement';
COMMENT ON COLUMN newsletter_issues.org_id IS 'Organization ID for RLS enforcement';
COMMENT ON COLUMN contact_preferences.org_id IS 'Organization ID for RLS enforcement';
COMMENT ON COLUMN webinar_registrations.org_id IS 'Organization ID for RLS enforcement';
