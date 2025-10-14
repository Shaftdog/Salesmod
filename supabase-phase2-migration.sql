-- =============================================
-- AppraiseTrack CRM Expansion - Phase 2
-- Deals Pipeline & Task Management
-- Run this AFTER Phase 1 CRM migration
-- =============================================

-- =============================================
-- DEALS/OPPORTUNITIES TABLE
-- =============================================
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  value DECIMAL(10,2),
  probability INTEGER CHECK (probability BETWEEN 0 AND 100) DEFAULT 50,
  stage TEXT NOT NULL CHECK (stage IN ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost')) DEFAULT 'lead',
  expected_close_date DATE,
  actual_close_date DATE,
  lost_reason TEXT,
  assigned_to UUID REFERENCES public.profiles,
  created_by UUID REFERENCES public.profiles NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TASKS TABLE
-- =============================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES public.clients ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals ON DELETE SET NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES public.profiles NOT NULL,
  created_by UUID REFERENCES public.profiles NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_deals_client_id ON public.deals(client_id);
CREATE INDEX idx_deals_contact_id ON public.deals(contact_id);
CREATE INDEX idx_deals_stage ON public.deals(stage);
CREATE INDEX idx_deals_assigned_to ON public.deals(assigned_to);
CREATE INDEX idx_deals_created_by ON public.deals(created_by);
CREATE INDEX idx_deals_expected_close_date ON public.deals(expected_close_date);

CREATE INDEX idx_tasks_client_id ON public.tasks(client_id);
CREATE INDEX idx_tasks_contact_id ON public.tasks(contact_id);
CREATE INDEX idx_tasks_order_id ON public.tasks(order_id);
CREATE INDEX idx_tasks_deal_id ON public.tasks(deal_id);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Deals
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deals viewable by authenticated users"
  ON public.deals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create deals"
  ON public.deals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update deals"
  ON public.deals FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete deals"
  ON public.deals FOR DELETE
  TO authenticated
  USING (true);

-- Tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tasks viewable by authenticated users"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create tasks"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tasks"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete tasks"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- =============================================

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================
-- TRIGGER: Auto-complete task when deal is won
-- =============================================
CREATE OR REPLACE FUNCTION auto_complete_deal_tasks()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stage = 'won' AND OLD.stage != 'won' THEN
    UPDATE public.tasks
    SET status = 'completed',
        completed_at = NOW()
    WHERE deal_id = NEW.id
      AND status IN ('pending', 'in_progress');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_complete_tasks_on_deal_won
  AFTER UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION auto_complete_deal_tasks();

-- =============================================
-- TRIGGER: Auto-log activity when deal stage changes
-- =============================================
CREATE OR REPLACE FUNCTION log_deal_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stage != OLD.stage THEN
    INSERT INTO public.activities (
      client_id,
      activity_type,
      subject,
      description,
      status,
      completed_at,
      created_by
    ) VALUES (
      NEW.client_id,
      'note',
      'Deal stage changed: ' || NEW.title,
      'Deal moved from ' || OLD.stage || ' to ' || NEW.stage,
      'completed',
      NOW(),
      NEW.created_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_activity_on_deal_stage_change
  AFTER UPDATE ON public.deals
  FOR EACH ROW
  WHEN (OLD.stage IS DISTINCT FROM NEW.stage)
  EXECUTE FUNCTION log_deal_stage_change();

-- =============================================
-- VIEWS FOR ANALYTICS
-- =============================================

-- Pipeline value by stage
CREATE OR REPLACE VIEW public.pipeline_by_stage AS
SELECT 
  stage,
  COUNT(*) as deal_count,
  SUM(value) as total_value,
  SUM(value * probability / 100.0) as weighted_value
FROM public.deals
WHERE stage NOT IN ('won', 'lost')
GROUP BY stage;

-- My tasks summary
CREATE OR REPLACE VIEW public.my_tasks_summary AS
SELECT 
  assigned_to,
  status,
  priority,
  COUNT(*) as task_count,
  COUNT(CASE WHEN due_date < NOW() AND status != 'completed' THEN 1 END) as overdue_count
FROM public.tasks
GROUP BY assigned_to, status, priority;

-- Deal conversion stats
CREATE OR REPLACE VIEW public.deal_stats AS
SELECT 
  COUNT(*) FILTER (WHERE stage = 'won') as won_count,
  COUNT(*) FILTER (WHERE stage = 'lost') as lost_count,
  COUNT(*) FILTER (WHERE stage NOT IN ('won', 'lost')) as active_count,
  ROUND(
    COUNT(*) FILTER (WHERE stage = 'won')::NUMERIC / 
    NULLIF(COUNT(*) FILTER (WHERE stage IN ('won', 'lost')), 0) * 100,
    2
  ) as win_rate
FROM public.deals;

