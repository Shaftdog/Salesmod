-- =============================================
-- FIELD SERVICES MODULE - PHASE 1
-- Resource & Territory Management
-- =============================================

-- =============================================
-- SKILL TYPES TABLE
-- Catalog of skills/certifications for appraisers
-- =============================================
CREATE TABLE IF NOT EXISTS public.skill_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT CHECK (category IN (
    'certification',      -- FHA, VA, USDA, etc.
    'property_type',      -- Commercial, Multi-family, Land
    'specialization',     -- Historic, Complex, Litigation
    'software',           -- Software proficiencies
    'equipment'          -- Drone, Laser measuring, etc.
  )),
  is_required BOOLEAN DEFAULT false, -- If true, must have this skill for certain order types
  is_active BOOLEAN DEFAULT true,
  metadata JSONB, -- Additional attributes (expiration_required, renewal_period, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sample skill types
INSERT INTO public.skill_types (name, description, category, is_required) VALUES
  ('FHA Certification', 'FHA roster approved appraiser', 'certification', true),
  ('VA Certification', 'VA panel approved appraiser', 'certification', true),
  ('USDA Certification', 'USDA approved appraiser', 'certification', true),
  ('Commercial Certified', 'Certified for commercial appraisals', 'certification', true),
  ('Single Family', 'Single family residential expertise', 'property_type', false),
  ('Condo/Townhouse', 'Condominium and townhouse expertise', 'property_type', false),
  ('Multi-family', '2-4 unit multi-family expertise', 'property_type', false),
  ('Manufactured Home', 'Manufactured/mobile home expertise', 'property_type', false),
  ('Land Valuation', 'Vacant land appraisal expertise', 'property_type', false),
  ('New Construction', 'New construction/spec home expertise', 'specialization', false),
  ('Historic Properties', 'Historic home appraisal expertise', 'specialization', false),
  ('Waterfront', 'Waterfront property expertise', 'specialization', false),
  ('Complex Property', 'Complex/unique property expertise', 'specialization', false),
  ('Litigation Support', 'Expert witness/litigation support', 'specialization', false),
  ('REO/Foreclosure', 'REO and foreclosure expertise', 'specialization', false),
  ('Drone Certified', 'FAA Part 107 drone pilot', 'equipment', false),
  ('Laser Measuring', 'Laser measuring device proficiency', 'equipment', false),
  ('ANSI Measuring', 'ANSI measurement standards certified', 'specialization', false)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- SERVICE TERRITORIES TABLE
-- Geographic coverage areas for appraisers
-- =============================================
CREATE TABLE IF NOT EXISTS public.service_territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- e.g., "Orlando Southwest", "Tampa Metro"
  description TEXT,
  territory_type TEXT DEFAULT 'primary' CHECK (territory_type IN ('primary', 'secondary', 'extended')),

  -- Geographic definition (use one or more)
  zip_codes TEXT[], -- Array of zip codes
  counties TEXT[], -- Array of county names
  cities TEXT[], -- Array of city names
  radius_miles DECIMAL(6,2), -- Radius from center point
  center_lat DECIMAL(10,8), -- Center latitude for radius
  center_lng DECIMAL(11,8), -- Center longitude for radius
  boundary_polygon JSONB, -- GeoJSON polygon for precise boundaries

  -- Travel time and pricing
  base_travel_time_minutes INTEGER DEFAULT 0, -- Base travel time to reach this territory
  mileage_rate DECIMAL(5,2) DEFAULT 0.67, -- IRS mileage rate
  travel_fee DECIMAL(10,2) DEFAULT 0, -- Flat travel fee for this territory

  is_active BOOLEAN DEFAULT true,
  color_hex TEXT DEFAULT '#3b82f6', -- Display color on maps
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for territory lookups
CREATE INDEX IF NOT EXISTS idx_service_territories_org ON public.service_territories(org_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_service_territories_zip ON public.service_territories USING GIN(zip_codes);

-- =============================================
-- BOOKABLE RESOURCES TABLE
-- Extended resource information (appraisers, equipment)
-- =============================================
CREATE TABLE IF NOT EXISTS public.bookable_resources (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Resource classification
  resource_type TEXT DEFAULT 'appraiser' CHECK (resource_type IN (
    'appraiser',         -- Staff or contractor appraiser
    'equipment',         -- Cameras, measuring tools, drones
    'vehicle',          -- Company vehicles
    'facility'          -- Office space for meetings
  )),
  employment_type TEXT CHECK (employment_type IN ('staff', 'contractor', 'vendor')),

  -- Availability & capacity
  is_bookable BOOLEAN DEFAULT true,
  booking_buffer_minutes INTEGER DEFAULT 30, -- Buffer time between appointments
  max_daily_appointments INTEGER DEFAULT 4, -- Max inspections per day
  max_weekly_hours DECIMAL(5,2) DEFAULT 40,

  -- Territory assignments
  primary_territory_id UUID REFERENCES public.service_territories(id) ON DELETE SET NULL,
  service_territory_ids UUID[], -- Array of territory UUIDs they can serve

  -- Rates and compensation
  hourly_rate DECIMAL(10,2),
  overtime_rate DECIMAL(10,2),
  per_inspection_rate DECIMAL(10,2),
  split_percentage DECIMAL(5,2), -- For contractors (e.g., 70% split)

  -- Equipment tracking (for resource_type = 'appraiser')
  assigned_equipment_ids UUID[], -- Equipment assigned to this appraiser

  -- License & certification
  license_number TEXT,
  license_state TEXT,
  license_expiry DATE,
  errors_and_omissions_carrier TEXT,
  errors_and_omissions_expiry DATE,
  errors_and_omissions_amount DECIMAL(12,2),

  -- Contact & emergency
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  preferred_contact_method TEXT DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'sms', 'phone')),

  -- Performance metrics (computed/cached)
  avg_inspection_duration_minutes INTEGER,
  avg_drive_time_minutes INTEGER,
  completion_rate DECIMAL(5,2), -- Percentage of completed inspections
  avg_customer_rating DECIMAL(3,2),
  total_inspections_completed INTEGER DEFAULT 0,

  -- Working hours (default schedule)
  default_working_hours JSONB DEFAULT '{
    "monday": {"enabled": true, "start": "08:00", "end": "17:00"},
    "tuesday": {"enabled": true, "start": "08:00", "end": "17:00"},
    "wednesday": {"enabled": true, "start": "08:00", "end": "17:00"},
    "thursday": {"enabled": true, "start": "08:00", "end": "17:00"},
    "friday": {"enabled": true, "start": "08:00", "end": "17:00"},
    "saturday": {"enabled": false, "start": "09:00", "end": "13:00"},
    "sunday": {"enabled": false, "start": "09:00", "end": "13:00"}
  }',

  -- Time zone
  timezone TEXT DEFAULT 'America/New_York',

  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for resource queries
