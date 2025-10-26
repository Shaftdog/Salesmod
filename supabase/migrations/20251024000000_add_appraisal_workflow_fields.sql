-- ==============================================
-- APPRAISAL WORKFLOW FIELDS MIGRATION
-- Adds all order configuration fields from Asana
-- These fields impact pricing, routing, and compliance
-- ==============================================
-- Run Date: 2025-10-24
-- Purpose: Move critical workflow fields from props JSONB to dedicated columns
-- ==============================================

-- ==============================================
-- ADD NEW COLUMNS TO ORDERS TABLE
-- ==============================================

ALTER TABLE public.orders 
  -- Core appraisal workflow (drives routing and pricing)
  ADD COLUMN IF NOT EXISTS scope_of_work TEXT CHECK (scope_of_work IN (
    'desktop', 'exterior_only', 'interior', 'inspection_only', 
    'desk_review', 'field_review'
  )),
  
  -- Detailed purpose (30+ values from appraisal standards, keep flexible)
  ADD COLUMN IF NOT EXISTS intended_use TEXT,
  
  -- Supplemental deliverables (can be multiple, affects pricing)
  ADD COLUMN IF NOT EXISTS additional_forms TEXT[],
  
  -- Payment workflow (gates order processing)
  ADD COLUMN IF NOT EXISTS billing_method TEXT CHECK (billing_method IN (
    'online', 'bill', 'cod'
  )),
  
  -- Marketing attribution (ROI tracking and commission)
  ADD COLUMN IF NOT EXISTS sales_campaign TEXT CHECK (sales_campaign IN (
    'client_selection', 'bid_request', 'case_management', 'collections',
    'client_maintenance', 'feedback', 'client_recognition', 'education',
    'networking', 'new_client', 'partnership', 'market_expansion',
    'product_expansion', 'prospecting', 'suspecting', 'update_profile',
    'contact_attempts', 'administration', 'admin_support', 'scheduling',
    'training', 'meeting'
  )),
  
  -- Site characteristics (pricing factors and special considerations)
  ADD COLUMN IF NOT EXISTS site_influence TEXT CHECK (site_influence IN (
    'none', 'water', 'commercial', 'woods', 'golf_course'
  )),
  
  -- Property complexity indicators (affects pricing & workflow)
  ADD COLUMN IF NOT EXISTS is_multiunit BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS multiunit_type TEXT CHECK (multiunit_type IN (
    'adu_apartment_inlaw', 'two_unit', 'three_unit', 'four_unit', 
    'five_plus_commercial'
  )),
  
  -- Construction status (different forms & processes)
  ADD COLUMN IF NOT EXISTS is_new_construction BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS new_construction_type TEXT CHECK (new_construction_type IN (
    'community_builder', 'spec_custom', 'refinance_newly_constructed'
  )),
  
  -- Zoning compliance (required for proper valuation methodology)
  ADD COLUMN IF NOT EXISTS zoning_type TEXT CHECK (zoning_type IN (
    'residential', 'planned_unit_development', 'two_unit', 'three_unit',
    'four_unit', 'mixed_use', 'agricultural', 'commercial'
  )),
  
  -- Report format (which appraisal form to use)
  ADD COLUMN IF NOT EXISTS report_form_type TEXT,
  
  -- Service region/territory (for assignment routing)
  ADD COLUMN IF NOT EXISTS service_region TEXT,
  
  -- Scheduled inspection date (separate from due date)
  ADD COLUMN IF NOT EXISTS inspection_date TIMESTAMPTZ;

-- ==============================================
-- INDEXES FOR QUERY PERFORMANCE
-- ==============================================

-- High-frequency filters for daily operations
CREATE INDEX IF NOT EXISTS idx_orders_scope_of_work 
  ON public.orders(scope_of_work);
  
CREATE INDEX IF NOT EXISTS idx_orders_intended_use 
  ON public.orders(intended_use);
  
CREATE INDEX IF NOT EXISTS idx_orders_billing_method 
  ON public.orders(billing_method);
  
CREATE INDEX IF NOT EXISTS idx_orders_sales_campaign 
  ON public.orders(sales_campaign);

CREATE INDEX IF NOT EXISTS idx_orders_report_form_type 
  ON public.orders(report_form_type);
  
CREATE INDEX IF NOT EXISTS idx_orders_service_region 
  ON public.orders(service_region);

CREATE INDEX IF NOT EXISTS idx_orders_inspection_date 
  ON public.orders(inspection_date) WHERE inspection_date IS NOT NULL;

-- Pricing and complexity filters (partial indexes for efficiency)
CREATE INDEX IF NOT EXISTS idx_orders_site_influence 
  ON public.orders(site_influence) WHERE site_influence != 'none';
  
CREATE INDEX IF NOT EXISTS idx_orders_is_multiunit 
  ON public.orders(is_multiunit) WHERE is_multiunit = true;
  
CREATE INDEX IF NOT EXISTS idx_orders_is_new_construction 
  ON public.orders(is_new_construction) WHERE is_new_construction = true;

-- GIN index for array queries on additional_forms
CREATE INDEX IF NOT EXISTS idx_orders_additional_forms 
  ON public.orders USING gin(additional_forms);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_orders_scope_billing 
  ON public.orders(scope_of_work, billing_method);
  
