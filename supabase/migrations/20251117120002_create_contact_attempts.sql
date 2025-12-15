-- =============================================
-- CONTACT ATTEMPTS TABLE
-- Track all communication attempts for scheduling
-- =============================================

CREATE TABLE IF NOT EXISTS public.contact_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Related entities
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,

  -- Contact method and details
  attempt_type TEXT NOT NULL CHECK (attempt_type IN (
    'phone_call',
    'sms',
    'email',
    'voicemail'
  )),

  -- Contact information (cached from order/booking)
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,

  -- Attempt details
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attempted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Who made the attempt

  -- Outcome
  outcome TEXT NOT NULL DEFAULT 'no_answer' CHECK (outcome IN (
    'connected',      -- Successfully spoke with contact
    'no_answer',      -- No answer
    'voicemail',      -- Left voicemail
    'wrong_number',   -- Incorrect phone number
    'busy',           -- Line was busy
    'email_sent',     -- Email sent successfully
    'email_bounced',  -- Email bounced
    'sms_sent',       -- SMS sent successfully
    'sms_failed',     -- SMS failed to send
    'scheduled',      -- Successfully scheduled appointment
    'declined',       -- Contact declined/unavailable
    'callback_requested' -- Contact requested callback
  )),

  -- Follow-up information
  callback_requested_at TIMESTAMPTZ, -- When to call back
  notes TEXT, -- Additional notes about the attempt

  -- Duration (for phone calls)
  duration_seconds INTEGER,

  -- Metadata for integrations
  metadata JSONB DEFAULT '{}'::jsonb, -- Integration IDs, recording URLs, etc.

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

-- Order lookups
CREATE INDEX IF NOT EXISTS idx_contact_attempts_order_id
  ON public.contact_attempts(order_id)
  WHERE order_id IS NOT NULL;

-- Booking lookups
CREATE INDEX IF NOT EXISTS idx_contact_attempts_booking_id
  ON public.contact_attempts(booking_id)
  WHERE booking_id IS NOT NULL;

-- Property lookups
CREATE INDEX IF NOT EXISTS idx_contact_attempts_property_id
  ON public.contact_attempts(property_id)
  WHERE property_id IS NOT NULL;

-- Org and date range queries (for reporting)
CREATE INDEX IF NOT EXISTS idx_contact_attempts_org_date
  ON public.contact_attempts(org_id, attempted_at DESC);

-- Attempted by (for user activity tracking)
CREATE INDEX IF NOT EXISTS idx_contact_attempts_attempted_by
  ON public.contact_attempts(attempted_by)
  WHERE attempted_by IS NOT NULL;

-- Callback scheduling
CREATE INDEX IF NOT EXISTS idx_contact_attempts_callback
  ON public.contact_attempts(callback_requested_at)
  WHERE callback_requested_at IS NOT NULL AND outcome = 'callback_requested';

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.contact_attempts ENABLE ROW LEVEL SECURITY;

-- Users can view contact attempts in their org
CREATE POLICY "Users can view contact attempts in their org"
  ON public.contact_attempts FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Users can create contact attempts in their org
CREATE POLICY "Users can create contact attempts in their org"
  ON public.contact_attempts FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Users can update contact attempts in their org
CREATE POLICY "Users can update contact attempts in their org"
  ON public.contact_attempts FOR UPDATE
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Users can delete contact attempts in their org (admin only)
CREATE POLICY "Admins can delete contact attempts"
  ON public.contact_attempts FOR DELETE
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- FUNCTION: Auto-populate contact info from order/booking
-- =====================================================
CREATE OR REPLACE FUNCTION public.populate_contact_attempt_info()
RETURNS TRIGGER AS $$
BEGIN
  -- If order_id is set, populate contact info from order
  IF NEW.order_id IS NOT NULL AND (NEW.contact_name IS NULL OR NEW.contact_phone IS NULL OR NEW.contact_email IS NULL) THEN
    SELECT
      COALESCE(NEW.contact_name, borrower_name),
      COALESCE(NEW.contact_phone, borrower_phone),
      COALESCE(NEW.contact_email, borrower_email)
    INTO
      NEW.contact_name,
      NEW.contact_phone,
      NEW.contact_email
    FROM public.orders
    WHERE id = NEW.order_id;
  END IF;

  -- If booking_id is set, populate contact info from booking
  IF NEW.booking_id IS NOT NULL AND (NEW.contact_name IS NULL OR NEW.contact_phone IS NULL OR NEW.contact_email IS NULL) THEN
    SELECT
      COALESCE(NEW.contact_name, contact_name),
      COALESCE(NEW.contact_phone, contact_phone),
      COALESCE(NEW.contact_email, contact_email)
    INTO
      NEW.contact_name,
      NEW.contact_phone,
      NEW.contact_email
    FROM public.bookings
    WHERE id = NEW.booking_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGER: Auto-populate contact info
-- =============================================
DROP TRIGGER IF EXISTS trigger_populate_contact_attempt_info ON public.contact_attempts;
CREATE TRIGGER trigger_populate_contact_attempt_info
  BEFORE INSERT
  ON public.contact_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_contact_attempt_info();

-- =============================================
-- FUNCTION: Update updated_at timestamp
-- =============================================
CREATE OR REPLACE FUNCTION public.update_contact_attempts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGER: Update updated_at on changes
-- =============================================
DROP TRIGGER IF EXISTS trigger_update_contact_attempts_updated_at ON public.contact_attempts;
CREATE TRIGGER trigger_update_contact_attempts_updated_at
  BEFORE UPDATE
  ON public.contact_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contact_attempts_updated_at();

-- =============================================
-- Comments for documentation
-- =============================================
COMMENT ON TABLE public.contact_attempts IS 'Tracks all communication attempts for scheduling appointments and property access';
COMMENT ON COLUMN public.contact_attempts.attempt_type IS 'Method of communication: phone_call, sms, email, voicemail';
COMMENT ON COLUMN public.contact_attempts.outcome IS 'Result of the contact attempt';
COMMENT ON COLUMN public.contact_attempts.callback_requested_at IS 'When the contact requested to be called back';
COMMENT ON COLUMN public.contact_attempts.duration_seconds IS 'Call duration in seconds (for phone calls)';
COMMENT ON COLUMN public.contact_attempts.metadata IS 'Integration data: call recording URLs, email message IDs, etc.';
