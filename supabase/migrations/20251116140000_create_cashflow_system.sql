-- =============================================
-- CASHFLOW PLANNER INTEGRATION
-- Integrates with existing invoicing system
-- Provides Kanban-style cashflow board for income & expenses
-- =============================================

-- =============================================
-- 1. CUSTOM TYPES
-- =============================================

-- Transaction type enum
DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM (
    'income',    -- Money coming in (invoices, other income)
    'expense'    -- Money going out (bills, costs, etc.)
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Cashflow status enum
DO $$ BEGIN
  CREATE TYPE cashflow_status_type AS ENUM (
    'pending',     -- Not yet paid/received
    'scheduled',   -- Scheduled for future date
    'paid',        -- Completed
    'overdue',     -- Past due date, not paid
    'cancelled'    -- Cancelled transaction
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Board column enum (for Kanban layout)
DO $$ BEGIN
  CREATE TYPE board_column_type AS ENUM (
    'overdue',       -- Past due, unpaid
    'current_week',  -- Due within next 7 days
    'next_week',     -- Due within 8-14 days
    'later',         -- Due 15+ days from now
    'collected'      -- Paid/received (terminal)
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- 2. CASHFLOW TRANSACTIONS TABLE
-- Main table for cashflow planning
-- =============================================

CREATE TABLE IF NOT EXISTS public.cashflow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Transaction classification
  transaction_type transaction_type NOT NULL,
  category TEXT, -- e.g., 'invoice_payment', 'office_rent', 'software', 'utilities'

  -- Linking to existing systems (KEY INTEGRATION POINTS)
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,

  -- Financial details
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),

  -- Timing & dates
  due_date DATE,
  expected_date DATE,  -- When you expect to receive/pay (can differ from due_date)
  actual_date DATE,    -- When actually received/paid

  -- Recurrence support
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB, -- { frequency: 'weekly'|'monthly'|'yearly', interval: 1, end_date: '2025-12-31' }
  parent_transaction_id UUID REFERENCES public.cashflow_transactions(id) ON DELETE CASCADE,

  -- Status & priority
  status cashflow_status_type NOT NULL DEFAULT 'pending',
  priority_score INTEGER DEFAULT 0, -- AI-calculated priority (0-100)

  -- Cashflow board position (Kanban)
  board_column board_column_type NOT NULL DEFAULT 'later',
  board_position INTEGER DEFAULT 0, -- Order within column

  -- AI metadata
  ai_extracted BOOLEAN DEFAULT false, -- Was this extracted by AI from chat/document?
  ai_metadata JSONB, -- Store AI extraction details
  ai_confidence DECIMAL(3,2), -- AI extraction confidence (0.00-1.00)

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_invoice_cashflow UNIQUE (invoice_id) -- One cashflow entry per invoice
);

-- Comments
COMMENT ON TABLE public.cashflow_transactions IS 'Unified cashflow tracking: income (invoices) and expenses';
COMMENT ON COLUMN public.cashflow_transactions.invoice_id IS 'Links to invoicing system - auto-synced via triggers';
COMMENT ON COLUMN public.cashflow_transactions.transaction_type IS 'income (money in) or expense (money out)';
COMMENT ON COLUMN public.cashflow_transactions.board_column IS 'Kanban column placement based on due_date and status';
COMMENT ON COLUMN public.cashflow_transactions.category IS 'Transaction category for reporting and filtering';
COMMENT ON COLUMN public.cashflow_transactions.recurrence_pattern IS 'JSON pattern for recurring transactions';

-- =============================================
-- 3. INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_cashflow_tenant_user ON public.cashflow_transactions(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_cashflow_invoice ON public.cashflow_transactions(invoice_id) WHERE invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cashflow_board ON public.cashflow_transactions(tenant_id, board_column, board_position);
CREATE INDEX IF NOT EXISTS idx_cashflow_dates ON public.cashflow_transactions(tenant_id, due_date, status);
CREATE INDEX IF NOT EXISTS idx_cashflow_status ON public.cashflow_transactions(status);
CREATE INDEX IF NOT EXISTS idx_cashflow_client ON public.cashflow_transactions(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cashflow_category ON public.cashflow_transactions(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cashflow_recurring ON public.cashflow_transactions(parent_transaction_id) WHERE parent_transaction_id IS NOT NULL;

-- Composite index for common board queries
CREATE INDEX IF NOT EXISTS idx_cashflow_board_query ON public.cashflow_transactions(tenant_id, status, board_column, board_position);

-- =============================================
-- 4. HELPER FUNCTIONS
-- =============================================

-- Function to determine board column based on due date and status
CREATE OR REPLACE FUNCTION public.calculate_board_column(
  p_due_date DATE,
  p_status cashflow_status_type
)
RETURNS board_column_type AS $$
BEGIN
  -- If paid/received, goes to collected column
  IF p_status = 'paid' THEN
    RETURN 'collected'::board_column_type;
  END IF;

  -- If cancelled, treat as collected (archive)
  IF p_status = 'cancelled' THEN
    RETURN 'collected'::board_column_type;
  END IF;

  -- If no due date, default to later
  IF p_due_date IS NULL THEN
    RETURN 'later'::board_column_type;
  END IF;

  -- Calculate based on due date
  IF p_due_date < CURRENT_DATE THEN
    RETURN 'overdue'::board_column_type;
  ELSIF p_due_date <= CURRENT_DATE + INTERVAL '7 days' THEN
    RETURN 'current_week'::board_column_type;
  ELSIF p_due_date <= CURRENT_DATE + INTERVAL '14 days' THEN
    RETURN 'next_week'::board_column_type;
  ELSE
    RETURN 'later'::board_column_type;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.calculate_board_column IS 'Determines Kanban column based on due date and status';

-- =============================================
-- 5. TRIGGERS - INVOICE TO CASHFLOW SYNC
-- =============================================

-- Function to sync invoice to cashflow
CREATE OR REPLACE FUNCTION public.sync_invoice_to_cashflow()
RETURNS TRIGGER AS $$
DECLARE
  v_column board_column_type;
  v_status cashflow_status_type;
  v_expected_date DATE;
  v_actual_date DATE;
  v_description TEXT;
  v_client_name TEXT;
  v_order_id UUID;
BEGIN
  -- Skip if invoice is void or cancelled
  IF NEW.status IN ('void', 'cancelled') THEN
    -- Delete cashflow transaction if exists
    DELETE FROM public.cashflow_transactions WHERE invoice_id = NEW.id;
    RETURN NEW;
  END IF;

  -- Determine cashflow status from invoice status
  v_status := CASE
    WHEN NEW.status = 'paid' THEN 'paid'::cashflow_status_type
    WHEN NEW.status = 'overdue' THEN 'overdue'::cashflow_status_type
    ELSE 'pending'::cashflow_status_type
  END;

  -- Set dates
  v_expected_date := CASE
    WHEN NEW.status = 'paid' THEN NEW.paid_at::DATE
    ELSE NEW.due_date
  END;

  v_actual_date := CASE
    WHEN NEW.status = 'paid' THEN NEW.paid_at::DATE
    ELSE NULL
  END;

  -- Calculate board column
  v_column := public.calculate_board_column(NEW.due_date, v_status);

  -- Get client name for description
  SELECT name INTO v_client_name
  FROM public.clients
  WHERE id = NEW.client_id;

  -- Build description
  v_description := 'Invoice #' || NEW.invoice_number;
  IF v_client_name IS NOT NULL THEN
    v_description := v_description || ' - ' || v_client_name;
  END IF;

  -- Get first linked order ID
  SELECT order_id INTO v_order_id
  FROM public.invoice_line_items
  WHERE invoice_id = NEW.id AND order_id IS NOT NULL
  LIMIT 1;

  -- Insert or update cashflow transaction
  INSERT INTO public.cashflow_transactions (
    tenant_id,
    user_id,
    transaction_type,
    category,
    invoice_id,
    order_id,
    client_id,
    description,
    amount,
    due_date,
    expected_date,
    actual_date,
    status,
    board_column,
    ai_extracted
  ) VALUES (
    NEW.tenant_id,
    COALESCE(NEW.created_by, NEW.tenant_id),
    'income'::transaction_type,
    'invoice_payment',
    NEW.id,
    v_order_id,
    NEW.client_id,
    v_description,
    NEW.total_amount,
    NEW.due_date,
    v_expected_date,
    v_actual_date,
    v_status,
    v_column,
    false
  )
  ON CONFLICT (invoice_id) DO UPDATE SET
    description = EXCLUDED.description,
    amount = EXCLUDED.amount,
    due_date = EXCLUDED.due_date,
    expected_date = EXCLUDED.expected_date,
    actual_date = EXCLUDED.actual_date,
    status = EXCLUDED.status,
    board_column = EXCLUDED.board_column,
    client_id = EXCLUDED.client_id,
    order_id = EXCLUDED.order_id,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.sync_invoice_to_cashflow IS 'Automatically syncs invoice changes to cashflow board';

-- Create trigger on invoices table
CREATE TRIGGER trigger_sync_invoice_to_cashflow
  AFTER INSERT OR UPDATE OF status, due_date, total_amount, paid_at, invoice_number
  ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_invoice_to_cashflow();

-- =============================================
-- 6. TRIGGERS - BOARD COLUMN AUTO-UPDATE
-- =============================================

-- Function to auto-update board column when due date or status changes
CREATE OR REPLACE FUNCTION public.auto_update_board_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate board column
  NEW.board_column := public.calculate_board_column(NEW.due_date, NEW.status);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.auto_update_board_column IS 'Automatically updates board column when due date or status changes';

-- Create trigger on cashflow_transactions
CREATE TRIGGER trigger_auto_update_board_column
  BEFORE INSERT OR UPDATE OF due_date, status
  ON public.cashflow_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_update_board_column();

-- =============================================
-- 7. TRIGGERS - UPDATED_AT TIMESTAMP
-- =============================================

CREATE TRIGGER update_cashflow_transactions_updated_at
  BEFORE UPDATE ON public.cashflow_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 8. VIEWS FOR REPORTING
-- =============================================

-- Cashflow board view (grouped by column)
CREATE OR REPLACE VIEW public.cashflow_board AS
SELECT
  ct.id,
  ct.tenant_id,
  ct.user_id,
  ct.transaction_type,
  ct.category,
  ct.invoice_id,
  ct.order_id,
  ct.client_id,
  ct.description,
  ct.amount,
  ct.due_date,
  ct.expected_date,
  ct.actual_date,
  ct.is_recurring,
  ct.status,
  ct.board_column,
  ct.board_position,
  ct.priority_score,
  ct.ai_extracted,
  ct.created_at,
  ct.updated_at,
  -- Joined data
  c.name AS client_name,
  i.invoice_number,
  i.status AS invoice_status,
  o.property_address,
  -- Calculated fields
  CASE
    WHEN ct.due_date < CURRENT_DATE THEN CURRENT_DATE - ct.due_date
    ELSE 0
  END AS days_overdue,
  CASE
    WHEN ct.due_date >= CURRENT_DATE THEN ct.due_date - CURRENT_DATE
    ELSE 0
  END AS days_until_due
FROM public.cashflow_transactions ct
LEFT JOIN public.clients c ON ct.client_id = c.id
LEFT JOIN public.invoices i ON ct.invoice_id = i.id
LEFT JOIN public.orders o ON ct.order_id = o.id
WHERE ct.status != 'cancelled'
ORDER BY ct.board_column, ct.board_position, ct.due_date;

COMMENT ON VIEW public.cashflow_board IS 'Cashflow board view with joined client/invoice/order data';

-- Cashflow summary by column
CREATE OR REPLACE VIEW public.cashflow_summary AS
SELECT
  tenant_id,
  board_column,
  transaction_type,
  COUNT(*) AS transaction_count,
  SUM(amount) AS total_amount,
  SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) AS total_income,
  SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) AS total_expenses,
  SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE -amount END) AS net_amount
FROM public.cashflow_transactions
WHERE status != 'cancelled'
GROUP BY tenant_id, board_column, transaction_type
ORDER BY tenant_id, board_column, transaction_type;

COMMENT ON VIEW public.cashflow_summary IS 'Summary statistics by board column and transaction type';

-- Cashflow forecast (next 90 days)
CREATE OR REPLACE VIEW public.cashflow_forecast AS
SELECT
  tenant_id,
  date_trunc('week', due_date)::DATE AS week_start,
  COUNT(*) AS transaction_count,
  SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) AS expected_income,
  SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) AS expected_expenses,
  SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE -amount END) AS net_cashflow
