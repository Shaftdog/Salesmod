-- =============================================
-- FIELD SERVICES MODULE - PHASE 2
-- Scheduling, Dispatch & Bookings
-- =============================================

-- =============================================
-- BOOKINGS TABLE
-- Appointments/inspections scheduled with resources
-- =============================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Related entities
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  resource_id UUID REFERENCES public.bookable_resources(id) ON DELETE SET NULL NOT NULL,
  territory_id UUID REFERENCES public.service_territories(id) ON DELETE SET NULL,

  -- Booking details
  booking_number TEXT UNIQUE NOT NULL, -- Auto-generated: BK-YYYYMMDD-XXXX
  booking_type TEXT NOT NULL DEFAULT 'inspection' CHECK (booking_type IN (
    'inspection',          -- Property inspection
    'follow_up',          -- Follow-up visit
    'reinspection',       -- Re-inspection after repairs
    'consultation',       -- Client consultation
    'maintenance',        -- Equipment maintenance (for equipment resources)
    'training',           -- Training session
    'other'
  )),

  -- Scheduling
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  duration_minutes INTEGER, -- Planned duration
  actual_duration_minutes INTEGER, -- Computed from actual start/end

  -- Status workflow
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'requested',     -- Booking requested, pending confirmation
    'scheduled',     -- Confirmed and scheduled
    'confirmed',     -- Confirmed by resource
    'in_progress',   -- Currently happening
    'completed',     -- Successfully completed
    'cancelled',     -- Cancelled
    'no_show',       -- Resource or customer didn't show
    'rescheduled'    -- Has been rescheduled (points to new booking)
  )),

  -- Property/Location details
  property_address TEXT NOT NULL,
  property_city TEXT,
  property_state TEXT,
  property_zip TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  access_instructions TEXT,
  special_instructions TEXT,

  -- Contact information
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,

  -- Travel & routing
  estimated_travel_time_minutes INTEGER,
  actual_travel_time_minutes INTEGER,
  estimated_mileage DECIMAL(6,2),
  actual_mileage DECIMAL(6,2),
  route_data JSONB, -- Route details from Google Maps

  -- Rescheduling
  original_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  rescheduled_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  reschedule_reason TEXT,
  reschedule_count INTEGER DEFAULT 0,

  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  cancellation_reason TEXT,

  -- Completion
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  customer_signature TEXT, -- Base64 or URL
  customer_rating INTEGER CHECK (customer_rating BETWEEN 1 AND 5),
  customer_feedback TEXT,

  -- Notifications
  confirmation_sent_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,

  -- Assignment
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  auto_assigned BOOLEAN DEFAULT false,

  -- Metadata
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CHECK (scheduled_end > scheduled_start),
  CHECK (actual_end IS NULL OR actual_start IS NULL OR actual_end > actual_start)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_bookings_org ON public.bookings(org_id);
CREATE INDEX IF NOT EXISTS idx_bookings_order ON public.bookings(order_id);
CREATE INDEX IF NOT EXISTS idx_bookings_resource ON public.bookings(resource_id);
CREATE INDEX IF NOT EXISTS idx_bookings_territory ON public.bookings(territory_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_start ON public.bookings(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_range ON public.bookings(scheduled_start, scheduled_end);
CREATE INDEX IF NOT EXISTS idx_bookings_number ON public.bookings(booking_number);

-- Composite index for resource availability checking
CREATE INDEX IF NOT EXISTS idx_bookings_resource_schedule ON public.bookings(
  resource_id, scheduled_start, scheduled_end
) WHERE status NOT IN ('cancelled', 'rescheduled');

-- =============================================
-- BOOKING CONFLICTS TABLE
-- Track detected scheduling conflicts
-- =============================================
CREATE TABLE IF NOT EXISTS public.booking_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id_1 UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  booking_id_2 UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,

  conflict_type TEXT NOT NULL CHECK (conflict_type IN (
    'time_overlap',        -- Bookings overlap in time
    'travel_time',         -- Not enough travel time between appointments
    'double_booked',       -- Resource booked twice
    'capacity_exceeded',   -- Exceeds max daily appointments
    'territory_mismatch',  -- Outside resource territory
    'skill_missing'        -- Resource lacks required skill
  )),

  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'error')),

  -- Conflict details
  overlap_minutes INTEGER, -- For time_overlap conflicts
  required_travel_minutes INTEGER, -- For travel_time conflicts
  details JSONB,

  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolution_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CHECK (booking_id_1 != booking_id_2)
);

