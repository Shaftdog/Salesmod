-- =============================================
-- Party Roles System - MVP
-- Shared categorization for Contacts & Clients
-- =============================================

-- =============================================
-- 1. Party Roles Lookup Table (Shared)
-- =============================================

CREATE TABLE IF NOT EXISTS public.party_roles (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'lender', 'investor', 'service_provider', 'other' (for future UI enhancements)
  sort_order INTEGER NOT NULL DEFAULT 999,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for active roles ordered by sort_order
CREATE INDEX IF NOT EXISTS idx_party_roles_active_sort 
  ON public.party_roles(is_active, sort_order) 
  WHERE is_active = true;

-- =============================================
-- 2. Seed Party Roles (Production Data)
-- =============================================

INSERT INTO public.party_roles (code, label, category, sort_order) VALUES
  -- Lenders (1-10)
  ('mortgage_lender', 'Mortgage Lender Contact', 'lender', 1),
  ('loan_officer', 'Loan Officer', 'lender', 2),
  ('qm_lender_contact', 'QM Lender Contact', 'lender', 3),
  ('non_qm_lender_contact', 'Non-QM Lender Contact', 'lender', 4),
  ('private_lender', 'Private Lender', 'lender', 5),
  
  -- Investors (11-20)
  ('investor', 'Investor', 'investor', 11),
  ('accredited_investor', 'Accredited Investor', 'investor', 12),
  ('real_estate_investor', 'Real Estate Investor', 'investor', 13),
  ('short_term_re_investor', 'Short Term RE Investor', 'investor', 14),
  ('long_term_re_investor', 'Long Term RE Investor', 'investor', 15),
  ('registered_investment_advisor', 'Registered Investment Advisor', 'investor', 16),
  ('fund_manager', 'Fund Manager', 'investor', 17),
  ('co_gp', 'Co-GP', 'investor', 18),
  
  -- Real Estate Professionals (21-30)
  ('realtor', 'Real Estate Agent/Realtor', 'service_provider', 21),
  ('real_estate_broker', 'Real Estate Broker', 'service_provider', 22),
  ('real_estate_dealer', 'Real Estate Dealer', 'service_provider', 23),
  ('wholesaler', 'Wholesaler', 'service_provider', 24),
  
  -- Buyers/Sellers/Owners (31-40)
  ('buyer', 'Buyer', 'other', 31),
  ('seller', 'Seller', 'other', 32),
  ('owner', 'Owner', 'other', 33),
  
  -- Construction (41-45)
  ('builder', 'Builder', 'service_provider', 41),
  ('general_contractor', 'General Contractor', 'service_provider', 42),
  
  -- Legal (46-55)
  ('attorney', 'Attorney', 'service_provider', 46),
  ('real_estate_attorney', 'Real Estate Attorney', 'service_provider', 47),
  ('estate_attorney', 'Estate Attorney', 'service_provider', 48),
  ('family_attorney', 'Family Attorney', 'service_provider', 49),
  
  -- Financial Services (56-65)
  ('accountant', 'Accountant', 'service_provider', 56),
  ('ira_custodian_contact', 'IRA Custodian Contact', 'service_provider', 57),
  
  -- AMC (66-70)
  ('amc_contact', 'AMC Contact', 'service_provider', 66),
  ('amc_billing_contact', 'AMC Billing Contact', 'service_provider', 67),
  
  -- GSE & Other (71-80)
  ('gse', 'GSE', 'other', 71),
  ('vendor', 'Vendor', 'service_provider', 72),
  ('personal', 'Personal', 'other', 73),
  ('staff', 'Staff', 'other', 74),
  
  -- Junk/Unknown (900+)
  ('unknown', 'Unknown', 'other', 900),
  ('delete_flag', 'Delete Flag', 'other', 998),
  ('unk_enrich', 'Unknown - Needs Enrichment', 'other', 999),
  ('unk_no_name', 'Unknown - No Name', 'other', 1000)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 3. Add Role to Contacts
-- =============================================

ALTER TABLE public.contacts 
  ADD COLUMN IF NOT EXISTS primary_role_code TEXT 
    REFERENCES public.party_roles(code);

CREATE INDEX IF NOT EXISTS idx_contacts_primary_role 
  ON public.contacts(primary_role_code);

-- =============================================
-- 4. Add Role to Clients
-- =============================================

ALTER TABLE public.clients 
  ADD COLUMN IF NOT EXISTS primary_role_code TEXT 
    REFERENCES public.party_roles(code);

CREATE INDEX IF NOT EXISTS idx_clients_primary_role 
  ON public.clients(primary_role_code);

-- =============================================
-- 5. RLS Policies
-- =============================================

-- Party roles are public lookup data
ALTER TABLE public.party_roles ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists and recreate
DROP POLICY IF EXISTS "Anyone can view party roles" ON public.party_roles;
CREATE POLICY "Anyone can view party roles"
  ON public.party_roles FOR SELECT
  TO authenticated
  USING (true);

-- =============================================
-- 6. Comments for Documentation
-- =============================================

COMMENT ON TABLE public.party_roles IS 
  'Shared lookup table for business role categorization (applies to both contacts and clients)';

COMMENT ON COLUMN public.contacts.primary_role_code IS 
  'Primary business role/category (e.g., mortgage_lender, investor, buyer)';

COMMENT ON COLUMN public.clients.primary_role_code IS 
  'Primary business role/category';