CREATE INDEX IF NOT EXISTS idx_bookable_resources_type ON public.bookable_resources(resource_type) WHERE is_bookable = true;
CREATE INDEX IF NOT EXISTS idx_bookable_resources_territory ON public.bookable_resources USING GIN(service_territory_ids);

-- =============================================
-- RESOURCE SKILLS TABLE
-- Many-to-many relationship between resources and skills
-- =============================================
CREATE TABLE IF NOT EXISTS public.resource_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES public.bookable_resources(id) ON DELETE CASCADE NOT NULL,
  skill_type_id UUID REFERENCES public.skill_types(id) ON DELETE CASCADE NOT NULL,

  proficiency_level TEXT DEFAULT 'intermediate' CHECK (proficiency_level IN (
    'beginner', 'intermediate', 'advanced', 'expert'
  )),

  -- Certification tracking
  certification_number TEXT,
  certified_date DATE,
  expiry_date DATE,
  issuing_authority TEXT,

  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(resource_id, skill_type_id)
);

-- Indexes for skill-based matching
CREATE INDEX IF NOT EXISTS idx_resource_skills_resource ON public.resource_skills(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_skills_skill ON public.resource_skills(skill_type_id);
CREATE INDEX IF NOT EXISTS idx_resource_skills_expiry ON public.resource_skills(expiry_date) WHERE expiry_date IS NOT NULL;

-- =============================================
-- RESOURCE AVAILABILITY TABLE
-- Working hours, time off, calendar blocks
-- =============================================
CREATE TABLE IF NOT EXISTS public.resource_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES public.bookable_resources(id) ON DELETE CASCADE NOT NULL,

  -- Availability type
  availability_type TEXT NOT NULL CHECK (availability_type IN (
    'working_hours',     -- Regular working hours (overrides default)
    'time_off',         -- Vacation, sick leave, personal day
    'blocked',          -- Calendar blocked (admin, training, etc.)
    'override'          -- One-time schedule override
  )),

  -- Time range
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,

  -- For working_hours type
  is_available BOOLEAN DEFAULT true, -- false = unavailable during this time

  -- Recurrence (for repeating schedules)
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- RRULE format (e.g., "FREQ=WEEKLY;BYDAY=MO,WE,FR")
  recurrence_end_date DATE,

  -- Reason and notes
  reason TEXT,
  notes TEXT,
  is_all_day BOOLEAN DEFAULT false,

  -- Approval workflow
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,

  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CHECK (end_datetime > start_datetime)
);