CREATE INDEX IF NOT EXISTS idx_booking_conflicts_booking1 ON public.booking_conflicts(booking_id_1);
CREATE INDEX IF NOT EXISTS idx_booking_conflicts_booking2 ON public.booking_conflicts(booking_id_2);
CREATE INDEX IF NOT EXISTS idx_booking_conflicts_unresolved ON public.booking_conflicts(resolved) WHERE resolved = false;

-- =============================================
-- TIME ENTRIES TABLE
-- Clock in/out for bookings
-- =============================================
CREATE TABLE IF NOT EXISTS public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  resource_id UUID REFERENCES public.bookable_resources(id) ON DELETE CASCADE NOT NULL,

  entry_type TEXT NOT NULL CHECK (entry_type IN (
    'clock_in',
    'clock_out',
    'break_start',
    'break_end',
    'travel_start',
    'travel_end'
  )),

  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Location tracking
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  location_accuracy_meters INTEGER,

  -- Device information
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  device_id TEXT,
  ip_address INET,

  notes TEXT,
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_time_entries_booking ON public.time_entries(booking_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_resource ON public.time_entries(resource_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_timestamp ON public.time_entries(timestamp);

-- =============================================
-- ROUTE PLANS TABLE
-- Optimized routes for multiple bookings
-- =============================================
CREATE TABLE IF NOT EXISTS public.route_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES public.bookable_resources(id) ON DELETE CASCADE NOT NULL,
  plan_date DATE NOT NULL,

  -- Optimization
  optimization_status TEXT DEFAULT 'pending' CHECK (optimization_status IN (
    'pending', 'optimizing', 'optimized', 'failed'
  )),
  optimized_at TIMESTAMPTZ,

  -- Route details
  total_distance_miles DECIMAL(8,2),
  total_drive_time_minutes INTEGER,
  total_on_site_time_minutes INTEGER,
  total_breaks_minutes INTEGER,

  -- Ordered list of booking IDs
  booking_ids UUID[], -- Ordered array of booking UUIDs
  waypoints JSONB, -- Array of {lat, lng, booking_id}

  -- Google Maps data
  route_polyline TEXT, -- Encoded polyline
  route_data JSONB, -- Full route response from Google

  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (resource_id, plan_date)
);

CREATE INDEX IF NOT EXISTS idx_route_plans_resource_date ON public.route_plans(resource_id, plan_date);
CREATE INDEX IF NOT EXISTS idx_route_plans_status ON public.route_plans(optimization_status);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_plans ENABLE ROW LEVEL SECURITY;

-- Bookings: Org-scoped and resource can see own
CREATE POLICY "Bookings viewable by org and assigned resource" ON public.bookings
  FOR SELECT USING (
    org_id = auth.uid() OR
    resource_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Bookings manageable by org admins" ON public.bookings
  FOR ALL USING (
    org_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Booking Conflicts: Same as bookings
CREATE POLICY "Conflicts viewable by org" ON public.booking_conflicts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE id = booking_id_1 AND (org_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
      ))
    )
  );

