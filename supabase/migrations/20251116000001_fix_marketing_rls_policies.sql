-- Fix marketing module RLS policies to enforce org_id isolation
-- CRITICAL SECURITY FIX: Previous policies used USING (true) allowing cross-org access

-- =============================================
-- MARKETING CAMPAIGNS
-- =============================================
DROP POLICY IF EXISTS "Users can view marketing campaigns in their org" ON public.marketing_campaigns;
DROP POLICY IF EXISTS "Users can manage marketing campaigns" ON public.marketing_campaigns;

CREATE POLICY "Users can view their own marketing campaigns"
  ON public.marketing_campaigns FOR SELECT
  TO authenticated
  USING (auth.uid() = org_id);

CREATE POLICY "Users can create their own marketing campaigns"
  ON public.marketing_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can update their own marketing campaigns"
  ON public.marketing_campaigns FOR UPDATE
  TO authenticated
  USING (auth.uid() = org_id)
  WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can delete their own marketing campaigns"
  ON public.marketing_campaigns FOR DELETE
  TO authenticated
  USING (auth.uid() = org_id);

-- =============================================
-- MARKETING CONTENT
-- =============================================
DROP POLICY IF EXISTS "Users can view marketing content" ON public.marketing_content;
DROP POLICY IF EXISTS "Users can manage marketing content" ON public.marketing_content;

CREATE POLICY "Users can view their own marketing content"
  ON public.marketing_content FOR SELECT
  TO authenticated
  USING (auth.uid() = org_id);

CREATE POLICY "Users can create their own marketing content"
  ON public.marketing_content FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can update their own marketing content"
  ON public.marketing_content FOR UPDATE
  TO authenticated
  USING (auth.uid() = org_id)
  WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can delete their own marketing content"
  ON public.marketing_content FOR DELETE
  TO authenticated
  USING (auth.uid() = org_id);

-- =============================================
-- CONTENT SCHEDULE
-- =============================================
DROP POLICY IF EXISTS "Users can view content schedule" ON public.content_schedule;
DROP POLICY IF EXISTS "Users can manage content schedule" ON public.content_schedule;

CREATE POLICY "Users can view their own content schedule"
  ON public.content_schedule FOR SELECT
  TO authenticated
  USING (auth.uid() = org_id);

CREATE POLICY "Users can create their own content schedule"
  ON public.content_schedule FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can update their own content schedule"
  ON public.content_schedule FOR UPDATE
  TO authenticated
  USING (auth.uid() = org_id)
  WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can delete their own content schedule"
  ON public.content_schedule FOR DELETE
  TO authenticated
  USING (auth.uid() = org_id);

-- =============================================
-- LEAD SCORES
-- =============================================
DROP POLICY IF EXISTS "Users can view lead scores" ON public.lead_scores;
DROP POLICY IF EXISTS "Users can manage lead scores" ON public.lead_scores;

CREATE POLICY "Users can view their own lead scores"
  ON public.lead_scores FOR SELECT
  TO authenticated
  USING (auth.uid() = org_id);

CREATE POLICY "Users can create their own lead scores"
  ON public.lead_scores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can update their own lead scores"
  ON public.lead_scores FOR UPDATE
  TO authenticated
  USING (auth.uid() = org_id)
  WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can delete their own lead scores"
  ON public.lead_scores FOR DELETE
  TO authenticated
  USING (auth.uid() = org_id);

-- =============================================
-- MARKETING AUDIENCES
-- =============================================
DROP POLICY IF EXISTS "Users can view marketing audiences" ON public.marketing_audiences;
DROP POLICY IF EXISTS "Users can manage marketing audiences" ON public.marketing_audiences;

CREATE POLICY "Users can view their own marketing audiences"
  ON public.marketing_audiences FOR SELECT
  TO authenticated
  USING (auth.uid() = org_id);

CREATE POLICY "Users can create their own marketing audiences"
  ON public.marketing_audiences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can update their own marketing audiences"
  ON public.marketing_audiences FOR UPDATE
  TO authenticated
  USING (auth.uid() = org_id)
  WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can delete their own marketing audiences"
  ON public.marketing_audiences FOR DELETE
  TO authenticated
  USING (auth.uid() = org_id);

-- =============================================
-- MARKETING NEWSLETTERS
-- =============================================
DROP POLICY IF EXISTS "Users can view newsletters" ON public.marketing_newsletters;
DROP POLICY IF EXISTS "Users can manage newsletters" ON public.marketing_newsletters;

CREATE POLICY "Users can view their own newsletters"
  ON public.marketing_newsletters FOR SELECT
  TO authenticated
  USING (auth.uid() = org_id);

CREATE POLICY "Users can create their own newsletters"
  ON public.marketing_newsletters FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can update their own newsletters"
  ON public.marketing_newsletters FOR UPDATE
  TO authenticated
  USING (auth.uid() = org_id)
  WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can delete their own newsletters"
  ON public.marketing_newsletters FOR DELETE
  TO authenticated
  USING (auth.uid() = org_id);