-- Indexes for availability queries
CREATE INDEX IF NOT EXISTS idx_resource_availability_resource ON public.resource_availability(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_availability_dates ON public.resource_availability(start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_resource_availability_type ON public.resource_availability(availability_type, is_available);

-- =============================================
-- EQUIPMENT CATALOG TABLE
-- Tools and equipment inventory
-- =============================================
CREATE TABLE IF NOT EXISTS public.equipment_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Equipment details
  name TEXT NOT NULL, -- e.g., "Canon EOS R5", "Leica Disto D2"
  equipment_type TEXT NOT NULL CHECK (equipment_type IN (
    'camera',
    'drone',
    'measuring_device',
    'laptop',
    'tablet',
    'vehicle',
    'software_license',
    'other'
  )),

  -- Identification
  serial_number TEXT,
  asset_tag TEXT,
  make TEXT,
  model TEXT,

  -- Financial tracking
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  current_value DECIMAL(10,2),
  depreciation_schedule TEXT,

  -- Status
  status TEXT DEFAULT 'available' CHECK (status IN (
    'available',
    'in_use',
    'maintenance',
    'retired',
    'lost',
    'damaged'
  )),

  -- Location tracking
  assigned_to UUID REFERENCES public.bookable_resources(id) ON DELETE SET NULL,
  assigned_date DATE,
  location TEXT, -- Physical location when not assigned

  -- Maintenance
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  maintenance_interval_days INTEGER,
  maintenance_notes TEXT,

  -- Warranties and insurance
  warranty_expiry DATE,
  insurance_policy TEXT,
  insurance_expiry DATE,

  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for equipment management
CREATE INDEX IF NOT EXISTS idx_equipment_catalog_org ON public.equipment_catalog(org_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_equipment_catalog_type ON public.equipment_catalog(equipment_type, status);
CREATE INDEX IF NOT EXISTS idx_equipment_catalog_assigned ON public.equipment_catalog(assigned_to) WHERE assigned_to IS NOT NULL;

-- =============================================
-- EQUIPMENT ASSIGNMENT HISTORY TABLE
-- Track equipment check-in/check-out
-- =============================================
CREATE TABLE IF NOT EXISTS public.equipment_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES public.equipment_catalog(id) ON DELETE CASCADE NOT NULL,
  resource_id UUID REFERENCES public.bookable_resources(id) ON DELETE CASCADE NOT NULL,

  -- Assignment period
  assigned_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_return_date TIMESTAMPTZ,
  actual_return_date TIMESTAMPTZ,

  -- Condition tracking
  condition_at_checkout TEXT CHECK (condition_at_checkout IN ('excellent', 'good', 'fair', 'poor')),
  condition_at_return TEXT CHECK (condition_at_return IN ('excellent', 'good', 'fair', 'poor')),

  -- Issues
  checkout_notes TEXT,
  return_notes TEXT,
  damage_reported BOOLEAN DEFAULT false,
  damage_description TEXT,
  damage_cost DECIMAL(10,2),

  -- Approval
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  returned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for equipment tracking
CREATE INDEX IF NOT EXISTS idx_equipment_assignments_equipment ON public.equipment_assignments(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_assignments_resource ON public.equipment_assignments(resource_id);
CREATE INDEX IF NOT EXISTS idx_equipment_assignments_active ON public.equipment_assignments(assigned_date, actual_return_date) WHERE actual_return_date IS NULL;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.skill_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookable_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_assignments ENABLE ROW LEVEL SECURITY;

-- Skill Types: Read for all authenticated users
CREATE POLICY "Skill types are viewable by authenticated users" ON public.skill_types
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Skill types are manageable by admins" ON public.skill_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service Territories: Org-scoped
CREATE POLICY "Territories are viewable by org members" ON public.service_territories
  FOR SELECT USING (
    org_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Territories are manageable by org admins" ON public.service_territories
  FOR ALL USING (
    org_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Bookable Resources: Users can see themselves and admins see all
CREATE POLICY "Resources are viewable by self and admins" ON public.bookable_resources
  FOR SELECT USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Resources are manageable by admins" ON public.bookable_resources
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Resource Skills: Same as resources
CREATE POLICY "Resource skills viewable by resource owner and admins" ON public.resource_skills
  FOR SELECT USING (
    resource_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Resource skills manageable by admins" ON public.resource_skills
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Resource Availability: Resource can manage own, admins manage all
CREATE POLICY "Availability viewable by resource and admins" ON public.resource_availability
  FOR SELECT USING (
    resource_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Availability manageable by resource and admins" ON public.resource_availability
  FOR ALL USING (
    resource_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Equipment: Org-scoped
CREATE POLICY "Equipment viewable by org members" ON public.equipment_catalog
  FOR SELECT USING (
    org_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Equipment manageable by org admins" ON public.equipment_catalog
  FOR ALL USING (
    org_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Equipment Assignments: Viewable by assignee and admins
CREATE POLICY "Equipment assignments viewable by assignee and admins" ON public.equipment_assignments
  FOR SELECT USING (
    resource_id = auth.uid() OR
    assigned_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Equipment assignments manageable by admins" ON public.equipment_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_skill_types_updated_at BEFORE UPDATE ON public.skill_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_territories_updated_at BEFORE UPDATE ON public.service_territories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookable_resources_updated_at BEFORE UPDATE ON public.bookable_resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_skills_updated_at BEFORE UPDATE ON public.resource_skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_availability_updated_at BEFORE UPDATE ON public.resource_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_catalog_updated_at BEFORE UPDATE ON public.equipment_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_assignments_updated_at BEFORE UPDATE ON public.equipment_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE public.skill_types IS 'Catalog of skills and certifications for resource matching';
COMMENT ON TABLE public.service_territories IS 'Geographic coverage areas for field service operations';
COMMENT ON TABLE public.bookable_resources IS 'Extended resource information for appraisers, equipment, and facilities';
COMMENT ON TABLE public.resource_skills IS 'Many-to-many relationship between resources and their skills/certifications';
COMMENT ON TABLE public.resource_availability IS 'Working hours, time off, and calendar blocks for resources';
COMMENT ON TABLE public.equipment_catalog IS 'Inventory of equipment and tools';
COMMENT ON TABLE public.equipment_assignments IS 'Check-in/check-out history for equipment';
