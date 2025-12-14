-- =============================================
-- Order Contacts System
-- Link contacts to orders with roles for CRM/outreach
-- =============================================

-- =============================================
-- 1. Add Missing Party Roles
-- =============================================

INSERT INTO public.party_roles (code, label, description, category, sort_order) VALUES
  ('borrower', 'Borrower', 'Loan borrower on the order', 'other', 35),
  ('processor', 'Loan Processor', 'Loan processor handling the file', 'lender', 6),
  ('property_contact', 'Property Contact', 'On-site contact for property access', 'other', 36),
  ('listing_agent', 'Listing Agent', 'Seller''s listing agent', 'service_provider', 25),
  ('buying_agent', 'Buying Agent', 'Buyer''s agent', 'service_provider', 26)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 2. Order Contacts Junction Table
-- Links contacts to orders with specific roles
-- =============================================

CREATE TABLE IF NOT EXISTS public.order_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  role_code TEXT NOT NULL REFERENCES public.party_roles(code),
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Only one contact per role per order (e.g., one borrower, one loan officer)
  UNIQUE(order_id, role_code)
);

-- =============================================
-- 3. Add Contact Info Fields to Orders
-- Store contact info directly on orders for convenience
-- =============================================

-- Add borrower contact info
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS borrower_email TEXT,
  ADD COLUMN IF NOT EXISTS borrower_phone TEXT;

-- Add loan officer contact info
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS loan_officer_email TEXT,
  ADD COLUMN IF NOT EXISTS loan_officer_phone TEXT;

-- Add processor contact info
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS processor_email TEXT,
  ADD COLUMN IF NOT EXISTS processor_phone TEXT;

-- Add property contact info
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS property_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS property_contact_email TEXT,
  ADD COLUMN IF NOT EXISTS property_contact_phone TEXT;

-- =============================================
-- 4. Add Contact Foreign Keys to Orders
-- Store direct references to contact records
-- =============================================

-- Add contact_id columns for each role
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS borrower_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS loan_officer_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS processor_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS property_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS realtor_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL;

-- =============================================
-- 5. Indexes for Performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_order_contacts_order_id
  ON public.order_contacts(order_id);

CREATE INDEX IF NOT EXISTS idx_order_contacts_contact_id
  ON public.order_contacts(contact_id);

CREATE INDEX IF NOT EXISTS idx_order_contacts_role
  ON public.order_contacts(role_code);

CREATE INDEX IF NOT EXISTS idx_order_contacts_tenant
  ON public.order_contacts(tenant_id);

CREATE INDEX IF NOT EXISTS idx_orders_borrower_contact
  ON public.orders(borrower_contact_id) WHERE borrower_contact_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_loan_officer_contact
  ON public.orders(loan_officer_contact_id) WHERE loan_officer_contact_id IS NOT NULL;

-- =============================================
-- 6. Row Level Security
-- =============================================

ALTER TABLE public.order_contacts ENABLE ROW LEVEL SECURITY;

-- Select policy - users can view order contacts for their tenant
CREATE POLICY "Users can view order contacts in their tenant"
  ON public.order_contacts FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Insert policy
CREATE POLICY "Users can create order contacts in their tenant"
  ON public.order_contacts FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Update policy
CREATE POLICY "Users can update order contacts in their tenant"
  ON public.order_contacts FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Delete policy
CREATE POLICY "Users can delete order contacts in their tenant"
  ON public.order_contacts FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- =============================================
-- 7. Updated At Trigger
-- =============================================

CREATE TRIGGER update_order_contacts_updated_at
  BEFORE UPDATE ON public.order_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- 8. Function to Create Contact from Order Data
-- Validates and creates contact with enrichment if needed
-- =============================================