FROM public.cashflow_transactions
WHERE status IN ('pending', 'scheduled', 'overdue')
  AND due_date >= CURRENT_DATE
  AND due_date <= CURRENT_DATE + INTERVAL '90 days'
GROUP BY tenant_id, date_trunc('week', due_date)::DATE
ORDER BY tenant_id, week_start;

COMMENT ON VIEW public.cashflow_forecast IS 'Weekly cashflow forecast for next 90 days';

-- Overdue items view
CREATE OR REPLACE VIEW public.cashflow_overdue AS
SELECT
  ct.*,
  c.name AS client_name,
  i.invoice_number,
  CURRENT_DATE - ct.due_date AS days_overdue
FROM public.cashflow_transactions ct
LEFT JOIN public.clients c ON ct.client_id = c.id
LEFT JOIN public.invoices i ON ct.invoice_id = i.id
WHERE ct.status = 'overdue'
  AND ct.due_date < CURRENT_DATE
ORDER BY ct.due_date ASC;

COMMENT ON VIEW public.cashflow_overdue IS 'All overdue transactions with days overdue calculation';

-- =============================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on cashflow_transactions
ALTER TABLE public.cashflow_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their organization's cashflow transactions
CREATE POLICY cashflow_transactions_select_policy ON public.cashflow_transactions
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Policy: Users can insert cashflow transactions for their organization
CREATE POLICY cashflow_transactions_insert_policy ON public.cashflow_transactions
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Policy: Users can update their organization's cashflow transactions
CREATE POLICY cashflow_transactions_update_policy ON public.cashflow_transactions
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT id FROM public.profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Policy: Users can delete their organization's cashflow transactions
CREATE POLICY cashflow_transactions_delete_policy ON public.cashflow_transactions
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- =============================================
-- 10. BACKFILL EXISTING INVOICES
-- =============================================

