-- =============================================
-- Address Validation Enhancement
-- Adds verification metadata columns and validation logging
-- =============================================

-- =============================================
-- 1. Add Validation Columns to Properties
-- =============================================

ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified'
    CHECK (verification_status IN ('verified', 'partial', 'failed', 'unverified')),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_source TEXT
    CHECK (verification_source IN ('google', 'usps', 'manual', NULL)),
  ADD COLUMN IF NOT EXISTS zip4 TEXT,
  ADD COLUMN IF NOT EXISTS county TEXT,
  ADD COLUMN IF NOT EXISTS dpv_code TEXT, -- USPS Delivery Point Validation code
  ADD COLUMN IF NOT EXISTS confidence NUMERIC(3,2); -- 0.00 - 1.00

-- Index for filtering by verification status
CREATE INDEX IF NOT EXISTS idx_properties_verification_status 
  ON public.properties(verification_status);

-- Index for finding verified properties
CREATE INDEX IF NOT EXISTS idx_properties_verified 
  ON public.properties(org_id, verification_status) 
  WHERE verification_status = 'verified';

-- =============================================
-- 2. Validation Logs Table (for telemetry)
-- =============================================

CREATE TABLE IF NOT EXISTS public.validation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  address_input TEXT NOT NULL,
  cache_key TEXT NOT NULL,
  is_valid BOOLEAN NOT NULL,
  confidence NUMERIC(3,2),
  was_standardized BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for org-based queries
CREATE INDEX IF NOT EXISTS idx_validation_logs_org 
  ON public.validation_logs(org_id, created_at DESC);

-- Index for monthly stats (using created_at instead of date_trunc for compatibility)
CREATE INDEX IF NOT EXISTS idx_validation_logs_month 
  ON public.validation_logs(org_id, created_at);

-- =============================================
-- 3. RLS for Validation Logs
-- =============================================

ALTER TABLE public.validation_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their org's validation logs
CREATE POLICY "Users can view validation logs for their org"
  ON public.validation_logs FOR SELECT
  TO authenticated
  USING (org_id = auth.uid());

-- Users can insert validation logs for their org
CREATE POLICY "Users can insert validation logs for their org"
  ON public.validation_logs FOR INSERT
  TO authenticated
  WITH CHECK (org_id = auth.uid());

-- =============================================
-- 4. Helper Functions
-- =============================================

-- Get monthly validation stats for an org
CREATE OR REPLACE FUNCTION public.get_validation_stats(
  _org_id UUID,
  _month DATE DEFAULT date_trunc('month', CURRENT_DATE)::DATE
)
RETURNS TABLE (
  month TEXT,
  total_calls BIGINT,
  verified BIGINT,
  partial BIGINT,
  failed BIGINT,
  standardized BIGINT,
  avg_confidence NUMERIC
) LANGUAGE SQL STABLE AS $$
  SELECT 
    to_char(_month, 'YYYY-MM') as month,
    COUNT(*) as total_calls,
    COUNT(*) FILTER (WHERE is_valid AND confidence >= 0.8) as verified,
    COUNT(*) FILTER (WHERE is_valid AND confidence < 0.8 AND confidence >= 0.5) as partial,
    COUNT(*) FILTER (WHERE NOT is_valid OR confidence < 0.5) as failed,
    COUNT(*) FILTER (WHERE was_standardized) as standardized,
    AVG(confidence) as avg_confidence
  FROM public.validation_logs
  WHERE org_id = _org_id
    AND created_at >= _month
    AND created_at < (_month + INTERVAL '1 month')
  GROUP BY _month;
$$;

-- Count unverified properties for an org
CREATE OR REPLACE FUNCTION public.count_unverified_properties(_org_id UUID)
RETURNS INTEGER LANGUAGE SQL STABLE AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.properties
  WHERE org_id = _org_id
    AND (verification_status IS NULL OR verification_status = 'unverified');
$$;

-- =============================================
-- 5. Comments
-- =============================================

COMMENT ON COLUMN public.properties.verification_status IS 'Address verification status: verified (high confidence), partial (user override), failed (invalid), unverified (not checked)';
COMMENT ON COLUMN public.properties.confidence IS 'Validation confidence score: 0.00-1.00 (0.8+ = HIGH, 0.5-0.8 = MEDIUM, <0.5 = LOW)';
COMMENT ON COLUMN public.properties.zip4 IS 'ZIP+4 extension from address validation';
COMMENT ON COLUMN public.properties.county IS 'County name from address validation';
COMMENT ON COLUMN public.properties.dpv_code IS 'USPS Delivery Point Validation code';

COMMENT ON TABLE public.validation_logs IS 'Audit log of address validation API calls for telemetry and cost tracking';
COMMENT ON FUNCTION public.get_validation_stats IS 'Get monthly address validation statistics for an organization';
COMMENT ON FUNCTION public.count_unverified_properties IS 'Count properties without address validation for an organization';