CREATE OR REPLACE FUNCTION public.create_order_contact(
  p_order_id UUID,
  p_full_name TEXT,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_role_code TEXT DEFAULT 'borrower',
  p_client_id UUID DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_contact_id UUID;
  v_existing_contact_id UUID;
  v_client_id UUID;
  v_tenant_id UUID;
  v_result JSONB;
BEGIN
  -- Validate: must have full name and (email or phone)
  IF p_full_name IS NULL OR trim(p_full_name) = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Full name is required',
      'needs_enrichment', true
    );
  END IF;

  IF (p_email IS NULL OR trim(p_email) = '') AND (p_phone IS NULL OR trim(p_phone) = '') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Email or phone is required',
      'needs_enrichment', true,
      'full_name', p_full_name
    );
  END IF;

  -- Parse name (simple split on space)
  v_first_name := split_part(trim(p_full_name), ' ', 1);
  v_last_name := CASE
    WHEN position(' ' in trim(p_full_name)) > 0
    THEN substring(trim(p_full_name) from position(' ' in trim(p_full_name)) + 1)
    ELSE ''
  END;

  -- Get client_id from order if not provided
  IF p_client_id IS NULL THEN
    SELECT client_id INTO v_client_id FROM public.orders WHERE id = p_order_id;
  ELSE
    v_client_id := p_client_id;
  END IF;

  -- Get tenant_id from order if not provided
  IF p_tenant_id IS NULL THEN
    SELECT tenant_id INTO v_tenant_id FROM public.orders WHERE id = p_order_id;
  ELSE
    v_tenant_id := p_tenant_id;
  END IF;

  -- Check for existing contact by email (if provided)
  IF p_email IS NOT NULL AND trim(p_email) != '' THEN
    SELECT id INTO v_existing_contact_id
    FROM public.contacts
    WHERE lower(email) = lower(trim(p_email))
      AND tenant_id = v_tenant_id
    LIMIT 1;
  END IF;

  -- If no email match, check by name + phone
  IF v_existing_contact_id IS NULL AND p_phone IS NOT NULL AND trim(p_phone) != '' THEN
    SELECT id INTO v_existing_contact_id
    FROM public.contacts
    WHERE lower(first_name) = lower(v_first_name)
      AND lower(last_name) = lower(v_last_name)
      AND (phone = trim(p_phone) OR mobile = trim(p_phone))
      AND tenant_id = v_tenant_id
    LIMIT 1;
  END IF;

  IF v_existing_contact_id IS NOT NULL THEN
    -- Use existing contact
    v_contact_id := v_existing_contact_id;

    -- Update contact with any new info
    UPDATE public.contacts SET
      email = COALESCE(NULLIF(trim(p_email), ''), email),
      phone = COALESCE(NULLIF(trim(p_phone), ''), phone),
      primary_role_code = COALESCE(primary_role_code, p_role_code),
      updated_at = NOW()
    WHERE id = v_contact_id;

    v_result := jsonb_build_object(
      'success', true,
      'contact_id', v_contact_id,
      'is_new', false,
      'message', 'Used existing contact'
    );
  ELSE
    -- Create new contact
    INSERT INTO public.contacts (
      client_id,
      first_name,
      last_name,
      email,
      phone,
      primary_role_code,
      is_primary,
      tenant_id
    ) VALUES (
      v_client_id,
      v_first_name,
      v_last_name,
      NULLIF(trim(p_email), ''),
      NULLIF(trim(p_phone), ''),
      p_role_code,
      false,
      v_tenant_id
    )
    RETURNING id INTO v_contact_id;

    v_result := jsonb_build_object(
      'success', true,
      'contact_id', v_contact_id,
      'is_new', true,
      'message', 'Created new contact'
    );
  END IF;

  -- Link contact to order
  INSERT INTO public.order_contacts (
    order_id,
    contact_id,
    role_code,
    is_primary,
    tenant_id
  ) VALUES (
    p_order_id,
    v_contact_id,
    p_role_code,
    true,
    v_tenant_id
  )
  ON CONFLICT (order_id, role_code) DO UPDATE SET
    contact_id = EXCLUDED.contact_id,
    updated_at = NOW();

  -- Update direct reference on order
  EXECUTE format(
    'UPDATE public.orders SET %I = $1 WHERE id = $2',
    CASE p_role_code
      WHEN 'borrower' THEN 'borrower_contact_id'
      WHEN 'loan_officer' THEN 'loan_officer_contact_id'
      WHEN 'processor' THEN 'processor_contact_id'
      WHEN 'property_contact' THEN 'property_contact_id'
      WHEN 'realtor' THEN 'realtor_contact_id'
      WHEN 'listing_agent' THEN 'realtor_contact_id'
      WHEN 'buying_agent' THEN 'realtor_contact_id'
      ELSE NULL
    END
  ) USING v_contact_id, p_order_id;

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 9. Function to Get Order Contacts
-- =============================================

CREATE OR REPLACE FUNCTION public.get_order_contacts(p_order_id UUID)
RETURNS TABLE (
  contact_id UUID,
  role_code TEXT,
  role_label TEXT,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  is_primary BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id as contact_id,
    oc.role_code,
    pr.label as role_label,
    (c.first_name || ' ' || c.last_name) as full_name,
    c.email,
    c.phone,
    c.mobile,
    oc.is_primary
  FROM public.order_contacts oc
  JOIN public.contacts c ON oc.contact_id = c.id
  JOIN public.party_roles pr ON oc.role_code = pr.code
  WHERE oc.order_id = p_order_id
  ORDER BY pr.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 10. Comments
-- =============================================

COMMENT ON TABLE public.order_contacts IS 'Junction table linking contacts to orders with specific roles';
COMMENT ON COLUMN public.order_contacts.role_code IS 'Role of the contact on this order (borrower, loan_officer, processor, realtor, etc.)';
COMMENT ON FUNCTION public.create_order_contact IS 'Creates or finds a contact and links to order. Returns needs_enrichment=true if contact info is insufficient.';
