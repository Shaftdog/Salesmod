-- =====================================================
-- Field Services Phase 6: Reporting & Analytics
-- =====================================================

-- Analytics snapshots (pre-calculated for performance)
CREATE TABLE IF NOT EXISTS public.analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  snapshot_type TEXT NOT NULL, -- daily, weekly, monthly, quarterly, yearly
  snapshot_date DATE NOT NULL,

  -- Resource metrics
  total_resources INTEGER,
  active_resources INTEGER,
  billable_hours DECIMAL(10, 2),
  non_billable_hours DECIMAL(10, 2),

  -- Booking metrics
  total_bookings INTEGER,
  completed_bookings INTEGER,
  cancelled_bookings INTEGER,
  completion_rate DECIMAL(5, 2),

  -- Performance metrics
  average_completion_time_minutes INTEGER,
  on_time_completion_rate DECIMAL(5, 2),
  customer_satisfaction_score DECIMAL(3, 2),

  -- Financial metrics
  total_revenue DECIMAL(12, 2),
  total_costs DECIMAL(12, 2),
  total_mileage_reimbursement DECIMAL(10, 2),

  -- Efficiency metrics
  total_miles_driven DECIMAL(10, 2),
  average_miles_per_booking DECIMAL(8, 2),
  utilization_rate DECIMAL(5, 2), -- % of available hours used

  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Custom reports
CREATE TABLE IF NOT EXISTS public.custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),

  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL, -- table, chart, dashboard
  category TEXT, -- performance, financial, operational

  -- Report configuration
  data_source TEXT NOT NULL, -- bookings, time_entries, mileage_logs, etc.
  filters JSONB,
  grouping JSONB,
  aggregations JSONB,
  sorting JSONB,

  -- Visualization
  chart_type TEXT, -- bar, line, pie, area, scatter
  chart_config JSONB,

  is_favorite BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,

  last_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Report subscriptions for scheduled delivery
CREATE TABLE IF NOT EXISTS public.report_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.custom_reports(id) ON DELETE CASCADE,

  subscriber_id UUID NOT NULL REFERENCES public.profiles(id),
  delivery_schedule TEXT NOT NULL, -- daily, weekly, monthly
  delivery_method TEXT NOT NULL, -- email, slack, webhook

  delivery_time TIME,
  delivery_day_of_week INTEGER, -- 0-6 (Sunday-Saturday)
  delivery_day_of_month INTEGER, -- 1-31

  is_active BOOLEAN DEFAULT true,

  last_delivered_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Materialized Views for Performance
-- =====================================================

-- Resource utilization summary
CREATE MATERIALIZED VIEW IF NOT EXISTS resource_utilization_summary AS
SELECT
  r.id AS resource_id,
  r.org_id,
  p.name AS resource_name,
  COUNT(DISTINCT b.id) AS total_bookings,
  COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) AS completed_bookings,
  COALESCE(SUM(t.duration_minutes), 0) / 60.0 AS total_hours,
  COALESCE(SUM(CASE WHEN t.is_billable THEN t.duration_minutes ELSE 0 END), 0) / 60.0 AS billable_hours,
  COALESCE(SUM(m.distance_miles), 0) AS total_miles,
  AVG(cf.rating) AS avg_customer_rating
FROM public.bookable_resources r
JOIN public.profiles p ON r.id = p.id
LEFT JOIN public.bookings b ON r.id = b.resource_id
LEFT JOIN public.time_entries t ON r.id = t.resource_id
LEFT JOIN public.mileage_logs m ON r.id = m.resource_id
LEFT JOIN public.customer_feedback cf ON b.id = cf.booking_id
GROUP BY r.id, r.org_id, p.name;

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_resource_utilization()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW resource_utilization_summary;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_org_date
  ON public.analytics_snapshots(org_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_custom_reports_org_created
  ON public.custom_reports(org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_report_subscriptions_active
  ON public.report_subscriptions(is_active, delivery_schedule);

CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_snapshot_unique
  ON public.analytics_snapshots(org_id, snapshot_type, snapshot_date);

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analytics in their org"
  ON public.analytics_snapshots FOR SELECT
  USING (org_id IN (SELECT id FROM public.organizations WHERE id = auth.jwt()->>'org_id'));

CREATE POLICY "Users can view reports in their org"
  ON public.custom_reports FOR SELECT
  USING (org_id IN (SELECT id FROM public.organizations WHERE id = auth.jwt()->>'org_id') OR is_public = true);

CREATE POLICY "Users can manage their own reports"
  ON public.custom_reports FOR ALL
  USING (created_by = auth.uid()::uuid);

CREATE POLICY "Users can manage their subscriptions"
  ON public.report_subscriptions FOR ALL
  USING (subscriber_id = auth.uid()::uuid);
