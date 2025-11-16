-- =============================================
-- INVOICING SYSTEM - Complete Schema
-- Three payment collection methods:
-- 1. COD (Cash on Delivery)
-- 2. Stripe Payment Link
-- 3. Net Terms Invoice
-- =============================================

-- =============================================
-- 1. CUSTOM TYPES (ENUMS)
-- =============================================

-- Payment collection method
DO $$ BEGIN
  CREATE TYPE payment_method_type AS ENUM (
    'cod',           -- Cash on delivery (in-person collection)
    'stripe_link',   -- Stripe payment link/invoice
    'net_terms'      -- Traditional NET-30/60/90 invoicing
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Invoice status workflow
DO $$ BEGIN
  CREATE TYPE invoice_status_type AS ENUM (
    'draft',          -- Invoice being prepared
    'sent',           -- Invoice sent to client
    'viewed',         -- Client viewed the invoice/link
    'partially_paid', -- Partial payment received
    'paid',           -- Fully paid
    'overdue',        -- Past due date, unpaid
    'cancelled',      -- Invoice cancelled
    'void'            -- Invoice voided (accounting correction)
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- COD collection method
DO $$ BEGIN
  CREATE TYPE cod_collection_method_type AS ENUM (
    'cash',
    'check',
    'money_order',
    'cashiers_check'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Payment method for payments table
DO $$ BEGIN
  CREATE TYPE payment_type AS ENUM (
    'cash',
    'check',
    'credit_card',
    'stripe',
    'ach',
    'wire',
    'money_order',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- 2. INVOICE NUMBER SEQUENCES TABLE
-- Auto-incrementing invoice numbers per org
-- =============================================

CREATE TABLE IF NOT EXISTS public.invoice_number_sequences (
  org_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_invoice_number INTEGER NOT NULL DEFAULT 0,
  prefix TEXT DEFAULT 'INV-',
  suffix_format TEXT, -- Optional: e.g., '-YYYY' for year-based
  padding INTEGER DEFAULT 5, -- Zero-padding: 00001, 00002, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.invoice_number_sequences IS 'Tracks sequential invoice numbering per organization';
COMMENT ON COLUMN public.invoice_number_sequences.prefix IS 'Invoice number prefix (e.g., INV-)';
COMMENT ON COLUMN public.invoice_number_sequences.padding IS 'Number of digits to zero-pad (e.g., 5 = 00001)';

-- =============================================
-- 3. INVOICES TABLE
-- Main invoice records
-- =============================================

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,

  -- Invoice identification
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,

  -- Payment method and status
  payment_method payment_method_type NOT NULL,
  status invoice_status_type NOT NULL DEFAULT 'draft',

  -- Financial amounts (calculated from line items)
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax_rate DECIMAL(5,4) DEFAULT 0 CHECK (tax_rate >= 0 AND tax_rate <= 1),
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  discount_amount DECIMAL(12,2) DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  amount_due DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (amount_due >= 0),

  -- Stripe payment link fields
  stripe_invoice_id TEXT,
  stripe_payment_link_url TEXT,
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  stripe_metadata JSONB, -- Store additional Stripe data

  -- COD (Cash on Delivery) fields
  cod_collected_by TEXT, -- Name of person who collected
  cod_collection_method cod_collection_method_type,
  cod_receipt_number TEXT,
  cod_collected_at TIMESTAMPTZ,
  cod_notes TEXT,

  -- Invoice content
  notes TEXT,
  terms_and_conditions TEXT,
  footer_text TEXT,

  -- State change tracking
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  first_payment_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,

  -- Audit fields
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_invoice_number_per_org UNIQUE (org_id, invoice_number),
  CONSTRAINT valid_amounts CHECK (total_amount = subtotal + tax_amount - discount_amount),
  CONSTRAINT valid_payment CHECK (amount_paid <= total_amount),
  CONSTRAINT stripe_fields_for_stripe_method CHECK (
    payment_method != 'stripe_link' OR stripe_payment_link_url IS NOT NULL
  ),
  CONSTRAINT cod_fields_for_cod_method CHECK (
    payment_method != 'cod' OR (cod_collected_by IS NOT NULL AND cod_collection_method IS NOT NULL)
  )
);

COMMENT ON TABLE public.invoices IS 'Main invoices table supporting COD, Stripe, and Net Terms payment methods';
COMMENT ON COLUMN public.invoices.payment_method IS 'How payment will be collected: cod, stripe_link, or net_terms';
COMMENT ON COLUMN public.invoices.status IS 'Current invoice status in the payment workflow';
COMMENT ON COLUMN public.invoices.amount_due IS 'Calculated as total_amount - amount_paid';

-- =============================================
-- 4. INVOICE LINE ITEMS TABLE
-- Individual line items on invoices
-- =============================================

CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL, -- NULL for custom line items

  -- Line item details
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
  amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),

  -- Optional tax per line item
  tax_rate DECIMAL(5,4) DEFAULT 0 CHECK (tax_rate >= 0 AND tax_rate <= 1),
  tax_amount DECIMAL(12,2) DEFAULT 0 CHECK (tax_amount >= 0),

  -- Line ordering
  line_order INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_line_amount CHECK (amount = quantity * unit_price)
);

COMMENT ON TABLE public.invoice_line_items IS 'Individual line items for invoices - supports grouping multiple orders on one invoice';
COMMENT ON COLUMN public.invoice_line_items.order_id IS 'Optional reference to order - NULL for custom line items like fees or discounts';

-- =============================================
-- 5. PAYMENTS TABLE
-- Track all payments received (supports partial payments)
-- =============================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Payment details
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  payment_method payment_type NOT NULL,

  -- Reference information
  reference_number TEXT, -- Check number, transaction ID, etc.
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,

  -- Reconciliation
  is_reconciled BOOLEAN DEFAULT false,
  reconciled_at TIMESTAMPTZ,
  reconciled_by UUID REFERENCES public.profiles(id),

  -- Notes
  notes TEXT,

  -- Audit fields
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.payments IS 'Individual payment records - supports partial payments toward invoices';
COMMENT ON COLUMN public.payments.reference_number IS 'Check number, wire confirmation, transaction ID, etc.';
COMMENT ON COLUMN public.payments.is_reconciled IS 'Whether payment has been reconciled with bank statement';

-- =============================================
-- 6. INDEXES FOR PERFORMANCE
-- =============================================

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON public.invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_method ON public.invoices(payment_method);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON public.invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_invoice_id ON public.invoices(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_invoices_org_status_due ON public.invoices(org_id, status, due_date);

-- Invoice line items indexes
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON public.invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_order_id ON public.invoice_line_items(order_id) WHERE order_id IS NOT NULL;

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_org_id ON public.payments(org_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_reconciled ON public.payments(is_reconciled, reconciled_at);

-- =============================================
-- 7. HELPER FUNCTIONS
-- =============================================

-- Function to generate next invoice number for an org
CREATE OR REPLACE FUNCTION public.generate_invoice_number(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_sequence RECORD;
  v_next_number INTEGER;
  v_invoice_number TEXT;
  v_year TEXT;
BEGIN
  -- Get or create sequence for this org
  INSERT INTO public.invoice_number_sequences (org_id)
  VALUES (p_org_id)
  ON CONFLICT (org_id) DO NOTHING;

  -- Lock the row and increment
  UPDATE public.invoice_number_sequences
  SET last_invoice_number = last_invoice_number + 1,
      updated_at = NOW()
  WHERE org_id = p_org_id
  RETURNING * INTO v_sequence;

  v_next_number := v_sequence.last_invoice_number;

  -- Build invoice number with prefix and padding
  v_invoice_number := v_sequence.prefix || LPAD(v_next_number::TEXT, v_sequence.padding, '0');

  -- Add suffix if configured (e.g., year)
  IF v_sequence.suffix_format IS NOT NULL THEN
    v_year := TO_CHAR(CURRENT_DATE, v_sequence.suffix_format);
    v_invoice_number := v_invoice_number || v_year;
  END IF;

  RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.generate_invoice_number IS 'Generates sequential invoice number for an organization';

-- Function to calculate invoice totals from line items
CREATE OR REPLACE FUNCTION public.calculate_invoice_totals(p_invoice_id UUID)
RETURNS void AS $$
DECLARE
  v_subtotal DECIMAL(12,2);
  v_tax_amount DECIMAL(12,2);
  v_total_amount DECIMAL(12,2);
  v_invoice_tax_rate DECIMAL(5,4);
  v_discount DECIMAL(12,2);
BEGIN
  -- Get invoice tax rate and discount
  SELECT tax_rate, discount_amount
  INTO v_invoice_tax_rate, v_discount
  FROM public.invoices
  WHERE id = p_invoice_id;

  -- Calculate subtotal from line items
  SELECT COALESCE(SUM(amount), 0)
  INTO v_subtotal
  FROM public.invoice_line_items
  WHERE invoice_id = p_invoice_id;

  -- Calculate tax (on subtotal after discount)
  v_tax_amount := ROUND((v_subtotal - COALESCE(v_discount, 0)) * COALESCE(v_invoice_tax_rate, 0), 2);

  -- Calculate total
  v_total_amount := v_subtotal - COALESCE(v_discount, 0) + v_tax_amount;

  -- Update invoice
  UPDATE public.invoices
  SET subtotal = v_subtotal,
      tax_amount = v_tax_amount,
      total_amount = v_total_amount,
      updated_at = NOW()
  WHERE id = p_invoice_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.calculate_invoice_totals IS 'Recalculates invoice totals from line items';

-- Function to update invoice payment status
CREATE OR REPLACE FUNCTION public.update_invoice_payment_status(p_invoice_id UUID)
RETURNS void AS $$
DECLARE
  v_total_amount DECIMAL(12,2);
  v_amount_paid DECIMAL(12,2);
  v_amount_due DECIMAL(12,2);
  v_due_date DATE;
  v_current_status invoice_status_type;
  v_new_status invoice_status_type;
BEGIN
  -- Get invoice details
  SELECT total_amount, due_date, status
  INTO v_total_amount, v_due_date, v_current_status
  FROM public.invoices
  WHERE id = p_invoice_id;

  -- Calculate total payments
  SELECT COALESCE(SUM(amount), 0)
  INTO v_amount_paid
  FROM public.payments
  WHERE invoice_id = p_invoice_id;

  -- Calculate amount due
  v_amount_due := v_total_amount - v_amount_paid;

  -- Determine new status
  IF v_amount_paid >= v_total_amount THEN
    v_new_status := 'paid';
  ELSIF v_amount_paid > 0 THEN
    v_new_status := 'partially_paid';
  ELSIF v_due_date < CURRENT_DATE AND v_current_status NOT IN ('draft', 'cancelled', 'void') THEN
    v_new_status := 'overdue';
  ELSE
    v_new_status := v_current_status;
  END IF;

  -- Update invoice
  UPDATE public.invoices
  SET amount_paid = v_amount_paid,
      amount_due = v_amount_due,
      status = v_new_status,
      paid_at = CASE WHEN v_new_status = 'paid' AND paid_at IS NULL THEN NOW() ELSE paid_at END,
      first_payment_at = CASE WHEN v_amount_paid > 0 AND first_payment_at IS NULL THEN NOW() ELSE first_payment_at END,
      updated_at = NOW()
  WHERE id = p_invoice_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_invoice_payment_status IS 'Updates invoice payment amounts and status based on payments received';

-- Function to calculate invoice aging (days overdue)
CREATE OR REPLACE FUNCTION public.invoice_days_overdue(p_invoice_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_due_date DATE;
  v_status invoice_status_type;
  v_days_overdue INTEGER;
BEGIN
  SELECT due_date, status
  INTO v_due_date, v_status
  FROM public.invoices
  WHERE id = p_invoice_id;

  -- Only calculate overdue for unpaid/partially paid invoices
  IF v_status IN ('sent', 'viewed', 'partially_paid', 'overdue') AND v_due_date < CURRENT_DATE THEN
    v_days_overdue := CURRENT_DATE - v_due_date;
    RETURN v_days_overdue;
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.invoice_days_overdue IS 'Calculates number of days an invoice is overdue';

-- =============================================
-- 8. TRIGGERS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_invoicing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_invoicing_updated_at();

CREATE TRIGGER update_invoice_line_items_updated_at
  BEFORE UPDATE ON public.invoice_line_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_invoicing_updated_at();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_invoicing_updated_at();

CREATE TRIGGER update_invoice_number_sequences_updated_at
  BEFORE UPDATE ON public.invoice_number_sequences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_invoicing_updated_at();

-- Auto-calculate line item amounts
CREATE OR REPLACE FUNCTION public.calculate_line_item_amount()
RETURNS TRIGGER AS $$
BEGIN
  NEW.amount := NEW.quantity * NEW.unit_price;
  NEW.tax_amount := ROUND(NEW.amount * COALESCE(NEW.tax_rate, 0), 2);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_line_item_amount_trigger
  BEFORE INSERT OR UPDATE ON public.invoice_line_items
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_line_item_amount();

-- Auto-recalculate invoice totals when line items change
CREATE OR REPLACE FUNCTION public.recalculate_invoice_on_line_item_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.calculate_invoice_totals(OLD.invoice_id);
    PERFORM public.update_invoice_payment_status(OLD.invoice_id);
    RETURN OLD;
  ELSE
    PERFORM public.calculate_invoice_totals(NEW.invoice_id);
    PERFORM public.update_invoice_payment_status(NEW.invoice_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalculate_invoice_on_line_item_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.invoice_line_items
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_invoice_on_line_item_change();

-- Auto-update invoice status when payment is added/modified
CREATE OR REPLACE FUNCTION public.update_invoice_on_payment_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.update_invoice_payment_status(OLD.invoice_id);
    RETURN OLD;
  ELSE
    PERFORM public.update_invoice_payment_status(NEW.invoice_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_on_payment_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_invoice_on_payment_change();

-- Auto-generate invoice number on insert if not provided
CREATE OR REPLACE FUNCTION public.auto_generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := public.generate_invoice_number(NEW.org_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_invoice_number_trigger
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_invoice_number();

-- =============================================
-- 9. VIEWS
-- =============================================

-- Outstanding invoices view
CREATE OR REPLACE VIEW public.outstanding_invoices AS
SELECT
  i.id,
  i.org_id,
  i.client_id,
  c.company_name AS client_name,
  i.invoice_number,
  i.invoice_date,
  i.due_date,
  i.payment_method,
  i.status,
  i.total_amount,
  i.amount_paid,
  i.amount_due,
  CURRENT_DATE - i.due_date AS days_overdue,
  CASE
    WHEN CURRENT_DATE - i.due_date <= 0 THEN 'current'
    WHEN CURRENT_DATE - i.due_date BETWEEN 1 AND 30 THEN '1-30'
    WHEN CURRENT_DATE - i.due_date BETWEEN 31 AND 60 THEN '31-60'
    WHEN CURRENT_DATE - i.due_date BETWEEN 61 AND 90 THEN '61-90'
    ELSE '90+'
  END AS aging_bucket
FROM public.invoices i
JOIN public.clients c ON i.client_id = c.id
WHERE i.status IN ('sent', 'viewed', 'partially_paid', 'overdue')
  AND i.amount_due > 0;

COMMENT ON VIEW public.outstanding_invoices IS 'All unpaid and partially paid invoices with aging information';

-- Invoice aging report view
CREATE OR REPLACE VIEW public.invoice_aging_report AS
SELECT
  i.org_id,
  i.client_id,
  c.company_name AS client_name,
  c.email AS client_email,
  c.payment_terms,
  COUNT(*) AS total_outstanding_invoices,
  SUM(i.amount_due) AS total_outstanding_amount,
  SUM(CASE WHEN CURRENT_DATE <= i.due_date THEN i.amount_due ELSE 0 END) AS current_amount,
  SUM(CASE WHEN CURRENT_DATE - i.due_date BETWEEN 1 AND 30 THEN i.amount_due ELSE 0 END) AS aged_1_30,
  SUM(CASE WHEN CURRENT_DATE - i.due_date BETWEEN 31 AND 60 THEN i.amount_due ELSE 0 END) AS aged_31_60,
  SUM(CASE WHEN CURRENT_DATE - i.due_date BETWEEN 61 AND 90 THEN i.amount_due ELSE 0 END) AS aged_61_90,
  SUM(CASE WHEN CURRENT_DATE - i.due_date > 90 THEN i.amount_due ELSE 0 END) AS aged_90_plus,
  MIN(i.due_date) AS oldest_invoice_date,
  MAX(i.due_date) AS newest_invoice_date
FROM public.invoices i
JOIN public.clients c ON i.client_id = c.id
WHERE i.status IN ('sent', 'viewed', 'partially_paid', 'overdue')
  AND i.amount_due > 0
GROUP BY i.org_id, i.client_id, c.company_name, c.email, c.payment_terms;

COMMENT ON VIEW public.invoice_aging_report IS 'Accounts receivable aging report by client (30/60/90 days)';

-- Client payment history view
CREATE OR REPLACE VIEW public.client_payment_history AS
SELECT
  c.id AS client_id,
  c.company_name,
  c.payment_terms,
  COUNT(DISTINCT i.id) AS total_invoices,
  COUNT(DISTINCT CASE WHEN i.status = 'paid' THEN i.id END) AS paid_invoices,
  COUNT(DISTINCT CASE WHEN i.status IN ('sent', 'viewed', 'partially_paid', 'overdue') THEN i.id END) AS outstanding_invoices,
  SUM(i.total_amount) AS total_invoiced,
  SUM(i.amount_paid) AS total_paid,
  SUM(i.amount_due) AS total_outstanding,
  AVG(CASE
    WHEN i.status = 'paid' THEN i.paid_at::DATE - i.invoice_date
  END) AS avg_days_to_pay,
  COUNT(CASE WHEN i.status = 'overdue' THEN 1 END) AS overdue_count,
  MAX(i.invoice_date) AS last_invoice_date,
  MAX(CASE WHEN i.status = 'paid' THEN i.paid_at END) AS last_payment_date
FROM public.clients c
LEFT JOIN public.invoices i ON c.id = i.client_id
GROUP BY c.id, c.company_name, c.payment_terms;

COMMENT ON VIEW public.client_payment_history IS 'Payment performance metrics by client';

-- Revenue recognition view (for accrual accounting)
CREATE OR REPLACE VIEW public.revenue_recognition AS
SELECT
  i.org_id,
  DATE_TRUNC('month', i.invoice_date) AS revenue_month,
  i.payment_method,
  i.status,
  COUNT(*) AS invoice_count,
  SUM(i.total_amount) AS total_invoiced,
  SUM(i.amount_paid) AS total_collected,
  SUM(i.amount_due) AS total_outstanding,
  SUM(CASE WHEN i.status = 'paid' THEN i.total_amount ELSE 0 END) AS recognized_revenue,
  SUM(CASE WHEN i.status IN ('sent', 'viewed', 'partially_paid', 'overdue') THEN i.total_amount ELSE 0 END) AS deferred_revenue
FROM public.invoices i
WHERE i.status NOT IN ('draft', 'cancelled', 'void')
GROUP BY i.org_id, DATE_TRUNC('month', i.invoice_date), i.payment_method, i.status;

COMMENT ON VIEW public.revenue_recognition IS 'Revenue recognition by month and payment method';

-- =============================================
-- 10. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.invoice_number_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Invoice number sequences policies
CREATE POLICY "Users can view their org's invoice sequences"
  ON public.invoice_number_sequences FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org's invoice sequences"
  ON public.invoice_number_sequences FOR ALL
  TO authenticated
  USING (
    org_id IN (
      SELECT id FROM public.profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Invoices policies
CREATE POLICY "Users can view their org's invoices"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create invoices for their org"
  ON public.invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their org's invoices"
  ON public.invoices FOR UPDATE
  TO authenticated
  USING (
    org_id IN (
      SELECT id FROM public.profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their org's invoices"
  ON public.invoices FOR DELETE
  TO authenticated
  USING (
    org_id IN (
      SELECT id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Invoice line items policies (access through invoice's org_id)
CREATE POLICY "Users can view line items for their org's invoices"
  ON public.invoice_line_items FOR SELECT
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices
      WHERE org_id IN (SELECT id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can manage line items for their org's invoices"
  ON public.invoice_line_items FOR ALL
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices
      WHERE org_id IN (SELECT id FROM public.profiles WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM public.invoices
      WHERE org_id IN (SELECT id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Payments policies
CREATE POLICY "Users can view their org's payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org's payments"
  ON public.payments FOR ALL
  TO authenticated
  USING (
    org_id IN (
      SELECT id FROM public.profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- =============================================
-- 11. SAMPLE DATA SEED (OPTIONAL - COMMENTED OUT)
-- =============================================

-- Uncomment to seed sample invoice number sequences
/*
INSERT INTO public.invoice_number_sequences (org_id, prefix, padding)
SELECT id, 'INV-', 5
FROM public.profiles
ON CONFLICT (org_id) DO NOTHING;
*/

-- =============================================
-- 12. VERIFICATION FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.verify_invoicing_setup()
RETURNS TABLE (
  component VARCHAR,
  count BIGINT,
  status VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'Invoices'::VARCHAR,
    COUNT(*)::BIGINT,
    'OK'::VARCHAR
  FROM public.invoices
  UNION ALL
  SELECT
    'Invoice Line Items'::VARCHAR,
    COUNT(*)::BIGINT,
    'OK'::VARCHAR
  FROM public.invoice_line_items
  UNION ALL
  SELECT
    'Payments'::VARCHAR,
    COUNT(*)::BIGINT,
    'OK'::VARCHAR
  FROM public.payments
  UNION ALL
  SELECT
    'Invoice Number Sequences'::VARCHAR,
    COUNT(*)::BIGINT,
    'OK'::VARCHAR
  FROM public.invoice_number_sequences;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.verify_invoicing_setup IS 'Verifies that invoicing system is properly set up';

-- =============================================
-- Run verification (optional)
-- =============================================

-- SELECT * FROM public.verify_invoicing_setup();

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- This migration creates a complete invoicing system with:
-- 1. Support for COD, Stripe, and Net Terms payment methods
-- 2. Auto-generating sequential invoice numbers per org
-- 3. Multi-line invoices (group multiple orders)
-- 4. Partial payment tracking
-- 5. Automatic status updates based on payments
-- 6. Aging reports (30/60/90 days)
-- 7. Revenue recognition views
-- 8. Full RLS for multi-tenancy
-- 9. Comprehensive indexing for performance
-- =============================================