CREATE INDEX IF NOT EXISTS idx_orders_campaign_created 
  ON public.orders(sales_campaign, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_region_status 
  ON public.orders(service_region, status);

-- ==============================================
-- BUSINESS RULE CONSTRAINTS
-- ==============================================

-- If multiunit is true, must specify type (data quality enforcement)
ALTER TABLE public.orders 
  ADD CONSTRAINT check_multiunit_type 
  CHECK (
    (is_multiunit = false AND multiunit_type IS NULL) OR
    (is_multiunit = true AND multiunit_type IS NOT NULL)
  );

-- If new construction is true, must specify type
ALTER TABLE public.orders 
  ADD CONSTRAINT check_new_construction_type 
  CHECK (
    (is_new_construction = false AND new_construction_type IS NULL) OR
    (is_new_construction = true AND new_construction_type IS NOT NULL)
  );

-- ==============================================
-- COLUMN DOCUMENTATION
-- ==============================================

COMMENT ON COLUMN public.orders.scope_of_work IS 
  'Appraisal inspection depth: desktop, exterior, interior, inspection only, desk review, or field review. Drives workflow routing and pricing. Maps to USPAP scope requirements.';
  
COMMENT ON COLUMN public.orders.intended_use IS 
  'Client stated purpose for appraisal per USPAP requirements: refinance, purchase, foreclosure, FHA, reverse mortgage, estate, etc. Required for compliance, affects form selection and methodology. 30+ standardized values.';
  
COMMENT ON COLUMN public.orders.additional_forms IS 
  'Array of supplemental forms/analyses required beyond base appraisal: 1007 Rent Survey, 216 Operating Statement, REO Addendum, Relocation Addendum, As-Is Value, After Repair Value, etc. Each adds to deliverables checklist and pricing.';
  
COMMENT ON COLUMN public.orders.billing_method IS 
  'How payment will be collected: online (prepaid), bill (invoice), or COD (cash on delivery). CRITICAL BUSINESS RULE: online orders must be fully paid before processing begins. Gates workflow advancement.';
  
COMMENT ON COLUMN public.orders.sales_campaign IS 
  'Marketing/operational source or campaign from which order originated. Used for ROI tracking, commission attribution, lead source analysis, and process improvement. Enables calculation of customer acquisition cost and lifetime value by channel.';
  
COMMENT ON COLUMN public.orders.site_influence IS 
  'External locational factors that may affect property value or require additional analysis: waterfront (premium pricing), commercial adjacency (mixed use considerations), wooded lots (privacy/views), golf course (amenity value), etc. Impacts comp selection and adjustments.';
  
COMMENT ON COLUMN public.orders.is_multiunit IS 
  'Property contains multiple residential units or auxiliary dwelling units (ADU). Affects complexity scoring, pricing multiplier, comp requirements (must use other multiunits), and form selection (1025 for 2-4 units). Requires additional analysis of income approach.';
  
COMMENT ON COLUMN public.orders.multiunit_type IS 
  'Specific multiunit configuration if applicable: ADU/apartment/in-law suite, 2-unit duplex, 3-unit triplex, 4-unit quadplex, or 5+ units (commercial classification). Determines appropriate appraisal form (1004 with addendum vs 1025 vs commercial).';
  
COMMENT ON COLUMN public.orders.is_new_construction IS 
  'Property is newly constructed or under construction. Requires different forms (1004C), hypothetical condition disclosures, builder/developer documentation, comparable new construction sales, and enhanced cost approach analysis.';
  
COMMENT ON COLUMN public.orders.new_construction_type IS 
  'Type of new construction assignment: community builder (production/tract), spec or custom (one-off builds), or refinance of recently completed construction. Each has different data requirements and risk profiles.';
  
COMMENT ON COLUMN public.orders.zoning_type IS 
  'Property zoning classification per local jurisdiction. Required for USPAP compliance and highest-and-best-use analysis. Determines allowable uses, density restrictions, and appropriate comparable selection. Values: residential, PUD, multi-unit, mixed-use, agricultural, commercial.';

COMMENT ON COLUMN public.orders.report_form_type IS 
  'Which Fannie Mae/Freddie Mac/FHA form to use: 1004 (interior SFR), 1073 (condo), 2055 (exterior), 1025 (small income 2-4 units), 216 (operating income), etc. Drives report template, analysis requirements, and pricing.';

COMMENT ON COLUMN public.orders.service_region IS 
  'Geographic service area or territory: ORL-SW-PRIMARY, TAMPA-NE-EXTENDED, etc. Used for appraiser assignment routing, travel time calculation, market area expertise matching, and regional performance tracking.';

COMMENT ON COLUMN public.orders.inspection_date IS 
  'Scheduled date/time for property inspection. Separate from due_date (report delivery deadline). Used for appraiser scheduling, owner coordination, lockbox access timing, and workflow status tracking.';

-- ==============================================
-- APPLICATION LOGIC NOTES
-- ==============================================

COMMENT ON TABLE public.orders IS 
  'Core appraisal orders table with complete workflow fields. Business rules to enforce in application:
  1. billing_method=online requires payment_status=paid before status advances past new
  2. scope_of_work determines required inspection_date (not needed for desktop)
  3. is_multiunit=true should auto-suggest appropriate report_form_type (1025 for 2-4 units)
  4. is_new_construction=true requires special disclosures and 1004C form consideration
  5. intended_use + property_type should validate against report_form_type compatibility
  6. additional_forms array should be validated against allowed form codes
  7. site_influence affects pricing multiplier (especially water = premium)
  8. sales_campaign enables commission/referral fee calculation';

-- ==============================================
-- MIGRATION COMPLETE
-- ==============================================

-- Next steps after running this migration:
-- 1. Update Asana Orders preset to map CSV columns to new fields
-- 2. Add transform functions for value normalization
-- 3. Update UI components to display and filter by new fields
-- 4. Build pricing engine using scope_of_work, site_influence, additional_forms
-- 5. Create assignment routing logic using service_region, scope_of_work, complexity
-- 6. Set up compliance validation rules for intended_use + report_form_type

