-- =============================================
-- Goals & Target Tracking Migration
-- Monthly/Quarterly/Yearly goal setting for sales metrics
-- =============================================

-- =============================================
-- GOALS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Goal identification
  metric_type TEXT NOT NULL CHECK (metric_type IN (
    'order_volume',      -- Number of orders
    'revenue',           -- Total revenue
    'new_clients',       -- New clients acquired
    'completion_rate',   -- % orders completed on time
    'deal_value',        -- Pipeline value
    'deals_closed'       -- Number of deals won
  )),
  
  -- Target values
  target_value DECIMAL(10,2) NOT NULL,
  
  -- Time period
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Optional: team vs individual goals
  assigned_to UUID REFERENCES public.profiles ON DELETE CASCADE, -- NULL = team goal
  
  -- Metadata
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique goals per period
  UNIQUE(metric_type, period_start, period_end, assigned_to)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_goals_period ON public.goals(period_start, period_end);
CREATE INDEX idx_goals_metric ON public.goals(metric_type);
CREATE INDEX idx_goals_assigned_to ON public.goals(assigned_to);
CREATE INDEX idx_goals_active ON public.goals(is_active) WHERE is_active = true;
CREATE INDEX idx_goals_created_by ON public.goals(created_by);

-- =============================================
-- TRIGGERS
-- =============================================
CREATE TRIGGER update_goals_timestamp
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Users can view all goals (team and individual)
CREATE POLICY "Users can view all goals"
  ON public.goals
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can create goals
CREATE POLICY "Users can create goals"
  ON public.goals
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Users can update goals they created or that are assigned to them
CREATE POLICY "Users can update their own goals"
  ON public.goals
  FOR UPDATE
  USING (
    auth.uid() = created_by OR 
    auth.uid() = assigned_to
  );

-- Users can delete goals they created
CREATE POLICY "Users can delete goals they created"
  ON public.goals
  FOR DELETE
  USING (auth.uid() = created_by);

-- =============================================
-- HELPER VIEW: Current Period Goals with Progress
-- =============================================
CREATE OR REPLACE VIEW public.current_goals_summary AS
SELECT 
  g.id,
  g.metric_type,
  g.target_value,
  g.period_type,
  g.period_start,
  g.period_end,
  g.assigned_to,
  g.description,
  p.name as assigned_to_name,
  -- Calculate days remaining in period
  (g.period_end - CURRENT_DATE) as days_remaining,
  -- Calculate period progress percentage
  CASE 
    WHEN g.period_end <= g.period_start THEN 100
    ELSE ROUND(
      (EXTRACT(EPOCH FROM (CURRENT_DATE::TIMESTAMP - g.period_start::TIMESTAMP)) / 
       EXTRACT(EPOCH FROM (g.period_end::TIMESTAMP - g.period_start::TIMESTAMP))) * 100
    )
  END as period_progress_pct
FROM public.goals g
LEFT JOIN public.profiles p ON g.assigned_to = p.id
WHERE g.is_active = true
  AND g.period_start <= CURRENT_DATE
  AND g.period_end >= CURRENT_DATE
ORDER BY g.period_start DESC;

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE public.goals IS 'Tracks sales and performance goals with time-based targets';
COMMENT ON COLUMN public.goals.metric_type IS 'Type of metric being tracked (order_volume, revenue, etc.)';
COMMENT ON COLUMN public.goals.target_value IS 'Target value to achieve for this goal';
COMMENT ON COLUMN public.goals.period_type IS 'Time period for goal (monthly, quarterly, yearly)';
COMMENT ON COLUMN public.goals.assigned_to IS 'User ID for individual goals, NULL for team goals';
COMMENT ON VIEW public.current_goals_summary IS 'Shows active goals for the current period with progress calculations';