-- Backfill existing invoices into cashflow system
-- This will run once to sync all existing invoices
INSERT INTO public.cashflow_transactions (
  tenant_id,
  user_id,
  transaction_type,
  category,
  invoice_id,
  client_id,
  description,
  amount,
  due_date,
  expected_date,
  actual_date,
  status,
  board_column,
  ai_extracted
)
SELECT
  i.tenant_id,
  COALESCE(i.created_by, i.tenant_id),
  'income'::transaction_type,
  'invoice_payment',
  i.id,
  i.client_id,
  'Invoice #' || i.invoice_number || COALESCE(' - ' || c.name, ''),
  i.total_amount,
  i.due_date,
  CASE WHEN i.status = 'paid' THEN i.paid_at::DATE ELSE i.due_date END,
  CASE WHEN i.status = 'paid' THEN i.paid_at::DATE ELSE NULL END,
  CASE
    WHEN i.status = 'paid' THEN 'paid'::cashflow_status_type
    WHEN i.status = 'overdue' THEN 'overdue'::cashflow_status_type
    ELSE 'pending'::cashflow_status_type
  END,
  public.calculate_board_column(
    i.due_date,
    CASE
      WHEN i.status = 'paid' THEN 'paid'::cashflow_status_type
      WHEN i.status = 'overdue' THEN 'overdue'::cashflow_status_type
      ELSE 'pending'::cashflow_status_type
    END
  ),
  false
FROM public.invoices i
LEFT JOIN public.clients c ON i.client_id = c.id
WHERE i.status NOT IN ('void', 'cancelled')
ON CONFLICT (invoice_id) DO NOTHING;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