-- =============================================
-- NEWSLETTER ISSUES
-- =============================================
DROP POLICY IF EXISTS "Users can view newsletter issues" ON public.newsletter_issues;
DROP POLICY IF EXISTS "Users can manage newsletter issues" ON public.newsletter_issues;

CREATE POLICY "Users can view their own newsletter issues"
  ON public.newsletter_issues FOR SELECT
  TO authenticated
  USING (auth.uid() = org_id);

CREATE POLICY "Users can create their own newsletter issues"
  ON public.newsletter_issues FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can update their own newsletter issues"
  ON public.newsletter_issues FOR UPDATE
  TO authenticated
  USING (auth.uid() = org_id)
  WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can delete their own newsletter issues"
  ON public.newsletter_issues FOR DELETE
  TO authenticated
  USING (auth.uid() = org_id);

-- =============================================
-- EMAIL TEMPLATES
-- =============================================
DROP POLICY IF EXISTS "Users can view email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Users can manage email templates" ON public.email_templates;

CREATE POLICY "Users can view their own email templates"
  ON public.email_templates FOR SELECT
  TO authenticated
  USING (auth.uid() = org_id);

CREATE POLICY "Users can create their own email templates"
  ON public.email_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can update their own email templates"
  ON public.email_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = org_id)
  WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can delete their own email templates"
  ON public.email_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = org_id);

-- =============================================
-- EMAIL CAMPAIGNS
-- =============================================
DROP POLICY IF EXISTS "Users can view email campaigns" ON public.email_campaigns;
DROP POLICY IF EXISTS "Users can manage email campaigns" ON public.email_campaigns;

CREATE POLICY "Users can view their own email campaigns"
  ON public.email_campaigns FOR SELECT
  TO authenticated
  USING (auth.uid() = org_id);

CREATE POLICY "Users can create their own email campaigns"
  ON public.email_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can update their own email campaigns"
  ON public.email_campaigns FOR UPDATE
  TO authenticated
  USING (auth.uid() = org_id)
  WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can delete their own email campaigns"
  ON public.email_campaigns FOR DELETE
  TO authenticated
  USING (auth.uid() = org_id);

-- =============================================
-- EMAIL SENDS
-- =============================================
DROP POLICY IF EXISTS "Users can view email sends" ON public.email_sends;
DROP POLICY IF EXISTS "Users can manage email sends" ON public.email_sends;

CREATE POLICY "Users can view their own email sends"
  ON public.email_sends FOR SELECT
  TO authenticated
  USING (auth.uid() = org_id);

CREATE POLICY "Users can create their own email sends"
  ON public.email_sends FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can update their own email sends"
  ON public.email_sends FOR UPDATE
  TO authenticated
  USING (auth.uid() = org_id)
  WITH CHECK (auth.uid() = org_id);

-- =============================================
-- CONTACT PREFERENCES
-- =============================================
DROP POLICY IF EXISTS "Users can view contact preferences" ON public.contact_preferences;
DROP POLICY IF EXISTS "Users can manage contact preferences" ON public.contact_preferences;

CREATE POLICY "Users can view their own contact preferences"
  ON public.contact_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = org_id);

CREATE POLICY "Users can create their own contact preferences"
  ON public.contact_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can update their own contact preferences"
  ON public.contact_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = org_id)
  WITH CHECK (auth.uid() = org_id);

-- =============================================
-- WEBINARS (from 20251116000000_add_webinar_management.sql)
-- =============================================
DROP POLICY IF EXISTS "Users can view webinars from their org" ON public.webinars;
DROP POLICY IF EXISTS "Users can insert webinars for their org" ON public.webinars;
DROP POLICY IF EXISTS "Users can update webinars from their org" ON public.webinars;
DROP POLICY IF EXISTS "Users can delete webinars from their org" ON public.webinars;

CREATE POLICY "Users can view their own webinars"
  ON public.webinars FOR SELECT
  TO authenticated
  USING (auth.uid() = org_id);

CREATE POLICY "Users can create their own webinars"
  ON public.webinars FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can update their own webinars"
  ON public.webinars FOR UPDATE
  TO authenticated
  USING (auth.uid() = org_id)
  WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can delete their own webinars"
  ON public.webinars FOR DELETE
  TO authenticated
  USING (auth.uid() = org_id);

-- =============================================
-- WEBINAR REGISTRATIONS
-- =============================================
DROP POLICY IF EXISTS "Users can view registrations for their org webinars" ON public.webinar_registrations;
DROP POLICY IF EXISTS "Users can insert registrations for their org webinars" ON public.webinar_registrations;
DROP POLICY IF EXISTS "Users can update registrations for their org webinars" ON public.webinar_registrations;
DROP POLICY IF EXISTS "Users can delete registrations for their org webinars" ON public.webinar_registrations;

CREATE POLICY "Users can view their own webinar registrations"
  ON public.webinar_registrations FOR SELECT
  TO authenticated
  USING (auth.uid() = org_id);

CREATE POLICY "Users can create their own webinar registrations"
  ON public.webinar_registrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can update their own webinar registrations"
  ON public.webinar_registrations FOR UPDATE
  TO authenticated
  USING (auth.uid() = org_id)
  WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can delete their own webinar registrations"
  ON public.webinar_registrations FOR DELETE
  TO authenticated
  USING (auth.uid() = org_id);

