-- =====================================================
-- Field Services Phase 4: Route Optimization & Mobile
-- =====================================================

-- Mileage tracking table
CREATE TABLE IF NOT EXISTS public.mileage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.bookable_resources(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  route_plan_id UUID REFERENCES public.route_plans(id) ON DELETE SET NULL,

  log_date DATE NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,

  start_location TEXT,
  end_location TEXT,
  start_coordinates JSONB, -- {lat, lng}
  end_coordinates JSONB, -- {lat, lng}

  distance_miles DECIMAL(10, 2),
  distance_km DECIMAL(10, 2),

  purpose TEXT, -- business, personal, commute
  is_billable BOOLEAN DEFAULT true,

  -- Vehicle information
  vehicle_id UUID REFERENCES public.equipment_catalog(id) ON DELETE SET NULL,
  odometer_start INTEGER,
  odometer_end INTEGER,

  -- Reimbursement
  rate_per_mile DECIMAL(10, 4), -- IRS standard mileage rate
  reimbursement_amount DECIMAL(10, 2),
  is_reimbursed BOOLEAN DEFAULT false,
  reimbursed_date DATE,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- GPS tracking table for real-time location
CREATE TABLE IF NOT EXISTS public.gps_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.bookable_resources(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,

  timestamp TIMESTAMPTZ DEFAULT now(),
  coordinates JSONB NOT NULL, -- {lat, lng, accuracy}

  speed DECIMAL(10, 2), -- mph or km/h
  heading INTEGER, -- degrees 0-360
  altitude DECIMAL(10, 2), -- meters

  battery_level INTEGER, -- percentage
  is_online BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Route waypoints for optimized routes
CREATE TABLE IF NOT EXISTS public.route_waypoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_plan_id UUID NOT NULL REFERENCES public.route_plans(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,

  sequence_order INTEGER NOT NULL,

  location_name TEXT,
  address TEXT NOT NULL,
  coordinates JSONB, -- {lat, lng}

  arrival_time TIMESTAMPTZ,
  departure_time TIMESTAMPTZ,
  duration_minutes INTEGER,

  distance_from_previous DECIMAL(10, 2), -- miles
  travel_time_minutes INTEGER,

  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Offline sync queue for mobile
CREATE TABLE IF NOT EXISTS public.offline_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.bookable_resources(id) ON DELETE CASCADE,

  entity_type TEXT NOT NULL, -- booking, time_entry, mileage_log, etc.
  entity_id UUID,
  operation TEXT NOT NULL, -- create, update, delete

  data JSONB NOT NULL,

  is_synced BOOLEAN DEFAULT false,
  synced_at TIMESTAMPTZ,
  sync_error TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  device_id TEXT
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_mileage_logs_resource_date
  ON public.mileage_logs(resource_id, log_date DESC);

CREATE INDEX IF NOT EXISTS idx_mileage_logs_booking
  ON public.mileage_logs(booking_id) WHERE booking_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mileage_logs_route_plan
  ON public.mileage_logs(route_plan_id) WHERE route_plan_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gps_tracking_resource_time
  ON public.gps_tracking(resource_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_gps_tracking_booking
  ON public.gps_tracking(booking_id) WHERE booking_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_route_waypoints_route_order
  ON public.route_waypoints(route_plan_id, sequence_order);

CREATE INDEX IF NOT EXISTS idx_offline_sync_queue_resource_synced
  ON public.offline_sync_queue(resource_id, is_synced, created_at);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

ALTER TABLE public.mileage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_waypoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_sync_queue ENABLE ROW LEVEL SECURITY;

-- Mileage logs policies
CREATE POLICY "Users can view mileage logs in their org"
  ON public.mileage_logs FOR SELECT
  USING (org_id IN (SELECT id FROM public.organizations WHERE id = auth.jwt()->>'org_id'));

CREATE POLICY "Users can insert mileage logs in their org"
  ON public.mileage_logs FOR INSERT
  WITH CHECK (org_id IN (SELECT id FROM public.organizations WHERE id = auth.jwt()->>'org_id'));

CREATE POLICY "Users can update mileage logs in their org"
  ON public.mileage_logs FOR UPDATE
  USING (org_id IN (SELECT id FROM public.organizations WHERE id = auth.jwt()->>'org_id'));

CREATE POLICY "Users can delete mileage logs in their org"
  ON public.mileage_logs FOR DELETE
  USING (org_id IN (SELECT id FROM public.organizations WHERE id = auth.jwt()->>'org_id'));

-- GPS tracking policies
CREATE POLICY "Users can view GPS tracking in their org"
  ON public.gps_tracking FOR SELECT
  USING (resource_id IN (SELECT id FROM public.bookable_resources WHERE org_id = auth.jwt()->>'org_id'));

CREATE POLICY "Users can insert GPS tracking"
  ON public.gps_tracking FOR INSERT
  WITH CHECK (resource_id IN (SELECT id FROM public.bookable_resources WHERE org_id = auth.jwt()->>'org_id'));

-- Route waypoints policies
CREATE POLICY "Users can view route waypoints in their org"
  ON public.route_waypoints FOR SELECT
  USING (route_plan_id IN (SELECT id FROM public.route_plans WHERE org_id = auth.jwt()->>'org_id'));

CREATE POLICY "Users can manage route waypoints in their org"
  ON public.route_waypoints FOR ALL
  USING (route_plan_id IN (SELECT id FROM public.route_plans WHERE org_id = auth.jwt()->>'org_id'));

-- Offline sync queue policies
CREATE POLICY "Users can view their own sync queue"
  ON public.offline_sync_queue FOR SELECT
  USING (resource_id = auth.uid()::uuid);

CREATE POLICY "Users can manage their own sync queue"
  ON public.offline_sync_queue FOR ALL
  USING (resource_id = auth.uid()::uuid);

-- =====================================================
-- Triggers
-- =====================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_mileage_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mileage_logs_updated_at
  BEFORE UPDATE ON public.mileage_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_mileage_logs_updated_at();

CREATE TRIGGER route_waypoints_updated_at
  BEFORE UPDATE ON public.route_waypoints
  FOR EACH ROW
  EXECUTE FUNCTION update_mileage_logs_updated_at();

-- Auto-calculate mileage reimbursement
CREATE OR REPLACE FUNCTION calculate_mileage_reimbursement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.distance_miles IS NOT NULL AND NEW.rate_per_mile IS NOT NULL THEN
    NEW.reimbursement_amount = NEW.distance_miles * NEW.rate_per_mile;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mileage_reimbursement_calc
  BEFORE INSERT OR UPDATE ON public.mileage_logs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_mileage_reimbursement();

-- =====================================================
-- Helper Functions
-- =====================================================

-- Calculate distance between two coordinates (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
DECLARE
  radius DOUBLE PRECISION := 3959.0; -- Earth radius in miles
  dlat DOUBLE PRECISION;
  dlon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);

  a := sin(dlat/2) * sin(dlat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dlon/2) * sin(dlon/2);

  c := 2 * atan2(sqrt(a), sqrt(1-a));

  RETURN radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get current IRS standard mileage rate (update annually)
CREATE OR REPLACE FUNCTION get_current_mileage_rate()
RETURNS DECIMAL(10, 4) AS $$
BEGIN
  -- 2024 IRS standard mileage rate
  RETURN 0.67;
END;
$$ LANGUAGE plpgsql;
