-- =============================================
-- AppraiseTrack Case Management System
-- Run this AFTER the other migrations
-- =============================================

-- =============================================
-- CASES TABLE
-- =============================================
CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  case_type TEXT NOT NULL CHECK (case_type IN ('support', 'billing', 'quality_concern', 'complaint', 'service_request', 'technical', 'feedback', 'other')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'open', 'pending', 'in_progress', 'resolved', 'closed', 'reopened')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent', 'critical')),
  client_id UUID REFERENCES public.clients ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.profiles ON DELETE SET NULL,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CASE COMMENTS TABLE (Case communication thread)
-- =============================================
CREATE TABLE public.case_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_cases_case_number ON public.cases(case_number);
CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_cases_priority ON public.cases(priority);
CREATE INDEX idx_cases_case_type ON public.cases(case_type);
CREATE INDEX idx_cases_client_id ON public.cases(client_id);
CREATE INDEX idx_cases_contact_id ON public.cases(contact_id);
CREATE INDEX idx_cases_order_id ON public.cases(order_id);
CREATE INDEX idx_cases_assigned_to ON public.cases(assigned_to);
CREATE INDEX idx_cases_created_by ON public.cases(created_by);
CREATE INDEX idx_cases_created_at ON public.cases(created_at);

CREATE INDEX idx_case_comments_case_id ON public.case_comments(case_id);
CREATE INDEX idx_case_comments_created_by ON public.case_comments(created_by);
CREATE INDEX idx_case_comments_created_at ON public.case_comments(created_at);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Cases
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cases viewable by authenticated users"
  ON public.cases FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create cases"
  ON public.cases FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update cases"
  ON public.cases FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete cases"
  ON public.cases FOR DELETE
  TO authenticated
  USING (true);

-- Case Comments
ALTER TABLE public.case_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Case comments viewable by authenticated users"
  ON public.case_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create case comments"
  ON public.case_comments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update case comments"
  ON public.case_comments FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete case comments"
  ON public.case_comments FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- =============================================

CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================
-- FUNCTION: Auto-generate case number
-- =============================================
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  year_prefix TEXT;
  sequence_num INTEGER;
BEGIN
  -- Get current year (e.g., "2025")
  year_prefix := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Get the count of cases created this year
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM public.cases
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Format: CASE-YYYY-NNNN (e.g., CASE-2025-0001)
  new_number := 'CASE-' || year_prefix || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGER: Auto-set case number on insert
-- =============================================
CREATE OR REPLACE FUNCTION set_case_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.case_number IS NULL OR NEW.case_number = '' THEN
    NEW.case_number := generate_case_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_case_number_trigger
  BEFORE INSERT ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION set_case_number();

-- =============================================
-- TRIGGER: Auto-set resolved_at when status changes to resolved
-- =============================================
CREATE OR REPLACE FUNCTION set_case_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at := NOW();
  END IF;
  
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    NEW.closed_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_case_resolved_at_trigger
  BEFORE UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION set_case_resolved_at();

-- =============================================
-- VIEW: Cases with full details
-- =============================================
CREATE OR REPLACE VIEW public.cases_with_stats AS
SELECT 
  c.*,
  cl.company_name as client_name,
  co.first_name || ' ' || co.last_name as contact_name,
  o.order_number,
  p_assigned.name as assignee_name,
  p_created.name as creator_name,
  COUNT(DISTINCT cc.id) as comment_count
FROM public.cases c
LEFT JOIN public.clients cl ON c.client_id = cl.id
LEFT JOIN public.contacts co ON c.contact_id = co.id
LEFT JOIN public.orders o ON c.order_id = o.id
LEFT JOIN public.profiles p_assigned ON c.assigned_to = p_assigned.id
LEFT JOIN public.profiles p_created ON c.created_by = p_created.id
LEFT JOIN public.case_comments cc ON c.id = cc.case_id
GROUP BY c.id, cl.company_name, co.first_name, co.last_name, o.order_number, p_assigned.name, p_created.name;

-- =============================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================
-- Uncomment to insert sample cases
/*
INSERT INTO public.cases (subject, description, case_type, status, priority, created_by)
VALUES 
  ('System login issue', 'User unable to login to the portal', 'technical', 'open', 'high', (SELECT id FROM public.profiles LIMIT 1)),
  ('Invoice discrepancy', 'Invoice amount does not match agreed pricing', 'billing', 'pending', 'normal', (SELECT id FROM public.profiles LIMIT 1)),
  ('Appraisal quality concern', 'Client raised concerns about comparable properties used', 'quality_concern', 'resolved', 'urgent', (SELECT id FROM public.profiles LIMIT 1));
*/

