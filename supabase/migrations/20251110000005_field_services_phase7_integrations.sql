-- =====================================================
-- Field Services Phase 7: Integration & API Development
-- =====================================================

-- Integration configurations
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  integration_type TEXT NOT NULL, -- calendar, accounting, sms, email, crm
  provider TEXT NOT NULL, -- google_calendar, quickbooks, twilio, sendgrid, etc.

  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,

  -- Authentication
  auth_type TEXT NOT NULL, -- oauth2, api_key, basic
  auth_config JSONB NOT NULL, -- encrypted credentials

  -- Configuration
  settings JSONB,
  sync_enabled BOOLEAN DEFAULT true,
  sync_direction TEXT DEFAULT 'bidirectional', -- import, export, bidirectional
  sync_frequency TEXT DEFAULT 'realtime', -- realtime, hourly, daily

  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT, -- success, failed, partial
  last_sync_error TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Webhook endpoints
CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  webhook_name TEXT NOT NULL,
  target_url TEXT NOT NULL,

  event_types TEXT[] NOT NULL, -- booking.created, booking.completed, etc.

  is_active BOOLEAN DEFAULT true,

  -- Security
  secret_key TEXT, -- For HMAC signature
  auth_header_name TEXT,
  auth_header_value TEXT,

  -- Delivery settings
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,

  -- Stats
  total_deliveries INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,
  last_delivery_at TIMESTAMPTZ,
  last_delivery_status TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Webhook delivery log
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,

  event_type TEXT NOT NULL,
  event_id UUID,

  payload JSONB NOT NULL,

  http_status INTEGER,
  response_body TEXT,
  response_time_ms INTEGER,

  status TEXT NOT NULL, -- pending, success, failed
  error_message TEXT,

  attempts INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ,

  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- API keys for external access
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),

  key_name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE, -- bcrypt hash of actual key
  key_prefix TEXT NOT NULL, -- First 8 chars for identification

  scopes TEXT[] NOT NULL, -- read:bookings, write:bookings, etc.

  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,

  last_used_at TIMESTAMPTZ,
  use_count INTEGER DEFAULT 0,

  rate_limit_per_hour INTEGER DEFAULT 1000,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- API request log (for rate limiting and monitoring)
CREATE TABLE IF NOT EXISTS public.api_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

  request_method TEXT NOT NULL,
  request_path TEXT NOT NULL,
  request_query TEXT,

  response_status INTEGER,
  response_time_ms INTEGER,

  ip_address TEXT,
  user_agent TEXT,

  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_integrations_org_active
  ON public.integrations(org_id, is_active);

CREATE INDEX IF NOT EXISTS idx_webhooks_org_active
  ON public.webhooks(org_id, is_active);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_created
  ON public.webhook_deliveries(webhook_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status_retry
  ON public.webhook_deliveries(status, next_retry_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_api_keys_org_active
  ON public.api_keys(org_id, is_active);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash
  ON public.api_keys(key_hash) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_api_requests_key_created
  ON public.api_requests(api_key_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_requests_created
  ON public.api_requests(created_at DESC);

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view integrations in their org"
  ON public.integrations FOR SELECT
  USING (auth.uid() = org_id);

CREATE POLICY "Admins can manage integrations"
  ON public.integrations FOR ALL
  USING (auth.uid() = org_id);

CREATE POLICY "Users can view webhooks in their org"
  ON public.webhooks FOR SELECT
  USING (auth.uid() = org_id);

CREATE POLICY "Users can view API keys in their org"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = org_id);

CREATE POLICY "Users can view API requests in their org"
  ON public.api_requests FOR SELECT
  USING (auth.uid() = org_id);

-- =====================================================
-- Functions
-- =====================================================

-- Generate API key
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
DECLARE
  prefix TEXT := 'sk_';
  random_part TEXT;
BEGIN
  random_part := encode(gen_random_bytes(32), 'base64');
  random_part := regexp_replace(random_part, '[^a-zA-Z0-9]', '', 'g');
  RETURN prefix || substring(random_part, 1, 48);
END;
$$ LANGUAGE plpgsql;

-- Queue webhook delivery
CREATE OR REPLACE FUNCTION queue_webhook(
  p_event_type TEXT,
  p_event_id UUID,
  p_payload JSONB
) RETURNS void AS $$
DECLARE
  webhook_record RECORD;
BEGIN
  FOR webhook_record IN
    SELECT id FROM public.webhooks
    WHERE is_active = true
    AND p_event_type = ANY(event_types)
    AND org_id = auth.uid()
  LOOP
    INSERT INTO public.webhook_deliveries (
      webhook_id,
      event_type,
      event_id,
      payload,
      status
    ) VALUES (
      webhook_record.id,
      p_event_type,
      p_event_id,
      p_payload,
      'pending'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
