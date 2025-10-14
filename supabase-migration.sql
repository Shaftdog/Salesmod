-- AppraiseTrack Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES TABLE (extends auth.users)
-- =============================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  availability BOOLEAN DEFAULT true,
  geographic_coverage TEXT,
  workload INTEGER DEFAULT 0,
  rating DECIMAL(2,1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CLIENTS TABLE
-- =============================================
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  primary_contact TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  billing_address TEXT NOT NULL,
  payment_terms INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  active_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  fee_schedule JSONB,
  preferred_turnaround INTEGER,
  special_requirements TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ORDERS TABLE
-- =============================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('new', 'assigned', 'scheduled', 'in_progress', 'in_review', 'revisions', 'completed', 'delivered', 'cancelled')),
  priority TEXT NOT NULL CHECK (priority IN ('rush', 'high', 'normal', 'low')),
  order_type TEXT NOT NULL CHECK (order_type IN ('purchase', 'refinance', 'home_equity', 'estate', 'divorce', 'tax_appeal', 'other')),
  property_address TEXT NOT NULL,
  property_city TEXT NOT NULL,
  property_state TEXT NOT NULL,
  property_zip TEXT NOT NULL,
  property_type TEXT NOT NULL CHECK (property_type IN ('single_family', 'condo', 'multi_family', 'commercial', 'land', 'manufactured')),
  loan_number TEXT,
  loan_type TEXT,
  loan_amount DECIMAL(12,2),
  client_id UUID REFERENCES public.clients NOT NULL,
  lender_name TEXT,
  loan_officer TEXT,
  loan_officer_email TEXT,
  loan_officer_phone TEXT,
  processor_name TEXT,
  processor_email TEXT,
  processor_phone TEXT,
  borrower_name TEXT NOT NULL,
  borrower_email TEXT,
  borrower_phone TEXT,
  property_contact_name TEXT,
  property_contact_phone TEXT,
  property_contact_email TEXT,
  access_instructions TEXT,
  special_instructions TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  ordered_date TIMESTAMPTZ NOT NULL,
  completed_date TIMESTAMPTZ,
  delivered_date TIMESTAMPTZ,
  fee_amount DECIMAL(10,2) NOT NULL,
  tech_fee DECIMAL(10,2),
  total_amount DECIMAL(10,2) NOT NULL,
  assigned_to UUID REFERENCES public.profiles,
  assigned_date TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ORDER HISTORY TABLE
-- =============================================
CREATE TABLE public.order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  from_value TEXT,
  to_value TEXT,
  changed_by_id UUID REFERENCES public.profiles NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ORDER DOCUMENTS TABLE
-- =============================================
CREATE TABLE public.order_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('contract', 'report', 'invoice', 'photo', 'comparable', 'other')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_by_id UUID REFERENCES public.profiles NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ORDER NOTES TABLE
-- =============================================
CREATE TABLE public.order_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders ON DELETE CASCADE NOT NULL,
  note TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_by_id UUID REFERENCES public.profiles NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_orders_client_id ON public.orders(client_id);
CREATE INDEX idx_orders_assigned_to ON public.orders(assigned_to);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_due_date ON public.orders(due_date);
CREATE INDEX idx_orders_created_by ON public.orders(created_by);
CREATE INDEX idx_orders_property_location ON public.orders(property_city, property_state);
CREATE INDEX idx_order_history_order_id ON public.order_history(order_id);
CREATE INDEX idx_order_documents_order_id ON public.order_documents(order_id);
CREATE INDEX idx_order_notes_order_id ON public.order_notes(order_id);

-- =============================================
-- AUTO-GENERATE ORDER NUMBERS
-- =============================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'APR-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
      LPAD((SELECT COALESCE(MAX(SUBSTRING(order_number FROM '\d+$')::INTEGER), 1000) + 1
            FROM public.orders 
            WHERE order_number LIKE 'APR-' || TO_CHAR(NOW(), 'YYYY') || '-%')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_number();

-- =============================================
-- AUTO-UPDATE TIMESTAMPS
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all, update only their own
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Clients: All authenticated users can view and manage
CREATE POLICY "Clients are viewable by authenticated users"
  ON public.clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create clients"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete clients"
  ON public.clients FOR DELETE
  TO authenticated
  USING (true);

-- Orders: All authenticated users can view and manage
CREATE POLICY "Orders are viewable by authenticated users"
  ON public.orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete orders"
  ON public.orders FOR DELETE
  TO authenticated
  USING (true);

-- Order History: All authenticated users can view and create
CREATE POLICY "Order history is viewable by authenticated users"
  ON public.order_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create order history"
  ON public.order_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Order Documents: All authenticated users can view and manage
CREATE POLICY "Order documents are viewable by authenticated users"
  ON public.order_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can upload order documents"
  ON public.order_documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete order documents"
  ON public.order_documents FOR DELETE
  TO authenticated
  USING (true);

-- Order Notes: All authenticated users can view and manage
CREATE POLICY "Order notes are viewable by authenticated users"
  ON public.order_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create order notes"
  ON public.order_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update order notes"
  ON public.order_notes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete order notes"
  ON public.order_notes FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- TRIGGER TO CREATE PROFILE ON USER SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'User'), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- SEED DATA (Optional - for testing)
-- =============================================

-- Note: You'll need to create actual users through Supabase Auth first
-- Then insert seed data using their UUIDs

-- Example client seed data (uncomment after you have users)
-- INSERT INTO public.clients (company_name, primary_contact, email, phone, address, billing_address) VALUES
--   ('Global Bank Corp', 'Alice Wonderland', 'alice@gbc.com', '(123) 456-7890', '123 Main St, San Francisco, CA 94105', '123 Main St, San Francisco, CA 94105'),
--   ('Secure Lending', 'Bob Builder', 'bob@securelending.com', '(987) 654-3210', '456 Market St, San Francisco, CA 94105', '456 Market St, San Francisco, CA 94105');



