-- =============================================
-- AppraiseTrack CRM Expansion - Phase 1
-- Run this AFTER the main migration (supabase-migration.sql)
-- =============================================

-- =============================================
-- CONTACTS TABLE (Multiple contacts per client)
-- =============================================
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  is_primary BOOLEAN DEFAULT false,
  department TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ACTIVITIES TABLE (Calls, emails, meetings, notes)
-- =============================================
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders ON DELETE SET NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'email', 'meeting', 'note', 'task')),
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  outcome TEXT,
  created_by UUID REFERENCES public.profiles NOT NULL,
  assigned_to UUID REFERENCES public.profiles,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TAGS TABLE
-- =============================================
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#3771C8',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CLIENT_TAGS TABLE (Many-to-many relationship)
-- =============================================
CREATE TABLE public.client_tags (
  client_id UUID REFERENCES public.clients ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (client_id, tag_id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_contacts_client_id ON public.contacts(client_id);
CREATE INDEX idx_contacts_email ON public.contacts(email);
CREATE INDEX idx_contacts_is_primary ON public.contacts(is_primary);

CREATE INDEX idx_activities_client_id ON public.activities(client_id);
CREATE INDEX idx_activities_contact_id ON public.activities(contact_id);
CREATE INDEX idx_activities_order_id ON public.activities(order_id);
CREATE INDEX idx_activities_created_by ON public.activities(created_by);
CREATE INDEX idx_activities_scheduled_at ON public.activities(scheduled_at);
CREATE INDEX idx_activities_type ON public.activities(activity_type);
CREATE INDEX idx_activities_status ON public.activities(status);

CREATE INDEX idx_tags_name ON public.tags(name);
CREATE INDEX idx_client_tags_client ON public.client_tags(client_id);
CREATE INDEX idx_client_tags_tag ON public.client_tags(tag_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Contacts
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contacts viewable by authenticated users"
  ON public.contacts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create contacts"
  ON public.contacts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update contacts"
  ON public.contacts FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete contacts"
  ON public.contacts FOR DELETE
  TO authenticated
  USING (true);

-- Activities
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activities viewable by authenticated users"
  ON public.activities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create activities"
  ON public.activities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update activities"
  ON public.activities FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete activities"
  ON public.activities FOR DELETE
  TO authenticated
  USING (true);

-- Tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags viewable by authenticated users"
  ON public.tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage tags"
  ON public.tags FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Client Tags
ALTER TABLE public.client_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client tags viewable by authenticated users"
  ON public.client_tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage client tags"
  ON public.client_tags FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- =============================================

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================
-- HELPER FUNCTION: Ensure only one primary contact
-- =============================================
CREATE OR REPLACE FUNCTION ensure_one_primary_contact()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE public.contacts
    SET is_primary = false
    WHERE client_id = NEW.client_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_one_primary_contact
  AFTER INSERT OR UPDATE ON public.contacts
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION ensure_one_primary_contact();

-- =============================================
-- SEED DATA: Default Tags
-- =============================================
INSERT INTO public.tags (name, color) VALUES
  ('VIP', '#F59E0B'),
  ('High Volume', '#10B981'),
  ('New Client', '#3B82F6'),
  ('At Risk', '#EF4444'),
  ('Growth Potential', '#8B5CF6'),
  ('Slow Payer', '#F97316'),
  ('Preferred Partner', '#EC4899')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- VIEW: Client with contact count
-- =============================================
CREATE OR REPLACE VIEW public.clients_with_stats AS
SELECT 
  c.*,
  COUNT(DISTINCT co.id) as contact_count,
  COUNT(DISTINCT a.id) as activity_count,
  COUNT(DISTINCT ct.tag_id) as tag_count,
  MAX(a.created_at) as last_activity_at
FROM public.clients c
LEFT JOIN public.contacts co ON c.id = co.client_id
LEFT JOIN public.activities a ON c.id = a.client_id
LEFT JOIN public.client_tags ct ON c.id = ct.client_id
GROUP BY c.id;