-- =============================================
-- AUTO-SET ORG_ID TRIGGERS
-- =============================================

-- Marketing Campaigns
CREATE OR REPLACE FUNCTION set_marketing_campaign_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    NEW.org_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_marketing_campaign_org_id ON public.marketing_campaigns;
CREATE TRIGGER trigger_set_marketing_campaign_org_id
  BEFORE INSERT ON public.marketing_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION set_marketing_campaign_org_id();

-- Marketing Content
CREATE OR REPLACE FUNCTION set_marketing_content_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    NEW.org_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_marketing_content_org_id ON public.marketing_content;
CREATE TRIGGER trigger_set_marketing_content_org_id
  BEFORE INSERT ON public.marketing_content
  FOR EACH ROW
  EXECUTE FUNCTION set_marketing_content_org_id();

-- Content Schedule
CREATE OR REPLACE FUNCTION set_content_schedule_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    NEW.org_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_content_schedule_org_id ON public.content_schedule;
CREATE TRIGGER trigger_set_content_schedule_org_id
  BEFORE INSERT ON public.content_schedule
  FOR EACH ROW
  EXECUTE FUNCTION set_content_schedule_org_id();

-- Lead Scores
CREATE OR REPLACE FUNCTION set_lead_score_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    NEW.org_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_lead_score_org_id ON public.lead_scores;
CREATE TRIGGER trigger_set_lead_score_org_id
  BEFORE INSERT ON public.lead_scores
  FOR EACH ROW
  EXECUTE FUNCTION set_lead_score_org_id();

-- Marketing Audiences
CREATE OR REPLACE FUNCTION set_marketing_audience_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    NEW.org_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_marketing_audience_org_id ON public.marketing_audiences;
CREATE TRIGGER trigger_set_marketing_audience_org_id
  BEFORE INSERT ON public.marketing_audiences
  FOR EACH ROW
  EXECUTE FUNCTION set_marketing_audience_org_id();

-- Marketing Newsletters
CREATE OR REPLACE FUNCTION set_newsletter_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    NEW.org_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_newsletter_org_id ON public.marketing_newsletters;
CREATE TRIGGER trigger_set_newsletter_org_id
  BEFORE INSERT ON public.marketing_newsletters
  FOR EACH ROW
  EXECUTE FUNCTION set_newsletter_org_id();

-- Newsletter Issues
CREATE OR REPLACE FUNCTION set_newsletter_issue_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    NEW.org_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_newsletter_issue_org_id ON public.newsletter_issues;
CREATE TRIGGER trigger_set_newsletter_issue_org_id
  BEFORE INSERT ON public.newsletter_issues
  FOR EACH ROW
  EXECUTE FUNCTION set_newsletter_issue_org_id();

-- Email Templates
CREATE OR REPLACE FUNCTION set_email_template_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    NEW.org_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_email_template_org_id ON public.email_templates;
CREATE TRIGGER trigger_set_email_template_org_id
  BEFORE INSERT ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION set_email_template_org_id();

-- Email Campaigns
CREATE OR REPLACE FUNCTION set_email_campaign_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    NEW.org_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_email_campaign_org_id ON public.email_campaigns;
CREATE TRIGGER trigger_set_email_campaign_org_id
  BEFORE INSERT ON public.email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION set_email_campaign_org_id();

-- Email Sends
CREATE OR REPLACE FUNCTION set_email_send_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    NEW.org_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_email_send_org_id ON public.email_sends;
CREATE TRIGGER trigger_set_email_send_org_id
  BEFORE INSERT ON public.email_sends
  FOR EACH ROW
  EXECUTE FUNCTION set_email_send_org_id();

-- Contact Preferences
CREATE OR REPLACE FUNCTION set_contact_preference_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    NEW.org_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_contact_preference_org_id ON public.contact_preferences;
CREATE TRIGGER trigger_set_contact_preference_org_id
  BEFORE INSERT ON public.contact_preferences
  FOR EACH ROW
  EXECUTE FUNCTION set_contact_preference_org_id();

-- Webinars
CREATE OR REPLACE FUNCTION set_webinar_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    NEW.org_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_webinar_org_id ON public.webinars;
CREATE TRIGGER trigger_set_webinar_org_id
  BEFORE INSERT ON public.webinars
  FOR EACH ROW
  EXECUTE FUNCTION set_webinar_org_id();

-- Webinar Registrations
CREATE OR REPLACE FUNCTION set_webinar_registration_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    NEW.org_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_webinar_registration_org_id ON public.webinar_registrations;
CREATE TRIGGER trigger_set_webinar_registration_org_id
  BEFORE INSERT ON public.webinar_registrations
  FOR EACH ROW
  EXECUTE FUNCTION set_webinar_registration_org_id();

COMMENT ON MIGRATION '20251116000001_fix_marketing_rls_policies' IS 'CRITICAL SECURITY FIX: Enforce proper org_id isolation in all marketing module RLS policies';
