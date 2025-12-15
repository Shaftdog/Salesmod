-- =====================================================
-- Field Services Phase 5: Customer Portal & Communication
-- =====================================================

-- Customer portal access
CREATE TABLE IF NOT EXISTS public.customer_portal_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,

  access_token TEXT UNIQUE NOT NULL,
  access_code TEXT, -- 6-digit PIN for verification

  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,

  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,

  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Notifications log
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

  notification_type TEXT NOT NULL, -- sms, email, push
  template_name TEXT,

  recipient_type TEXT NOT NULL, -- customer, resource, admin
  recipient_id UUID,
  recipient_email TEXT,
  recipient_phone TEXT,

  subject TEXT,
  message TEXT NOT NULL,

  related_entity_type TEXT, -- booking, order, etc.
  related_entity_id UUID,

  status TEXT DEFAULT 'pending', -- pending, sent, delivered, failed
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  provider TEXT, -- twilio, sendgrid, etc.
  provider_message_id TEXT,
  provider_response JSONB,

  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Digital signatures
CREATE TABLE IF NOT EXISTS public.digital_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,

  signer_name TEXT NOT NULL,
  signer_email TEXT,
  signer_role TEXT, -- customer, appraiser, witness

  signature_data TEXT NOT NULL, -- Base64 encoded image
  signature_method TEXT DEFAULT 'drawn', -- drawn, typed, uploaded

  signed_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB,

  document_type TEXT, -- completion_form, consent, disclosure
  document_url TEXT,

  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id),

  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Photo uploads from field
CREATE TABLE IF NOT EXISTS public.field_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.profiles(id),

  photo_type TEXT NOT NULL, -- exterior, interior, damage, amenity, comparable
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,

  caption TEXT,
  photo_order INTEGER,

  location_coordinates JSONB, -- {lat, lng}
  taken_at TIMESTAMPTZ,

  file_size_bytes INTEGER,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,

  is_public BOOLEAN DEFAULT false,

  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Customer feedback/surveys
CREATE TABLE IF NOT EXISTS public.customer_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

  customer_name TEXT,
  customer_email TEXT,

  rating INTEGER CHECK (rating >= 1 AND rating <= 5),

  -- Specific ratings
  punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  overall_experience_rating INTEGER CHECK (overall_experience_rating >= 1 AND overall_experience_rating <= 5),

  comments TEXT,

  would_recommend BOOLEAN,
  allow_public_testimonial BOOLEAN DEFAULT false,

  submitted_at TIMESTAMPTZ DEFAULT now(),

  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_customer_portal_booking
  ON public.customer_portal_access(booking_id);

CREATE INDEX IF NOT EXISTS idx_customer_portal_token
  ON public.customer_portal_access(access_token) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_notifications_status_created
  ON public.notifications(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_entity
  ON public.notifications(related_entity_type, related_entity_id);

CREATE INDEX IF NOT EXISTS idx_digital_signatures_booking
  ON public.digital_signatures(booking_id);

CREATE INDEX IF NOT EXISTS idx_field_photos_booking
  ON public.field_photos(booking_id, photo_order);

CREATE INDEX IF NOT EXISTS idx_customer_feedback_booking
  ON public.customer_feedback(booking_id);

CREATE INDEX IF NOT EXISTS idx_customer_feedback_rating
  ON public.customer_feedback(rating, submitted_at DESC);

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE public.customer_portal_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_feedback ENABLE ROW LEVEL SECURITY;

-- Portal access policies (allow access via token)
CREATE POLICY "Portal access by token"
  ON public.customer_portal_access FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Notifications policies
CREATE POLICY "Users can view notifications in their org"
  ON public.notifications FOR SELECT
  USING (auth.uid() = org_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Signatures policies
CREATE POLICY "Users can view signatures in their org"
  ON public.digital_signatures FOR SELECT
  USING (booking_id IN (SELECT id FROM public.bookings WHERE org_id = auth.uid()));

-- Photos policies
CREATE POLICY "Users can view photos for their org"
  ON public.field_photos FOR SELECT
  USING (booking_id IN (SELECT id FROM public.bookings WHERE org_id = auth.uid()));

CREATE POLICY "Users can upload photos"
  ON public.field_photos FOR INSERT
  WITH CHECK (uploaded_by = auth.uid()::uuid);

-- Feedback policies
CREATE POLICY "Anyone can submit feedback"
  ON public.customer_feedback FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view feedback in their org"
  ON public.customer_feedback FOR SELECT
  USING (auth.uid() = org_id);

-- =====================================================
-- Functions
-- =====================================================

-- Generate portal access token
CREATE OR REPLACE FUNCTION generate_portal_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Generate 6-digit access code
CREATE OR REPLACE FUNCTION generate_access_code()
RETURNS TEXT AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Send notification (placeholder - integrate with actual service)
CREATE OR REPLACE FUNCTION send_notification(
  p_type TEXT,
  p_recipient_email TEXT,
  p_recipient_phone TEXT,
  p_subject TEXT,
  p_message TEXT,
  p_entity_type TEXT,
  p_entity_id UUID
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    org_id,
    notification_type,
    recipient_type,
    recipient_email,
    recipient_phone,
    subject,
    message,
    related_entity_type,
    related_entity_id,
    status
  ) VALUES (
    auth.uid(),
    p_type,
    'customer',
    p_recipient_email,
    p_recipient_phone,
    p_subject,
    p_message,
    p_entity_type,
    p_entity_id,
    'pending'
  ) RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