CREATE POLICY "Conflicts manageable by org admins" ON public.booking_conflicts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Time Entries: Resource can create own, org can view all
CREATE POLICY "Time entries viewable by resource and org" ON public.time_entries
  FOR SELECT USING (
    resource_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE id = booking_id AND org_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Time entries creatable by resource" ON public.time_entries
  FOR INSERT WITH CHECK (
    resource_id = auth.uid()
  );

-- Route Plans: Resource can view own, org admins manage
CREATE POLICY "Route plans viewable by resource and org" ON public.route_plans
  FOR SELECT USING (
    resource_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Route plans manageable by org admins" ON public.route_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-generate booking numbers
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
  date_str TEXT;
BEGIN
  -- Format: BK-YYYYMMDD-XXXX
  date_str := TO_CHAR(NEW.scheduled_start, 'YYYYMMDD');

  -- Get next number for this date
  SELECT COALESCE(MAX(CAST(SUBSTRING(booking_number FROM 'BK-\d{8}-(\d{4})') AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.bookings
  WHERE booking_number LIKE 'BK-' || date_str || '-%';

  NEW.booking_number := 'BK-' || date_str || '-' || LPAD(next_num::TEXT, 4, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_booking_number_trigger
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  WHEN (NEW.booking_number IS NULL)
  EXECUTE FUNCTION generate_booking_number();

-- Auto-calculate actual duration
CREATE OR REPLACE FUNCTION calculate_actual_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual_start IS NOT NULL AND NEW.actual_end IS NOT NULL THEN
    NEW.actual_duration_minutes := EXTRACT(EPOCH FROM (NEW.actual_end - NEW.actual_start)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_actual_duration_trigger
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_actual_duration();

-- Updated_at trigger for all tables
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_route_plans_updated_at BEFORE UPDATE ON public.route_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- CONFLICT DETECTION FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION detect_booking_conflicts(p_booking_id UUID)
RETURNS TABLE (
  conflict_type TEXT,
  conflicting_booking_id UUID,
  severity TEXT,
  details JSONB
) AS $$
DECLARE
  v_booking RECORD;
  v_conflicting RECORD;
BEGIN
  -- Get the booking details
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Check for time overlaps with same resource
  FOR v_conflicting IN
    SELECT * FROM public.bookings
    WHERE resource_id = v_booking.resource_id
      AND id != v_booking.id
      AND status NOT IN ('cancelled', 'rescheduled')
      AND scheduled_start < v_booking.scheduled_end
      AND scheduled_end > v_booking.scheduled_start
  LOOP
    RETURN QUERY SELECT
      'time_overlap'::TEXT,
      v_conflicting.id,
      'error'::TEXT,
      jsonb_build_object(
        'overlap_minutes',
        EXTRACT(EPOCH FROM (
          LEAST(v_booking.scheduled_end, v_conflicting.scheduled_end) -
          GREATEST(v_booking.scheduled_start, v_conflicting.scheduled_start)
        )) / 60
      );
  END LOOP;

  -- Check for capacity exceeded (max daily appointments)
  DECLARE
    v_daily_count INTEGER;
    v_max_daily INTEGER;
  BEGIN
    SELECT br.max_daily_appointments INTO v_max_daily
    FROM public.bookable_resources br
    WHERE br.id = v_booking.resource_id;

    SELECT COUNT(*) INTO v_daily_count
    FROM public.bookings
    WHERE resource_id = v_booking.resource_id
      AND DATE(scheduled_start) = DATE(v_booking.scheduled_start)
      AND status NOT IN ('cancelled', 'rescheduled')
      AND id != v_booking.id;

    IF v_daily_count >= v_max_daily THEN
      RETURN QUERY SELECT
        'capacity_exceeded'::TEXT,
        v_booking.id,
        'warning'::TEXT,
        jsonb_build_object(
          'current_count', v_daily_count,
          'max_allowed', v_max_daily
        );
    END IF;
  END;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE public.bookings IS 'Scheduled appointments and inspections with field resources';
COMMENT ON TABLE public.booking_conflicts IS 'Detected scheduling conflicts and their resolution';
COMMENT ON TABLE public.time_entries IS 'Clock in/out entries for bookings and time tracking';
COMMENT ON TABLE public.route_plans IS 'Optimized daily routes for field resources';

COMMENT ON COLUMN public.bookings.booking_number IS 'Auto-generated unique booking identifier (BK-YYYYMMDD-XXXX)';
COMMENT ON COLUMN public.bookings.auto_assigned IS 'True if assigned by auto-assignment algorithm';
COMMENT ON COLUMN public.bookings.reschedule_count IS 'Number of times this appointment has been rescheduled';
